using Microsoft.EntityFrameworkCore;
using VCM_DataAccess.DataAccess;
using VCM_Models.DTOs.Securities;
using VCM_Models.Models;

namespace VCM_DataAccess.Repos.SecuritiesView
{
    public class AssetSummaryRepo : IAssetSummaryRepo
    {
        private readonly VCMDbContext _dbContext;

        public AssetSummaryRepo(VCMDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<AssetSummaryDto>> GetAssetSummariesAsync(DateOnly? asOfDate = null)
        {
            try
            {
                // Default date fallback to 31st March 2026 gits
                var effectiveDate = asOfDate ?? new DateOnly(2026, 3, 31);

                return await _dbContext.Securities
                    .AsNoTracking()
                    .Select(s => new AssetSummaryDto
                    {
                        SecurityId = s.SecurityId,
                        SecurityName = s.SecurityName ?? string.Empty,
                        AssetClass = s.AssetClass ?? string.Empty,
                        Category = s.Category ?? string.Empty,
                        FaceValue = s.FaceValue,
                        CouponRatePct = s.CouponRatePct,
                        MaturityDate = s.MaturityDate != null ? s.MaturityDate.Value.ToDateTime(TimeOnly.MinValue) : null,
                        StartPrice = s.StartPrice,

                        // Desk Activity Aggregations (Filtered up to effectiveDate)
                        TotalTrades = _dbContext.Trades
                            .Count(t => t.SecurityId == s.SecurityId && t.TradeDate <= effectiveDate),

                        BuyCount = _dbContext.Trades
                            .Count(t => t.SecurityId == s.SecurityId && t.BuySell.ToUpper() == "BUY" && t.TradeDate <= effectiveDate),

                        SellCount = _dbContext.Trades
                            .Count(t => t.SecurityId == s.SecurityId && t.BuySell.ToUpper() == "SELL" && t.TradeDate <= effectiveDate),

                        TotalBuyVolume = _dbContext.Trades
                            .Where(t => t.SecurityId == s.SecurityId && t.BuySell.ToUpper() == "BUY" && t.TradeDate <= effectiveDate)
                            .Sum(t => (long?)t.Quantity) ?? 0L,

                        TotalSellVolume = _dbContext.Trades
                            .Where(t => t.SecurityId == s.SecurityId && t.BuySell.ToUpper() == "SELL" && t.TradeDate <= effectiveDate)
                            .Sum(t => (long?)t.Quantity) ?? 0L,

                        TotalTradedValue = _dbContext.Trades
                            .Where(t => t.SecurityId == s.SecurityId && t.TradeDate <= effectiveDate)
                            .Sum(t => (decimal?)(t.Quantity * t.Price)) ?? 0m
                    })
                    .OrderBy(s => s.SecurityId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to compute asset summaries as of {asOfDate}: {ex.Message}", ex);
            }
        }

    }
}
