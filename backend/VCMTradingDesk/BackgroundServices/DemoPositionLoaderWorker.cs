using Microsoft.EntityFrameworkCore;
using VCM_DataAccess.DataAccess;
using VCM_DataAccess.Repos.IncrementalPositionLoader;

namespace VCMTradingDesk.BackgroundServices
{
    public class DemoPositionLoaderWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<DemoPositionLoaderWorker> _logger;

        public DemoPositionLoaderWorker(
            IServiceScopeFactory scopeFactory,
            ILogger<DemoPositionLoaderWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DEMO WORKER: Starting background incremental position loader worker...");

            var startDate = new DateOnly(2026, 2, 2);
            var maxDate = new DateOnly(2026, 3, 31);

            List<DateOnly> missingDates;

            // Inspect SQL Server to find which dates are missing
            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<VCMDbContext>();

                var allPriceDates = await dbContext.EodPrices
                    .AsNoTracking()
                    .Where(p => p.PriceDate >= startDate && p.PriceDate <= maxDate)
                    .Select(p => p.PriceDate)
                    .Distinct()
                    .OrderBy(d => d)
                    .ToListAsync(stoppingToken);

                var existingSnapshotDates = await dbContext.EodSnapshots
                    .AsNoTracking()
                    .Select(s => s.ValuationDate)
                    .Distinct()
                    .ToListAsync(stoppingToken);

                var existingSet = new HashSet<DateOnly>(existingSnapshotDates);

                missingDates = allPriceDates.Where(d => !existingSet.Contains(d)).ToList();
            }

            // If all dates are populated, log and exit loop
            if (!missingDates.Any())
            {
                _logger.LogInformation("DEMO WORKER: All position snapshots up to {MaxDate} are already populated. Worker idle.", maxDate);
                return;
            }

            _logger.LogInformation("DEMO WORKER: Found {Count} unprocessed dates. Starting 5-second playback incremental ingestion...", missingDates.Count);

            // Process missing dates 1-by-1 with a 5-second interval
            foreach (var currentDate in missingDates)
            {
                if (stoppingToken.IsCancellationRequested) break;

                try
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var loader = scope.ServiceProvider.GetRequiredService<IIncrementalPositionLoader>();

                        _logger.LogInformation("DEMO WORKER: Processing incremental load for Date: {CurrentDate}", currentDate);
                        await loader.GetOrBackfillSnapshotsAsync(currentDate);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "DEMO WORKER: Error processing date: {CurrentDate}", currentDate);
                }

                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }
            }

            _logger.LogInformation("DEMO WORKER: Playback processing complete. All position snapshots are populated.");
        }
    }
}