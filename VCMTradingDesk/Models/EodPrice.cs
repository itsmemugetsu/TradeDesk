using System;
using System.Collections.Generic;

namespace VCMTradingDesk.Models;

public partial class EodPrice
{
    public string SecurityId { get; set; } = null!;

    public DateOnly PriceDate { get; set; }

    public decimal ClosePrice { get; set; }

    public virtual Security Security { get; set; } = null!;
}
