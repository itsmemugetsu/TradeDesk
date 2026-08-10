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
        private readonly ILogger<PnLController> _logger;

        public PnLController(IIncrementalPositionLoader positionLoader, ILogger<PnLController> logger)
        {
            _positionLoader = positionLoader;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetPnL([FromQuery] DateOnly? valuationDate)
        {
            DateOnly dateToQuery = valuationDate ?? new DateOnly(2026, 3, 31);
            DateOnly systemStartDate = new DateOnly(2026, 2, 2);

            if (dateToQuery < systemStartDate)
            {
                _logger.LogWarning("Requested valuation date {ValuationDate} is prior to system start date {StartDate}.", dateToQuery, systemStartDate);

                return BadRequest(new
                {
                    Message = $"Valuation date cannot be earlier than system start date ({systemStartDate:yyyy-MM-dd})."
                });
            }

            try
            {
                var result = await _positionLoader.GetOrBackfillSnapshotsAsync(dateToQuery);
                return Ok(result ?? new List<EodSnapshotRecordDto>());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while computing PnL snapshots for ValuationDate: {ValuationDate}", dateToQuery);
                return StatusCode(500, new { Error = "Error computing PnL snapshots", Details = ex.Message });
            }
        }

        [HttpGet("EquityCurve")]
        public async Task<ActionResult<List<PnLTrajectoryPointDto>>> GetEquityCurveTrajectory(
            [FromQuery] DateOnly? asOfDate = null,
            [FromQuery] string? assetClass = null,
            [FromQuery] string? securityId = null)
        {
            var targetDate = asOfDate ?? new DateOnly(2026, 3, 31);
            _logger.LogInformation("Fetching Equity Curve Trajectory for TargetDate: {TargetDate}, AssetClass: {AssetClass}, SecurityId: {SecurityId}",
                targetDate, assetClass ?? "ALL", securityId ?? "ALL");

            try
            {
                var trajectory = await _positionLoader.GetEquityCurveTrajectoryAsync(targetDate, assetClass, securityId);

                if (trajectory == null || !trajectory.Any())
                {
                    _logger.LogInformation("Equity curve query executed with 0 data points returned for Date: {TargetDate}, AssetClass: {AssetClass}, SecurityId: {SecurityId}",
                        targetDate, assetClass ?? "ALL", securityId ?? "ALL");
                }
                else
                {
                    _logger.LogInformation("Successfully retrieved {Count} equity curve points for TargetDate: {TargetDate}", trajectory.Count, targetDate);
                }

                return Ok(trajectory);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve equity curve trajectory for TargetDate: {TargetDate}, AssetClass: {AssetClass}, SecurityId: {SecurityId}",
                    targetDate, assetClass ?? "ALL", securityId ?? "ALL");

                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    Message = "An unexpected error occurred while fetching equity curve data.",
                    Details = ex.Message
                });
            }
        }
    }
}