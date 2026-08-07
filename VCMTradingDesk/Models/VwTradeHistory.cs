using System;
using System.Collections.Generic;

namespace VCMTradingDesk.Models;

public partial class VwTradeHistory
{
    public int TradeId { get; set; }

    public DateOnly TradeDate { get; set; }

    public int TraderId { get; set; }

    public string TraderName { get; set; } = null!;

    public string SecurityId { get; set; } = null!;

    public string SecurityName { get; set; } = null!;

    public string AssetClass { get; set; } = null!;

    public string Category { get; set; } = null!;

    public string BuySell { get; set; } = null!;

    public int Quantity { get; set; }

    public decimal Price { get; set; }

    public decimal? TotalValue { get; set; }
}
