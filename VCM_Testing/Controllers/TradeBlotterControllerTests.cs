using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCM_DataAccess.Repos.TradeBlotter;
using VCM_Models.DTOs.TradeBlotter;
using VCMTradingDesk.Controllers;

namespace VCM_Testing.Controllers
{
    public class TradeBlotterControllerTests
    {
        private readonly Mock<ITradeBlotter> _mockblotter;
        private readonly Mock<ILogger<TradeBlotterController>> _mockLogger;
        private readonly TradeBlotterController _controller;

        public TradeBlotterControllerTests()
        {
            _mockblotter = new Mock<ITradeBlotter>();
            _mockLogger = new Mock<ILogger<TradeBlotterController>>();

            _controller = new TradeBlotterController(_mockblotter.Object, _mockLogger.Object);
        }

        /// Positive Test

        [Theory]
        [InlineData(101, "EQ01", "Equity", "2026-02-02", "2026-03-31", "ASC")]
        [InlineData(null, "BD01", "Bond", null, null, "DESC")]
        public async Task GetTradeBlotter_ValidFilters_ReturnsOk(
            int? traderId, string? securityId, string? assetClass, string? startDateStr, string? endDateStr, string sortDirection)
        { 
            var expectedData = new List<TradeBlotterItemDto>();

            _mockblotter
                .Setup(x => x.GetTradeBlotterAsync(It.IsAny<TradeBlotterFilterDto>()))
                .ReturnsAsync(expectedData);

            var filter = new TradeBlotterFilterDto
            {
                TraderID = traderId,
                SecurityID = securityId,
                AssetClass = assetClass,
                StartDate = startDateStr != null ? DateOnly.Parse(startDateStr) : null,
                EndDate = endDateStr != null ? DateOnly.Parse(endDateStr) : null,
                SortDirection = sortDirection
            };

            var result = await _controller.GetTradeBlotter(filter);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
            Assert.Equal(expectedData, okResult.Value);

            _mockblotter.Verify(x => x.GetTradeBlotterAsync(It.IsAny<TradeBlotterFilterDto>()), Times.Once);
        }

        

        // Negative Test

        [Fact]
        public async Task GetTradeBlotter_RepositoryException_Returns500Error()
        {
            _mockblotter
                .Setup(x => x.GetTradeBlotterAsync(It.IsAny<TradeBlotterFilterDto>()))
                .ThrowsAsync(new Exception("Stored procedure execution failed"));

            var filter = new TradeBlotterFilterDto();

            var result = await _controller.GetTradeBlotter(filter);

            var badReqRes = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status400BadRequest, badReqRes.StatusCode);
        }

        
    }
}
