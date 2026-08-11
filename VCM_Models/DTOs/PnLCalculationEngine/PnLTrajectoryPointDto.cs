using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCM_Models.DTOs.PnLCalculationEngine
{
    public class PnLTrajectoryPointDto
    {
        public DateOnly ValuationDate { get; set; }
        public decimal NetCombinedPnL { get; set; }
        public decimal RealizedPnL { get; set; }
        public decimal UnrealizedPnL { get; set; }
    }
}
