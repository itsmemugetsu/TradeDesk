namespace VCM_Models.DTOs.Securities
{
    public class AssetSummaryDto
    {
        public string SecurityId { get; set; } = string.Empty;
        public string SecurityName { get; set; } = string.Empty;
        public string AssetClass { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal? FaceValue { get; set; }
        public decimal? CouponRatePct { get; set; }
        public DateTime? MaturityDate { get; set; }
        public decimal StartPrice { get; set; }

        // Desk Activity Aggregations
        public int TotalTrades { get; set; }
        public int BuyCount { get; set; }
        public int SellCount { get; set; }
        public long TotalBuyVolume { get; set; }
        public long TotalSellVolume { get; set; }
        public decimal TotalTradedValue { get; set; }
    }
}
