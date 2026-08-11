namespace VCM_Models.DTOs.TradeBlotter
{
    public class TradeBlotterItemDto
    {
        public int TradeID { get; set; }
        public DateOnly TradeDate { get; set; }
        public int TraderID { get; set; }
        public string TraderName { get; set; } = string.Empty;
        public string SecurityID { get; set; } = string.Empty;
        public string SecurityName { get; set; } = string.Empty;
        public string AssetClass { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string BuySell { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal TotalValue { get; set; }
    }
}
