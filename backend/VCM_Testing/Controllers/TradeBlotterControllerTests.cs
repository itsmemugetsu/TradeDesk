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
        private readonly Mock<ITradeBlotter> _mockBlotter;
        private readonly Mock<ILogger<TradeBlotterController>> _mockLogger;
        private readonly TradeBlotterController _controller;

        public TradeBlotterControllerTests()
        {
            _mockBlotter = new Mock<ITradeBlotter>();
            _mockLogger = new Mock<ILogger<TradeBlotterController>>();

            _controller = new TradeBlotterController(_mockBlotter.Object, _mockLogger.Object);
        }

        /// Positive Test

        [Theory]
        [InlineData(101, "EQ01", "Equity", "2026-02-02", "2026-03-31", "ASC")]
        [InlineData(null, "BD01", "Bond", null, null, "DESC")]
        public async Task GetTradeBlotter_ValidFiltersWithRecords_Returns200Ok(
             int? traderId, string? securityId, string? assetClass, string? startDateStr, string? endDateStr, string sortDirection)
        {
            // Arrange: Must contain at least one record to trigger 200 OK
            var expectedData = new List<TradeBlotterItemDto>
            {
                new TradeBlotterItemDto { TradeID = 1, SecurityID = securityId ?? "EQ01" }
            };

            _mockBlotter
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

            // Act
            var result = await _controller.GetTradeBlotter(filter);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
            Assert.Equal(expectedData, okResult.Value);

            _mockBlotter.Verify(x => x.GetTradeBlotterAsync(It.IsAny<TradeBlotterFilterDto>()), Times.Once);
        }



        // NOT FOUND TESTS (404 NOT FOUND)

        [Theory]
        [InlineData(101, "EQ01", "No trade records found for Trader ID '101' and Security ID 'EQ01'.")]
        [InlineData(101, null, "No trade records found for Trader ID '101'. Please check the ID and try again.")]
        [InlineData(null, "EQ01", "No trade records found for Security ID 'EQ01'. Please check the ID and try again.")]
        [InlineData(null, null, "No trade records found matching the specified criteria.")]
        public async Task GetTradeBlotter_NoRecordsFound_Returns404NotFoundWithContextualMessage(
            int? traderId, string? securityId, string expectedMessage)
        {
            // Arrange
            _mockBlotter
                .Setup(x => x.GetTradeBlotterAsync(It.IsAny<TradeBlotterFilterDto>()))
                .ReturnsAsync(new List<TradeBlotterItemDto>());

            var filter = new TradeBlotterFilterDto
            {
                TraderID = traderId,
                SecurityID = securityId
            };

            // Act
            var result = await _controller.GetTradeBlotter(filter);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status404NotFound, notFoundResult.StatusCode);

            var messageProp = notFoundResult.Value?.GetType().GetProperty("message")?.GetValue(notFoundResult.Value, null);
            Assert.Equal(expectedMessage, messageProp);
        }

        // VALIDATION & BAD REQUEST TESTS (400 BAD REQUEST)

        [Fact]
        public async Task GetTradeBlotter_StartDateGreaterThanEndDate_Returns400BadRequest()
        {
            // Arrange
            var filter = new TradeBlotterFilterDto
            {
                StartDate = new DateOnly(2026, 03, 31),
                EndDate = new DateOnly(2026, 02, 01) // Start > End
            };

            // Act
            var result = await _controller.GetTradeBlotter(filter);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status400BadRequest, badRequestResult.StatusCode);

            var messageProp = badRequestResult.Value?.GetType().GetProperty("message")?.GetValue(badRequestResult.Value, null);
            Assert.Equal("Start Date cannot be greater than End Date.", messageProp);

            _mockBlotter.Verify(x => x.GetTradeBlotterAsync(It.IsAny<TradeBlotterFilterDto>()), Times.Never);
        }

        [Fact]
        public async Task GetTradeBlotter_InvalidModelState_Returns400BadRequest()
        {
            // Arrange
            _controller.ModelState.AddModelError("TraderID", "Invalid Trader ID format.");
            var filter = new TradeBlotterFilterDto();

            // Act
            var result = await _controller.GetTradeBlotter(filter);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status400BadRequest, badRequestResult.StatusCode);

            _mockBlotter.Verify(x => x.GetTradeBlotterAsync(It.IsAny<TradeBlotterFilterDto>()), Times.Never);
        }

        [Fact]
        public async Task GetTradeBlotter_ArgumentException_Returns400BadRequest()
        {
            // Arrange
            _mockBlotter
                .Setup(x => x.GetTradeBlotterAsync(It.IsAny<TradeBlotterFilterDto>()))
                .ThrowsAsync(new ArgumentException("Invalid search filter parameter supplied"));

            var filter = new TradeBlotterFilterDto();

            // Act
            var result = await _controller.GetTradeBlotter(filter);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status400BadRequest, badRequestResult.StatusCode);

            var messageProp = badRequestResult.Value?.GetType().GetProperty("message")?.GetValue(badRequestResult.Value, null);
            Assert.Equal("Invalid search filter parameter supplied", messageProp);
        }

        //Server Error Tests (500)

        [Fact]
        public async Task GetTradeBlotter_UnhandledRepositoryException_Returns500InternalServerError()
        {
            // Arrange
            _mockBlotter
                .Setup(x => x.GetTradeBlotterAsync(It.IsAny<TradeBlotterFilterDto>()))
                .ThrowsAsync(new Exception("Database connection failure"));

            var filter = new TradeBlotterFilterDto();

            // Act
            var result = await _controller.GetTradeBlotter(filter);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status500InternalServerError, objectResult.StatusCode);

            var messageProp = objectResult.Value?.GetType().GetProperty("message")?.GetValue(objectResult.Value, null);
            Assert.Equal("An error occurred while processing your request on the server.", messageProp);
        }


    }
}
