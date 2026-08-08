
using Microsoft.EntityFrameworkCore;
using VCMTradingDesk.Controllers;
using VCMTradingDesk.DataAccess;
using VCMTradingDesk.Repos.IncrementalPositionLoader;
using VCMTradingDesk.Repos.PnLCalculatorEngine;
using VCMTradingDesk.Repos.TradeBlotter;

namespace VCMTradingDesk
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            builder.Services.AddDbContext<Ivp4271tradevContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DBCon")));

            builder.Services.AddScoped<ITradeBlotter, TradeBlotterRepo>();
            builder.Services.AddScoped<IPnLCalculatorEngine, PnLCalculatorEngineRepo>();
            builder.Services.AddScoped<IIncrementalPositionLoader, IncrementalPositionLoaderRepo>();

            builder.Services.AddCors(options => options.AddPolicy(
                "CorsPolicy", policy => policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()));

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            app.UseCors("CorsPolicy");

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
