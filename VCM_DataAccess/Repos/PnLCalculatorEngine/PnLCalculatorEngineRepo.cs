using VCM_Models.DTOs.PnLCalculationEngine;
using VCM_Models.Models;

namespace VCM_DataAccess.Repos.PnLCalculatorEngine
{
    public class PnLCalculatorEngineRepo : IPnLCalculatorEngine
    { 
        public void ApplyTrade(SecurityPositionState state, Trade trade)
        {
            if (state == null || trade == null || string.IsNullOrWhiteSpace(trade.BuySell))
            {
                return; 
            }

            if (trade.BuySell.Equals("BUY", StringComparison.OrdinalIgnoreCase))
            {
                int newQty = state.NetQuantity + trade.Quantity;

                decimal newAvgCost = newQty == 0
                    ? 0m
                    : ((state.NetQuantity * state.WeightedAvgCost) + (trade.Quantity * trade.Price)) / newQty;

                state.NetQuantity = newQty;
                state.WeightedAvgCost = newAvgCost;
            }
            else if (trade.BuySell.Equals("SELL", StringComparison.OrdinalIgnoreCase))
            {
                decimal tradeRealizedPnL = (trade.Price - state.WeightedAvgCost) * trade.Quantity;

                state.CumulativeRealizedPnL += tradeRealizedPnL;
                state.NetQuantity -= trade.Quantity;
            }
        }

        public EodSnapshotRecordDto BuildSnapshot(SecurityPositionState state, DateOnly valuationDate, decimal closePrice)
        {
            decimal unrealizedPnL = (closePrice - state.WeightedAvgCost) * state.NetQuantity;
            decimal totalPnL = state.CumulativeRealizedPnL + unrealizedPnL;

            return new EodSnapshotRecordDto
            {
                ValuationDate = valuationDate,
                SecurityId = state.SecurityId,
                NetQuantity = state.NetQuantity,
                WeightedAvgCost = Math.Round(state.WeightedAvgCost, 4),
                CumulativeRealizedPnL = Math.Round(state.CumulativeRealizedPnL, 4),
                UnrealizedPnL = Math.Round(unrealizedPnL, 4),
                TotalPnL = Math.Round(totalPnL, 4),
                ClosePrice = closePrice
            };
        }
    }
}

