using VCMTradingDesk.DTOs.TradeBlotter;

namespace VCMTradingDesk.Repos.TradeBlotter
{
    public interface ITradeBlotter
    {
        Task<List<TradeBlotterItemDto>> GetTradeBlotterAsync(TradeBlotterFilterDto filter);
    }
}
