using VCMTradingDesk.DTOs.PnLCalculationEngine;

namespace VCMTradingDesk.Repos.IncrementalPositionLoader
{
    public interface IIncrementalPositionLoader
    {
            Task<List<EodSnapshotRecordDto>> GetOrBackfillSnapshotsAsync(DateOnly targetDate);
    }
}
