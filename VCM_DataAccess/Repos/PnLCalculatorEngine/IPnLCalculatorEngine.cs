using VCM_Models.DTOs.PnLCalculationEngine;
using VCM_Models.Models;


namespace VCM_DataAccess.Repos.PnLCalculatorEngine
{
    public interface IPnLCalculatorEngine
    {
        Task ApplyTradeAsync(SecurityPositionState state, Trade trade);
        Task<EodSnapshotRecordDto> BuildSnapshotAsync(SecurityPositionState state, DateOnly valuationDate, decimal closePrice);
    }
}
