using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;
using VCM_DataAccess.DataAccess;
using VCM_Models.Models;
using VCM_Models.DTOs.PnLCalculationEngine;
using VCM_DataAccess.Repos.PnLCalculatorEngine;

namespace VCM_DataAccess.Repos.IncrementalPositionLoader
{
    public class IncrementalPositionLoaderRepo : IIncrementalPositionLoader
    {
        private readonly VCMDbContext _dbContext;
        private readonly IPnLCalculatorEngine _calculator;

        public IncrementalPositionLoaderRepo(VCMDbContext dbContext, IPnLCalculatorEngine calculator)
        {
            _dbContext = dbContext;
            _calculator = calculator;
        }

        public async Task<List<EodSnapshotRecordDto>> GetOrBackfillSnapshotsAsync(DateOnly targetDate)
        {
            var effectiveDate = await _dbContext.EodPrices
            .AsNoTracking()
            .Where(p => p.PriceDate <= targetDate)
            .MaxAsync(p => (DateOnly?)p.PriceDate);

            targetDate = effectiveDate ?? targetDate;

            //Check if snapshots already exist
            var existingSnapshots = await (from s in _dbContext.EodSnapshots.AsNoTracking()
            join sec in _dbContext.Securities.AsNoTracking() on s.SecurityId equals sec.SecurityId
            where s.ValuationDate == targetDate
            select new EodSnapshotRecordDto
            {
                ValuationDate = s.ValuationDate,
                SecurityId = s.SecurityId,
                SecurityName = sec.SecurityName ?? string.Empty,
                AssetClass = sec.AssetClass ?? string.Empty,
                NetQuantity = s.NetQuantity,
                WeightedAvgCost = s.WeightedAvgCost,
                CumulativeRealizedPnL = s.RealizedPnL,
                UnrealizedPnL = s.UnrealizedPnL,
                TotalPnL = s.TotalPnL,
                ClosePrice = s.ClosePrice
            }).ToListAsync();

            if (existingSnapshots.Any())
            {
                return existingSnapshots;
            }

            //Determine unbuilt business dates
            DateOnly? lastSnapshottedDate = await _dbContext.EodSnapshots
                .MaxAsync(s => (DateOnly?)s.ValuationDate);

            var datesToProcess = await _dbContext.EodPrices
                .AsNoTracking()
                .Where(p => p.PriceDate <= targetDate &&
                           (!lastSnapshottedDate.HasValue || p.PriceDate > lastSnapshottedDate.Value))
                .Select(p => p.PriceDate)
                .Distinct()
                .OrderBy(d => d)
                .ToListAsync();

            if (!datesToProcess.Any())
            {
                return new List<EodSnapshotRecordDto>();
            }

            DateOnly minDate = datesToProcess.First();
            DateOnly maxDate = datesToProcess.Last();

            // Get ALL trades for date range in 1 query
            var allTradesByDate = (await _dbContext.Trades
                .AsNoTracking()
                .Where(t => t.TradeDate >= minDate && t.TradeDate <= maxDate)
                .OrderBy(t => t.TradeDate)
                .ThenBy(t => t.TradeId)
                .ToListAsync())
                .GroupBy(t => t.TradeDate)
                .ToDictionary(g => g.Key, g => g.ToList());

            // Get ALL prices for date range in 1 query 
            var allPricesLookup = await _dbContext.EodPrices
                .AsNoTracking()
                .Where(p => p.PriceDate >= minDate && p.PriceDate <= maxDate)
                .ToDictionaryAsync(p => (p.PriceDate, p.SecurityId), p => p.ClosePrice);

            // Fetch Securities with Metadata (SecurityName & AssetClass)
            var securitiesMetadata = await _dbContext.Securities
                .AsNoTracking()
                .ToDictionaryAsync(s => s.SecurityId, s => new { s.SecurityName, s.AssetClass });


            var securities = securitiesMetadata.Keys.ToList();

            // Get starting position states directly into SecurityPositionState 
            var stateTracker = new Dictionary<string, SecurityPositionState>();

            if (lastSnapshottedDate.HasValue)
            {
                var previousStates = await _dbContext.EodSnapshots
                    .AsNoTracking()
                    .Where(s => s.ValuationDate == lastSnapshottedDate.Value)
                    .Select(s => new SecurityPositionState
                    {
                        SecurityId = s.SecurityId,
                        NetQuantity = s.NetQuantity,
                        WeightedAvgCost = s.WeightedAvgCost,
                        CumulativeRealizedPnL = s.RealizedPnL
                    })
                    .ToDictionaryAsync(s => s.SecurityId);

                foreach (var secId in securities)
                {
                    if (previousStates.TryGetValue(secId, out var prev))
                    {
                        stateTracker[secId] = prev;
                    }
                    else
                    {
                        stateTracker[secId] = new SecurityPositionState { SecurityId = secId };
                    }
                }
            }
            else
            {
                foreach (var secId in securities)
                {
                    stateTracker[secId] = new SecurityPositionState { SecurityId = secId };
                }
            }

            var allNewSnapshots = new List<EodSnapshotRecordDto>();

            // In-Memory Daily Loop
            foreach (var currentDate in datesToProcess)
            {
                if (allTradesByDate.TryGetValue(currentDate, out var todaysTrades))
                {
                    foreach (var trade in todaysTrades)
                    {
                        if (stateTracker.TryGetValue(trade.SecurityId, out var state))
                        {
                          await _calculator.ApplyTradeAsync(state, trade);
                        }
                    }
                }

                foreach (var secId in securities)
                {
                    var state = stateTracker[secId];
                    decimal closePrice = allPricesLookup.TryGetValue((currentDate, secId), out var price) ? price : 0m;


                    var snapshotDto = await _calculator.BuildSnapshotAsync(state, currentDate, closePrice);

                    // Attach SecurityName & AssetClass from in-memory lookup

                    if (securitiesMetadata.TryGetValue(secId, out var meta))
                    {
                        snapshotDto.SecurityName = meta.SecurityName ?? string.Empty;
                        snapshotDto.AssetClass = meta.AssetClass ?? string.Empty;
                    }

                    allNewSnapshots.Add(snapshotDto);
                }
            }

            // Bulk Persist to DB using TVP Stored Procedure
            await SaveSnapshotsBatchViaTvpAsync(allNewSnapshots);

            // Return targetDate snapshots
            return allNewSnapshots
                .Where(s => s.ValuationDate == targetDate)
                .ToList();
        }
        private async Task SaveSnapshotsBatchViaTvpAsync(List<EodSnapshotRecordDto> snapshotRecords)
        {
            var table = new DataTable();
            table.Columns.Add("ValuationDate", typeof(DateOnly));
            table.Columns.Add("SecurityId", typeof(string));
            table.Columns.Add("NetQuantity", typeof(int));
            table.Columns.Add("WeightedAvgCost", typeof(decimal));
            table.Columns.Add("RealizedPnL", typeof(decimal));
            table.Columns.Add("UnrealizedPnL", typeof(decimal));
            table.Columns.Add("TotalPnL", typeof(decimal));
            table.Columns.Add("ClosePrice", typeof(decimal));

            foreach (var item in snapshotRecords)
            {
                table.Rows.Add(
                    item.ValuationDate,
                    item.SecurityId,
                    item.NetQuantity,
                    item.WeightedAvgCost,
                    item.CumulativeRealizedPnL,
                    item.UnrealizedPnL,
                    item.TotalPnL,
                    item.ClosePrice
                );
            }

            var tvpParam = new SqlParameter("@Snapshots", SqlDbType.Structured)
            {
                TypeName = "dbo.EODPositionSnapshotType",
                Value = table
            };

            await _dbContext.Database.ExecuteSqlRawAsync(
                "EXEC dbo.sp_SaveEODPositionSnapshotsBatch @Snapshots",
                tvpParam
            );
        }
        public async Task<List<PnLTrajectoryPointDto>> GetEquityCurveTrajectoryAsync(
    DateOnly asOfDate,
    string? assetClass = null,
    string? securityId = null)
        {
            try
            {
                var startDate = new DateOnly(2026, 2, 2);

                // Base Query joining EOD_Snapshots with Securities table
                var query = from snap in _dbContext.EodSnapshots.AsNoTracking()
                            join sec in _dbContext.Securities.AsNoTracking()
                            on snap.SecurityId equals sec.SecurityId
                            where snap.ValuationDate >= startDate && snap.ValuationDate <= asOfDate
                            select new { snap, sec };

                // Apply Asset Class Filter
                if (!string.IsNullOrWhiteSpace(assetClass) && assetClass.ToUpper() != "ALL")
                {
                    query = query.Where(x => x.sec.AssetClass.ToUpper() == assetClass.ToUpper());
                }

                // Apply Security ID / Search Filter
                if (!string.IsNullOrWhiteSpace(securityId) && securityId.ToUpper() != "ALL")
                {
                    var search = securityId.Trim().ToLower();
                    query = query.Where(x => x.snap.SecurityId.ToLower().Contains(search) ||
                                             x.sec.SecurityName.ToLower().Contains(search));
                }

                // Aggregate daily totals for the filtered scope
                return await query
                    .GroupBy(x => x.snap.ValuationDate)
                    .Select(g => new PnLTrajectoryPointDto
                    {
                        ValuationDate = g.Key,
                        NetCombinedPnL = g.Sum(x => (decimal?)x.snap.TotalPnL) ?? 0m,
                        RealizedPnL = g.Sum(x => (decimal?)x.snap.RealizedPnL) ?? 0m,
                        UnrealizedPnL = g.Sum(x => (decimal?)x.snap.UnrealizedPnL) ?? 0m
                    })
                    .OrderBy(x => x.ValuationDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to fetch equity curve trajectory: {ex.Message}", ex);
            }
        }
    }
}
