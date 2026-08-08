using VCMTradingDesk.DTOs.PnLCalculationEngine;
using VCMTradingDesk.Models;

namespace VCMTradingDesk.Repos.PnLCalculatorEngine
{
    public interface IPnLCalculatorEngine
    {       
            void ApplyTrade(SecurityPositionState state, Trade trade);
            EodSnapshotRecordDto BuildSnapshot(SecurityPositionState state, DateOnly valuationDate, decimal closePrice);      
    }
}
