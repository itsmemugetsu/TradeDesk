using System;
using System.Collections.Generic;

namespace VCM_Models.Models;

public partial class Security
{
    public string SecurityId { get; set; } = null!;

    public string SecurityName { get; set; } = null!;

    public string AssetClass { get; set; } = null!;

    public string Category { get; set; } = null!;

    public decimal? FaceValue { get; set; }

    public decimal? CouponRatePct { get; set; }

    public DateOnly? MaturityDate { get; set; }

    public decimal StartPrice { get; set; }

    public virtual ICollection<EodSnapshot> EodSnapshots { get; set; } = new List<EodSnapshot>();

    public virtual ICollection<Trade> Trades { get; set; } = new List<Trade>();
}
