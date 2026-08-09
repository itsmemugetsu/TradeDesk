using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Runtime.Intrinsics.X86;
using VCMTradingDesk.Models;

namespace VCMTradingDesk.DataAccess;

public partial class Ivp4271tradevContext : DbContext
{
    public Ivp4271tradevContext()
    {
    }

    public Ivp4271tradevContext(DbContextOptions<Ivp4271tradevContext> options)
        : base(options)
    {
    }

    public virtual DbSet<EodPrice> EodPrices { get; set; }

    public virtual DbSet<EodSnapshot> EodSnapshots { get; set; }

    public virtual DbSet<Security> Securities { get; set; }

    public virtual DbSet<Trade> Trades { get; set; }

    public virtual DbSet<Trader> Traders { get; set; }

    public virtual DbSet<VwTradeHistory> VwTradeHistories { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder) { }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EodPrice>(entity =>
        {
            entity
                .HasNoKey()
                .ToTable("EOD_Prices");

            entity.HasIndex(e => new { e.PriceDate, e.SecurityId }, "IX_EodPrices_PriceDate_SecurityId_Covering");

            entity.Property(e => e.ClosePrice).HasColumnType("decimal(18, 4)");
            entity.Property(e => e.SecurityId)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("SecurityID");

            entity.HasOne(d => d.Security).WithMany()
                .HasForeignKey(d => d.SecurityId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EOD_Prices_Securities");
        });

        modelBuilder.Entity<EodSnapshot>(entity =>
        {
            entity.HasKey(e => new { e.ValuationDate, e.SecurityId });

            entity.ToTable("EOD_Snapshots");

            entity.Property(e => e.SecurityId)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("SecurityID");
            entity.Property(e => e.ClosePrice).HasColumnType("decimal(18, 4)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.RealizedPnL).HasColumnType("decimal(18, 4)");
            entity.Property(e => e.TotalPnL).HasColumnType("decimal(18, 4)");
            entity.Property(e => e.UnrealizedPnL).HasColumnType("decimal(18, 4)");
            entity.Property(e => e.WeightedAvgCost).HasColumnType("decimal(18, 4)");

            entity.HasOne(d => d.Security).WithMany(p => p.EodSnapshots)
                .HasForeignKey(d => d.SecurityId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EOD_Snapshots_Securities");
        });

        modelBuilder.Entity<Security>(entity =>
        {
            entity.Property(e => e.SecurityId)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("SecurityID");
            entity.Property(e => e.AssetClass).HasMaxLength(50);
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.CouponRatePct).HasColumnType("decimal(7, 4)");
            entity.Property(e => e.FaceValue).HasColumnType("decimal(18, 4)");
            entity.Property(e => e.SecurityName).HasMaxLength(50);
            entity.Property(e => e.StartPrice).HasColumnType("decimal(18, 4)");
        });

        modelBuilder.Entity<Trade>(entity =>
        {
            entity.HasIndex(e => new { e.TradeDate, e.TraderId, e.SecurityId }, "IX_Trades_Blotter");

            entity.Property(e => e.TradeId)
                .ValueGeneratedNever()
                .HasColumnName("TradeID");
            entity.Property(e => e.BuySell).HasMaxLength(50);
            entity.Property(e => e.Price).HasColumnType("decimal(18, 4)");
            entity.Property(e => e.SecurityId)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("SecurityID");
            entity.Property(e => e.TraderId).HasColumnName("TraderID");

            entity.HasOne(d => d.Security).WithMany(p => p.Trades)
                .HasForeignKey(d => d.SecurityId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Trades_Securities");

            entity.HasOne(d => d.Trader).WithMany(p => p.Trades)
                .HasForeignKey(d => d.TraderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Trades_Traders");
        });

        modelBuilder.Entity<Trader>(entity =>
        {
            entity.Property(e => e.TraderId)
                .ValueGeneratedNever()
                .HasColumnName("TraderID");
            entity.Property(e => e.Desk).HasMaxLength(50);
            entity.Property(e => e.TraderName).HasMaxLength(50);
        });

        modelBuilder.Entity<VwTradeHistory>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_TradeHistory");

            entity.Property(e => e.AssetClass).HasMaxLength(50);
            entity.Property(e => e.BuySell).HasMaxLength(50);
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.Price).HasColumnType("decimal(18, 4)");
            entity.Property(e => e.SecurityId)
                .HasMaxLength(50)
                .HasColumnName("SecurityID");
            entity.Property(e => e.SecurityName).HasMaxLength(50);
            entity.Property(e => e.TotalValue).HasColumnType("decimal(29, 4)");
            entity.Property(e => e.TradeId).HasColumnName("TradeID");
            entity.Property(e => e.TraderId).HasColumnName("TraderID");
            entity.Property(e => e.TraderName).HasMaxLength(50);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
