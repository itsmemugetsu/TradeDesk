using VCM_Models.DTOs.TradeBlotter;

namespace VCM_DataAccess.Repos.TradeBlotter
{
    public interface ITradeBlotter
    {
        Task<List<TradeBlotterItemDto>> GetTradeBlotterAsync(TradeBlotterFilterDto filter);
    }
}
