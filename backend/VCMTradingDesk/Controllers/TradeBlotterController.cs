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

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (filter.StartDate.HasValue && filter.EndDate.HasValue && filter.StartDate > filter.EndDate)
            {
                _logger.LogWarning("Invalid date range requested: StartDate ({StartDate}) > EndDate ({EndDate}).", filter.StartDate, filter.EndDate);
                return BadRequest(new { message = "Start Date cannot be greater than End Date." });
            }

            try
            {
                var trades = await _trade.GetTradeBlotterAsync(filter);

                if (trades == null || !trades.Any())
                {
                    _logger.LogInformation("Trade blotter query returned 0 results for filter: {@Filter}", filter);

                    string errorMessage;

                    if (filter.TraderID.HasValue && !string.IsNullOrWhiteSpace(filter.SecurityID))
                    {
                        errorMessage = $"No trade records found for Trader ID '{filter.TraderID}' and Security ID '{filter.SecurityID}'.";
                    }
                    else if (filter.TraderID.HasValue)
                    {
                        errorMessage = $"No trade records found for Trader ID '{filter.TraderID}'. Please check the ID and try again.";
                    }
                    else if (!string.IsNullOrWhiteSpace(filter.SecurityID))
                    {
                        errorMessage = $"No trade records found for Security ID '{filter.SecurityID}'. Please check the ID and try again.";
                    }
                    else
                    {
                        errorMessage = "No trade records found matching the specified criteria.";
                    }

                    return NotFound(new { message = errorMessage });

                }

                    _logger.LogInformation("Successfully retrieved {Count} trade blotter items.", trades.Count);
                return Ok(trades);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Argument exception occurred in Trade Blotter search.");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve trade blotter records for filter: {@Filter}", filter);
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An error occurred while processing your request on the server." });
            }
        }
    }
}