using System;
using System.Collections.Generic;

namespace VCMTradingDesk.Models;

public partial class EodSnapshot
{
    public DateOnly ValuationDate { get; set; }

    public string SecurityId { get; set; } = null!;

    public int NetQuantity { get; set; }

    public decimal WeightedAvgCost { get; set; }

    public decimal RealizedPnL { get; set; }

    public decimal UnrealizedPnL { get; set; }

    public decimal TotalPnL { get; set; }

    public decimal ClosePrice { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Security Security { get; set; } = null!;
}
