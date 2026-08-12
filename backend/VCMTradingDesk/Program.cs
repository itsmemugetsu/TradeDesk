using Microsoft.EntityFrameworkCore;
using Serilog;
using VCM_DataAccess.DataAccess;
using VCM_DataAccess.Repos.IncrementalPositionLoader;
using VCM_DataAccess.Repos.PnLCalculatorEngine;
using VCM_DataAccess.Repos.SecuritiesView;
using VCM_DataAccess.Repos.TradeBlotter;
using VCMTradingDesk.BackgroundServices;

namespace VCMTradingDesk
{
    public class Program
    {
        public static void Main(string[] args)
        {
            //Initial Bootstrap Logger (Captures startup crashes to a local file before appsettings is fully loaded)
            Log.Logger = new LoggerConfiguration()
                .WriteTo.File("Logs/bootstrap-.log", rollingInterval: RollingInterval.Day)
                .CreateBootstrapLogger();

            try
            {
                Log.Information("Starting VCM Trading Desk Web API...");

                var builder = WebApplication.CreateBuilder(args);

                //Wire Serilog into the Host (Reads File & MSSqlServer sinks from appsettings.json)
                builder.Host.UseSerilog((context, services, configuration) => configuration
                    .ReadFrom.Configuration(context.Configuration)
                    .ReadFrom.Services(services)
                    .Enrich.FromLogContext());

                // Add services to the container.
                builder.Services.AddControllers();

                builder.Services.AddDbContext<VCMDbContext>(options =>
                    options.UseSqlServer(builder.Configuration.GetConnectionString("DBCon")));

                builder.Services.AddTransient<ITradeBlotter, TradeBlotterRepo>();
                builder.Services.AddTransient<IPnLCalculatorEngine, PnLCalculatorEngineRepo>();
                builder.Services.AddTransient<IIncrementalPositionLoader, IncrementalPositionLoaderRepo>();
                builder.Services.AddTransient<IAssetSummaryRepo, AssetSummaryRepo>();

                builder.Services.AddHostedService<DemoPositionLoaderWorker>();

                builder.Services.AddCors(options => options.AddPolicy(
                    "CorsPolicy", policy => policy.WithOrigins("http://localhost:5173").AllowAnyHeader().WithMethods("GET")));

                builder.Services.AddEndpointsApiExplorer();
                builder.Services.AddSwaggerGen();

                var app = builder.Build();

                // Add Serilog Request Logging (Automatically logs HTTP request method, path, status code, and execution time)
                app.UseSerilogRequestLogging();

                // Configure the HTTP request pipeline.
                if (app.Environment.IsDevelopment())
                {
                    app.UseSwagger();
                    app.UseSwaggerUI();
                }

                app.UseStaticFiles();  ///files are publicily downloadable
                app.UseCors("CorsPolicy");
                app.UseHttpsRedirection();
                app.UseAuthorization();
                app.MapControllers();

                app.Run();
            }
            catch (Exception ex)
            {
                Log.Fatal(ex, "VCM Trading Desk Host terminated unexpectedly.");
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }
    }
}