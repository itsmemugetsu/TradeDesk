namespace VCMTradingDesk.DTOs.PnLCalculationEngine
{
    public class SecurityPositionState
    {
        public string SecurityId { get; set; } = string.Empty;
        public int NetQuantity { get; set; }
        public decimal WeightedAvgCost { get; set; }
        public decimal CumulativeRealizedPnL { get; set; }
    }
}
