namespace VCMTradingDesk.DTOs.TradeBlotter
{
    public class TradeBlotterFilterDto
    {
        public int? TraderID { get; set; }
        public string? SecurityID { get; set; }
        public string? AssetClass { get; set; }
        public DateOnly? StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public string SortDirection { get; set; } = "DESC";
    }
}
