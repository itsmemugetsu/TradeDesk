using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VCMTradingDesk.DTOs.Securities;
using VCMTradingDesk.Models;
using VCMTradingDesk.Repos.SecuritiesView;
using static VCMTradingDesk.Repos.SecuritiesView.IAssetSummaryRepo;

namespace VCMTradingDesk.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AssetSummaryController : ControllerBase
    {
        private readonly IAssetSummaryRepo _assetSummaryRepo;
        private readonly ILogger<AssetSummaryController> _logger;

        public AssetSummaryController(IAssetSummaryRepo assetSummaryRepo, ILogger<AssetSummaryController> logger)
        {
            _assetSummaryRepo = assetSummaryRepo;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<AssetSummaryDto>>> GetAssetSummaries([FromQuery] DateOnly? asOfDate = null)
        {
            try
            {
                var summaries = await _assetSummaryRepo.GetAssetSummariesAsync(asOfDate);
                return Ok(summaries);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving asset summaries for date: {AsOfDate}", asOfDate);
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    Message = "An unexpected error occurred while processing the asset summaries request.",
                    Details = ex.Message
                });
            }
        }
    }
}
