using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCM_DataAccess.Repos.IncrementalPositionLoader;
using VCM_Models.DTOs.PnLCalculationEngine;
using VCMTradingDesk.Controllers;

namespace VCM_Testing.Controllers
{
    public class PnLControllerTests
    {
        private readonly Mock<IIncrementalPositionLoader> _mockPnL;
        private readonly PnLController _controller;
        private readonly Mock<ILogger<PnLController>> _mockLogger;

        public PnLControllerTests()
        {
            _mockPnL = new Mock<IIncrementalPositionLoader>();
            _mockLogger = new Mock<ILogger<PnLController>>();
            _controller = new PnLController(_mockPnL.Object, _mockLogger.Object);
        }

        //Positive Test Cases

        [Fact]
        public async Task GetPnL_Returns200OKWithSnapshots()
        {
            
            var testDate = new DateOnly(2026, 3, 15);
            var expectedSnapshots = new List<EodSnapshotRecordDto>
            {
                new EodSnapshotRecordDto { SecurityId = "BD01", TotalPnL = 150.50m },
                new EodSnapshotRecordDto { SecurityId = "EQ01", TotalPnL = 300.00m }
            };

            _mockPnL.Setup(x => x.GetOrBackfillSnapshotsAsync(testDate))
                    .ReturnsAsync(expectedSnapshots);

            var result = await _controller.GetPnL(testDate) as OkObjectResult;

            Assert.Equal(200, result.StatusCode);

            var actualSnapshots = Assert.IsType<List<EodSnapshotRecordDto>>(result.Value);
            Assert.Equal(expectedSnapshots.Count, actualSnapshots.Count);
            Assert.Equal(expectedSnapshots[0].SecurityId, actualSnapshots[0].SecurityId);
            Assert.Equal(expectedSnapshots[0].TotalPnL, actualSnapshots[0].TotalPnL);

            _mockPnL.Verify(x => x.GetOrBackfillSnapshotsAsync(testDate), Times.Once);
        }

        [Fact]
        public async Task GetPnL_whenNullDatethenDefaultsToMarch31()
        {
            // Arrange
            var defaultDate = new DateOnly(2026, 3, 31);
            var expectedSnapshots = new List<EodSnapshotRecordDto>();

            _mockPnL.Setup(x => x.GetOrBackfillSnapshotsAsync(defaultDate))
                    .ReturnsAsync(expectedSnapshots);

            // Act
            var result = await _controller.GetPnL(null) as OkObjectResult;

            Assert.Equal(200, result.StatusCode);

            // Verify default fallback date was passed to loader
            _mockPnL.Verify(x => x.GetOrBackfillSnapshotsAsync(defaultDate), Times.Once);
        }

        [Theory]
        [InlineData("2026-02-02")]
        [InlineData("2026-03-14")]
        [InlineData("2026-03-31")]
        public async Task GetPnL_whenvalidategiven_QueriesCorrectDate(string dateString)
        {
            // Arrange
            var testDate = DateOnly.Parse(dateString);
            var expectedSnapshots = new List<EodSnapshotRecordDto>();

            _mockPnL.Setup(x => x.GetOrBackfillSnapshotsAsync(testDate))
                    .ReturnsAsync(expectedSnapshots);

            // Act
            var result = await _controller.GetPnL(testDate) as OkObjectResult;

            Assert.Equal(200, result.StatusCode);

            _mockPnL.Verify(x => x.GetOrBackfillSnapshotsAsync(testDate), Times.Once);
        }


        [Theory]
        [InlineData("2026-01-01")]
        [InlineData("2026-02-01")]
        [InlineData("2025-12-31")]
        public async Task GetPnL_WhenDateBeforeMinLimit_ReturnsBadRequest(string dateString)
        {
            var testDate = DateOnly.Parse(dateString);

            var actionResult = await _controller.GetPnL(testDate);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult);
            Assert.Equal(400, badRequestResult.StatusCode);

            // Verifies service engine was NEVER queried for invalid dates
            _mockPnL.Verify(x => x.GetOrBackfillSnapshotsAsync(It.IsAny<DateOnly>()), Times.Never);
        }

        //GetEquityCurveTrajectory Tests

        [Theory]
        [InlineData("2026-03-31", "Equity", "EQ01")]
        [InlineData("2026-02-15", "Bond", "BD01")]
        [InlineData("2026-03-10", "ETF", "ET01")]
        public async Task GetEquityCurve_ValidFilters_ReturnsOk(string dateStr, string assetClass, string securityId)
        {
            var date = DateOnly.Parse(dateStr);
            var expectedTrajectory = new List<PnLTrajectoryPointDto>();

            _mockPnL
                .Setup(x => x.GetEquityCurveTrajectoryAsync(date, assetClass, securityId))
                .ReturnsAsync(expectedTrajectory);

            var result = await _controller.GetEquityCurveTrajectory(date, assetClass, securityId);

            var actionResult = Assert.IsType<ActionResult<List<PnLTrajectoryPointDto>>>(result);
            var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
            Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
            Assert.Equal(expectedTrajectory, okResult.Value);
        }

        //Negative Test Cases

        [Fact]
        public async Task GetPnL_whenLoaderThrowsException_Returns500InternalServerError()
        {
           
            var testDate = new DateOnly(2026, 3, 15);
            var exceptionMessage = "Database connection failed during snapshot backfill.";

            _mockPnL.Setup(x => x.GetOrBackfillSnapshotsAsync(testDate))
                    .ThrowsAsync(new Exception(exceptionMessage));

       
            var result = await _controller.GetPnL(testDate);

            var statusCodeResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(500, statusCodeResult.StatusCode);

            //verify anonymous JSON response properties
            Assert.NotNull(statusCodeResult.Value);
            var responseType = statusCodeResult.Value.GetType();
            var errorProp = responseType.GetProperty("Error")?.GetValue(statusCodeResult.Value, null);
            var detailsProp = responseType.GetProperty("Details")?.GetValue(statusCodeResult.Value, null);

            Assert.Equal("Error computing PnL snapshots", errorProp);
            Assert.Equal(exceptionMessage, detailsProp);
        }


        //Equity Curve exception 
        [Theory]
        [InlineData("2026-03-31", "Equity", "EQ01")]
        public async Task GetEquityCurve_ExceptionThrown_Returns500(string dateStr, string assetClass, string securityId)
        {
            var date = DateOnly.Parse(dateStr);

            _mockPnL
                .Setup(x => x.GetEquityCurveTrajectoryAsync(It.IsAny<DateOnly>(), It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new Exception("Trajectory calculation error"));

            var result = await _controller.GetEquityCurveTrajectory(date, assetClass, securityId);

            var actionResult = Assert.IsType<ActionResult<List<PnLTrajectoryPointDto>>>(result);
            var objectResult = Assert.IsType<ObjectResult>(actionResult.Result);
            Assert.Equal(StatusCodes.Status500InternalServerError, objectResult.StatusCode);
        }


    }
}
