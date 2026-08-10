using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VCM_Models.DTOs.TradeBlotter;
using VCM_DataAccess.Repos.TradeBlotter;

namespace VCMTradingDesk.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TradeBlotterController : ControllerBase
    {
        private readonly ITradeBlotter _trade;
        private readonly ILogger<TradeBlotterController> _logger;

        public TradeBlotterController(ITradeBlotter trade, ILogger<TradeBlotterController> logger)
        {
            _trade = trade;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<TradeBlotterItemDto>>> GetTradeBlotter([FromQuery] TradeBlotterFilterDto filter)
        {
            _logger.LogInformation("Fetching trade blotter records with filter parameters: {@Filter}", filter);

            try
            {
                var trades = await _trade.GetTradeBlotterAsync(filter);

                if (trades == null || !trades.Any())
                {
                    _logger.LogInformation("Trade blotter query executed successfully but returned 0 results.");
                }
                else
                {
                    _logger.LogInformation("Successfully retrieved {Count} trade blotter items.", trades.Count);
                }

                return Ok(trades);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve trade blotter records for filter: {@Filter}", filter);
                return BadRequest(ex.Message);
            }
        }
    }
}