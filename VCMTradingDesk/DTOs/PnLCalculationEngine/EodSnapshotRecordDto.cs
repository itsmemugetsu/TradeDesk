namespace VCMTradingDesk.DTOs.PnLCalculationEngine
{
    public class EodSnapshotRecordDto
    {       
        public DateOnly ValuationDate { get; set; }
        public string SecurityId { get; set; } = string.Empty;
        public string SecurityName { get; set; } = string.Empty;
        public string AssetClass { get; set; } = string.Empty;
        public int NetQuantity { get; set; }
        public decimal WeightedAvgCost { get; set; }
        public decimal CumulativeRealizedPnL { get; set; }
        public decimal UnrealizedPnL { get; set; }
        public decimal TotalPnL { get; set; }
        public decimal ClosePrice { get; set; }
        
    }
}
