using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VCM_DataAccess.Repos.IncrementalPositionLoader;
using VCM_Models.DTOs.PnLCalculationEngine;

namespace VCMTradingDesk.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PnLController : ControllerBase
    {
        private readonly IIncrementalPositionLoader _positionLoader;
        public PnLController(IIncrementalPositionLoader positionLoader)
        {
            _positionLoader = positionLoader;
        }
        [HttpGet]
        public async Task<IActionResult> GetPnL([FromQuery] DateOnly? valuationDate)

        {
            DateOnly dateToQuery = valuationDate ?? new DateOnly(2026, 3, 31);
            try
            {
                var result = await _positionLoader.GetOrBackfillSnapshotsAsync(dateToQuery);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Error computing PnL snapshots", Details = ex.Message });
            }

        }
        [HttpGet("EquityCurve")]
        public async Task<ActionResult<List<PnLTrajectoryPointDto>>> GetEquityCurveTrajectory(
        [FromQuery] DateOnly? asOfDate = null,
        [FromQuery] string? assetClass = null,
        [FromQuery] string? securityId = null)
        {
            try
            {
                var targetDate = asOfDate ?? new DateOnly(2026, 3, 31);
                var trajectory = await _positionLoader.GetEquityCurveTrajectoryAsync(targetDate, assetClass, securityId);
                return Ok(trajectory);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    Message = "An unexpected error occurred while fetching equity curve data.",
                    Details = ex.Message
                });
            }
        }
    }
}
