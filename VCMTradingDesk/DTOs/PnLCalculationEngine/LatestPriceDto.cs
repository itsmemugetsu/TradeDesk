namespace VCMTradingDesk.DTOs.PnLCalculationEngine
{
    public class LatestPriceDto
    {
        public string SecurityID { get; set; } = string.Empty;
        public string SecurityName { get; set; } = string.Empty;
        public DateTime PriceDate { get; set; }
        public decimal ClosePrice { get; set; }
    }
}
