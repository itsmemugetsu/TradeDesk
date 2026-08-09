using VCM_Models.DTOs.PnLCalculationEngine;

namespace VCM_DataAccess.Repos.IncrementalPositionLoader
{
    public interface IIncrementalPositionLoader
    {
            Task<List<EodSnapshotRecordDto>> GetOrBackfillSnapshotsAsync(DateOnly targetDate);
    }
}
