using VCMTradingDesk.DTOs.Securities;
using VCMTradingDesk.Models;

namespace VCMTradingDesk.Repos.SecuritiesView
{
    public interface IAssetSummaryRepo
    {
        Task<List<AssetSummaryDto>> GetAssetSummariesAsync(DateOnly? asOfDate = null);
    }
}
