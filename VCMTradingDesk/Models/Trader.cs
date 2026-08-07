using System;
using System.Collections.Generic;

namespace VCMTradingDesk.Models;

public partial class Trader
{
    public int TraderId { get; set; }

    public string TraderName { get; set; } = null!;

    public string Desk { get; set; } = null!;

    public virtual ICollection<Trade> Trades { get; set; } = new List<Trade>();
}
