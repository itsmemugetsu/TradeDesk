using VCM_Models.DTOs.Securities;
using VCM_Models.Models;

namespace VCM_DataAccess.Repos.SecuritiesView
{
    public interface IAssetSummaryRepo
    {
        Task<List<AssetSummaryDto>> GetAssetSummariesAsync(DateOnly? asOfDate = null);
    }
}
