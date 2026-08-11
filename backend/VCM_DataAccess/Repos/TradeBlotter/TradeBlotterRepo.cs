using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;
using VCM_DataAccess.DataAccess;
using VCM_Models.DTOs.TradeBlotter;

namespace VCM_DataAccess.Repos.TradeBlotter
{
    public class TradeBlotterRepo : ITradeBlotter
    {
        private readonly VCMDbContext _context;

        public TradeBlotterRepo (VCMDbContext context)
        {
            _context = context;
        }

        public async Task<List<TradeBlotterItemDto>> GetTradeBlotterAsync(TradeBlotterFilterDto filter)
        {
            var trades = new[]
            {
                new SqlParameter("@TraderID", SqlDbType.Int) { Value = (object?)filter.TraderID ?? DBNull.Value },

                new SqlParameter("@SecurityID", SqlDbType.VarChar, 50) { Value = (object?)filter.SecurityID ?? DBNull.Value },

                new SqlParameter("@AssetClass", SqlDbType.VarChar, 50) { Value = (object?)filter.AssetClass ?? DBNull.Value },

                new SqlParameter("@StartDate", SqlDbType.Date) { Value = (object?)filter.StartDate ?? DBNull.Value },

                new SqlParameter("@EndDate", SqlDbType.Date) { Value = (object?)filter.EndDate ?? DBNull.Value },

                new SqlParameter("@SortDirection", SqlDbType.VarChar, 4) { Value = string.IsNullOrWhiteSpace(filter.SortDirection) ? "DESC" : filter.SortDirection }   
            };

            return await _context.Database
                .SqlQueryRaw<TradeBlotterItemDto>(
                    "EXEC dbo.sp_GetTradeBlotter @TraderID=@TraderID, @SecurityID=@SecurityID, @AssetClass=@AssetClass, @StartDate=@StartDate, @EndDate=@EndDate, @SortDirection=@SortDirection",
                    trades)
                .ToListAsync();
        }
    }
}
