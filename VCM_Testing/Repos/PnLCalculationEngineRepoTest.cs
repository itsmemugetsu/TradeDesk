using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCM_DataAccess.Repos.PnLCalculatorEngine;
using VCM_Models.DTOs.PnLCalculationEngine;
using VCM_Models.Models;

namespace VCM_Testing.Repos
{
    public class PnLCalculationEngineRepoTest
    {
        private readonly PnLCalculatorEngineRepo _engine;

        public PnLCalculationEngineRepoTest()
        {
            _engine = new PnLCalculatorEngineRepo();
        }

        //Buy & WAC Calculations

        [Theory]
        //[InitialQty, InitialWAC, BuyQty, BuyPrice, ExpectedQty, ExpectedWAC]
        [InlineData(0, 0.0, 100, 1000.0, 100, 1000.0)]     // buy at 1000
        [InlineData(100, 1000.0, 100, 1040.0, 200, 1020.0)] // buy at 1040 (averaging up)
        [InlineData(100, 1000.0, 100, 960.0, 200, 980.0)]   // buy at 960 (averaging down)
        [InlineData(50, 100.0, 150, 200.0, 200, 175.0)]     // 50@100 + 150@200
        public async Task ApplyTrade_BuyTrades_CalculatesCorrectQtyAndWAC(
            int initQty, double initWac, int buyQty, double buyPrice, int expectedQty, double expectedWac)
        {
            var state = new SecurityPositionState
            {
                SecurityId = "BD01",
                NetQuantity = initQty,
                WeightedAvgCost = (decimal)initWac
            };
            var trade = new Trade { BuySell = "BUY", Quantity = buyQty, Price = (decimal)buyPrice };

            await _engine.ApplyTradeAsync(state, trade);

            Assert.Equal(expectedQty, state.NetQuantity);
            Assert.Equal((decimal)expectedWac, state.WeightedAvgCost);
        }



        //Sell & Realized P&L Calculations

        [Theory]
        // Sell Trades: [InitQty, InitWAC, InitRealizedPnL, SellQty, SellPrice, ExpectedQty, ExpectedWAC, ExpectedRealizedPnL]
        [InlineData(100, 1000.0, 0.0, 50, 1050.0, 50, 1000.0, 2500.0)]   // Partial sell at profit (+2500)
        [InlineData(100, 1000.0, 0.0, 50, 950.0, 50, 1000.0, -2500.0)]   // Partial sell at loss (-2500)
        [InlineData(100, 1000.0, 0.0, 100, 1020.0, 0, 1000.0, 2000.0)]   // Complete exit at profit (+2000)
        [InlineData(50, 1000.0, 1500.0, 50, 1010.0, 0, 1000.0, 2000.0)]  // Cumulative sum (1500 + 500)
        public async Task ApplyTrade_SellTrades_CalculatesRealizedPnLAndSameWAC(
            int initQty, double initWac, double initRealized, int sellQty, double sellPrice,
            int expectedQty, double expectedWac, double expectedRealized)
        {
            var state = new SecurityPositionState
            {
                SecurityId = "BD01",
                NetQuantity = initQty,
                WeightedAvgCost = (decimal)initWac,
                CumulativeRealizedPnL = (decimal)initRealized
            };
            var trade = new Trade { BuySell = "SELL", Quantity = sellQty, Price = (decimal)sellPrice };

            await _engine.ApplyTradeAsync(state, trade);

            Assert.Equal(expectedQty, state.NetQuantity);
            Assert.Equal((decimal)expectedWac, state.WeightedAvgCost); //realized remains the same during sell
            Assert.Equal((decimal)expectedRealized, state.CumulativeRealizedPnL);
        }


        //NEGATIVE TESTCASES
        //Case Insensitivity & Invalid Sides

        [Theory]
        //case variations
        [InlineData("BUY", 100, 1000.0, 100, 1000.0)]
        [InlineData("buy", 100, 1000.0, 100, 1000.0)]
        [InlineData("Buy", 100, 1000.0, 100, 1000.0)]
        [InlineData("bUy", 100, 1000.0, 100, 1000.0)]
        public async Task ApplyTrade_BuyCaseInsensitivity_ExecutesCorrectly(
            string buySell, int buyQty, double buyPrice, int expectedQty, double expectedWac)
        {
            var state = new SecurityPositionState { SecurityId = "EQ01", NetQuantity = 0, WeightedAvgCost = 0m };
            var trade = new Trade { BuySell = buySell, Quantity = buyQty, Price = (decimal)buyPrice };

            await _engine.ApplyTradeAsync(state, trade);

            Assert.Equal(expectedQty, state.NetQuantity);
            Assert.Equal((decimal)expectedWac, state.WeightedAvgCost);
        }

        [Theory]
        [InlineData("HOLD")]
        [InlineData("CANCEL")]
        [InlineData("SHORT")]
        [InlineData("")]
        [InlineData(null)]
        public async Task ApplyTrade_InvalidTradeSide_DoesNotMutateState(string invalidSide)
        {
            var state = new SecurityPositionState { SecurityId = "EQ01", NetQuantity = 50, WeightedAvgCost = 100m, CumulativeRealizedPnL = 10m };
            var trade = new Trade { BuySell = invalidSide, Quantity = 20, Price = 150m };

            await _engine.ApplyTradeAsync(state, trade);

            Assert.Equal(50, state.NetQuantity);
            Assert.Equal(100m, state.WeightedAvgCost);
            Assert.Equal(10m, state.CumulativeRealizedPnL);
        }

        //BuildSnapshot - EOD Valuation 

        [Theory]
        // [NetQty, WAC, RealizedPnL, ClosePrice, ExpectedUnrealized, ExpectedTotalPnL]
        [InlineData(100, 1000.0, 0.0, 1020.0, 2000.0, 2000.0)]      // profit 
        [InlineData(100, 1000.0, 0.0, 980.0, -2000.0, -2000.0)]     // loss 
        [InlineData(0, 0.0, 1500.0, 1050.0, 0.0, 1500.0)]           // Position (Total = Realized)
        [InlineData(50, 100.0, 200.0, 100.0, 0.0, 200.0)]           // Market-2-market (Close Price == WAC)
        [InlineData(100, 1000.123456, 500.987654, 1020.555555, 2043.2099, 2544.1976)] //4 decimal check
        public async Task BuildSnapshot_EodValuations_CalculatesAndRoundsCorrectly(
            int netQty, double wac, double realized, double closePrice, double expectedUnrealized, double expectedTotal)
        {
            var valuationDate = new DateOnly(2026, 3, 31);
            var state = new SecurityPositionState
            {
                SecurityId = "BD01",
                NetQuantity = netQty,
                WeightedAvgCost = (decimal)wac,
                CumulativeRealizedPnL = (decimal)realized
            };

            var snapshot = await _engine.BuildSnapshotAsync(state, valuationDate, (decimal)closePrice);

            Assert.Equal(netQty, snapshot.NetQuantity);
            Assert.Equal((decimal)expectedUnrealized, snapshot.UnrealizedPnL);
            Assert.Equal((decimal)expectedTotal, snapshot.TotalPnL);
        }

    }
}
    