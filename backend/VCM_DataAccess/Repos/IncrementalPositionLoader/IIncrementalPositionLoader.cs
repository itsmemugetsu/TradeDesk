using VCM_Models.DTOs.PnLCalculationEngine;

namespace VCM_DataAccess.Repos.IncrementalPositionLoader
{
    public interface IIncrementalPositionLoader
    {
        Task<List<EodSnapshotRecordDto>> GetSnapshotsByDateAsync(DateOnly targetDate);
        Task<List<EodSnapshotRecordDto>> GetOrBackfillSnapshotsAsync(DateOnly targetDate);
        Task<List<PnLTrajectoryPointDto>> GetEquityCurveTrajectoryAsync(
        DateOnly asOfDate,
        string? assetClass = null,
        string? securityId = null);
        }
}
