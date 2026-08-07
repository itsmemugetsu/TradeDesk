using System;
using System.Collections.Generic;

namespace VCMTradingDesk.Models;

public partial class Trade
{
    public int TradeId { get; set; }

    public DateOnly TradeDate { get; set; }

    public int TraderId { get; set; }

    public string SecurityId { get; set; } = null!;

    public string BuySell { get; set; } = null!;

    public int Quantity { get; set; }

    public decimal Price { get; set; }

    public virtual Security Security { get; set; } = null!;

    public virtual Trader Trader { get; set; } = null!;
}
