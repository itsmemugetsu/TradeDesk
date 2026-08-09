using VCM_Models.DTOs.PnLCalculationEngine;
using VCM_Models.Models;


namespace VCM_DataAccess.Repos.PnLCalculatorEngine
{
    public interface IPnLCalculatorEngine
    {       
         void ApplyTrade(SecurityPositionState state, Trade trade);
        EodSnapshotRecordDto BuildSnapshot(SecurityPositionState state, DateOnly valuationDate, decimal closePrice);      
    }
}
