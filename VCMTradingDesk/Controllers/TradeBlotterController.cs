using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VCMTradingDesk.DTOs.TradeBlotter;
using VCMTradingDesk.Repos.TradeBlotter;

namespace VCMTradingDesk.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TradeBlotterController : ControllerBase
    {
        private readonly ITradeBlotter _trade;

        public TradeBlotterController(ITradeBlotter trade)
        {
            _trade = trade;
        }

        [HttpGet]
        public async Task<ActionResult<List<TradeBlotterItemDto>>> GetTradeBlotter([FromQuery] TradeBlotterFilterDto filter)
        {
            try
            {
                var trades = await _trade.GetTradeBlotterAsync(filter);
                return Ok(trades);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

    }
}
