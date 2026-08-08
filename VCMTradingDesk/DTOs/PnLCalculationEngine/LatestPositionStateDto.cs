namespace VCMTradingDesk.DTOs.PnLCalculationEngine
{
    public class LatestPositionStateDto
    {
        public string SecurityId { get; set; } = string.Empty;
        public int NetQuantity { get; set; }
        public decimal WeightedAvgCost { get; set; }
        public decimal RealizedPnL { get; set; }
    }
}
