use IVP4271tradev

--tradehistory view
CREATE OR ALTER VIEW dbo.vw_TradeHistory AS
SELECT 
    t.TradeID,
    t.TradeDate,
    t.TraderID,
    tr.TraderName,
    t.SecurityID,
    s.SecurityName,
    s.AssetClass,
    s.Category,
    t.BuySell,
    t.Quantity,
    t.Price,
    (t.Quantity * t.Price) AS TotalValue
FROM dbo.Trades t
JOIN dbo.Securities s ON t.SecurityID = s.SecurityID
JOIN dbo.Traders tr   ON t.TraderID = tr.TraderID;
GO

--sp_GetTradeBlotter
CREATE OR ALTER PROC sp_GetTradeBlotter
    @TraderID      INT           = NULL,
    @SecurityID    VARCHAR(50)   = NULL,
	@AssetClass    VARCHAR(50)   = NULL,
    @StartDate     DATE          = NULL,
    @EndDate       DATE          = NULL,
    @SortDirection VARCHAR(4)    = 'DESC'
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        TradeID, TradeDate, TraderID, TraderName, 
		SecurityID, SecurityName, AssetClass, 
        Category, BuySell, Quantity, Price, TotalValue
    FROM vw_TradeHistory
    WHERE (@StartDate IS NULL OR CAST(TradeDate AS DATE) >= @StartDate)
      AND (@EndDate IS NULL OR CAST(TradeDate AS DATE) <= @EndDate)
      AND (@TraderID IS NULL   OR TraderID = @TraderID)
      AND (@SecurityID IS NULL OR SecurityID = @SecurityID)
	  AND (@AssetClass IS NULL OR AssetClass = @AssetClass)
    ORDER BY 
        CASE WHEN UPPER(@SortDirection) = 'ASC'  THEN TradeDate END ASC,
        CASE WHEN UPPER(@SortDirection) <> 'ASC' THEN TradeDate END DESC,
        TradeID DESC
    OPTION (RECOMPILE);
END;
GO


--- eod position snapshot TVP temprorary for bulk data insert
IF NOT EXISTS (SELECT * FROM sys.types WHERE name = 'EODPositionSnapshotType')
BEGIN
    CREATE TYPE dbo.EODPositionSnapshotType AS TABLE
    (
        ValuationDate         DATE          NOT NULL,
        SecurityId            VARCHAR(50)   NOT NULL,
        NetQuantity           INT           NOT NULL,
        WeightedAvgCost       DECIMAL(18,4) NOT NULL,
        RealizedPnL           DECIMAL(18,4) NOT NULL,
        UnrealizedPnL         DECIMAL(18,4) NOT NULL,
        TotalPnL              DECIMAL(18,4) NOT NULL,
        ClosePrice            DECIMAL(18,4) NOT NULL
    );
END;
GO

---  BULK INSERT INTO THE EOD SNAPSHOT TO AVOID THE RACE CONDITIONS AND CONCURRENCY MAINTAINED
CREATE OR ALTER PROCEDURE dbo.sp_SaveEODPositionSnapshotsBatch
    @Snapshots dbo.EODPositionSnapshotType READONLY
AS
BEGIN
    MERGE dbo.EOD_Snapshots AS target
    USING @Snapshots AS source
       ON target.ValuationDate = source.ValuationDate
      AND target.SecurityId    = source.SecurityId

    WHEN MATCHED THEN
        UPDATE SET 
            target.NetQuantity           = source.NetQuantity,
            target.WeightedAvgCost       = source.WeightedAvgCost,
            target.RealizedPnL           = source.RealizedPnL,
            target.UnrealizedPnL         = source.UnrealizedPnL,
            target.TotalPnL              = source.TotalPnL,
            target.ClosePrice            = source.ClosePrice,
            target.CreatedAt             = CAST(GETUTCDATE() AS DATE)

    WHEN NOT MATCHED THEN
        INSERT (
            ValuationDate, 
            SecurityId, 
            NetQuantity, 
            WeightedAvgCost, 
            RealizedPnL, 
            UnrealizedPnL, 
            TotalPnL, 
            ClosePrice, 
            CreatedAt
        )
        VALUES (
            source.ValuationDate, 
            source.SecurityId, 
            source.NetQuantity, 
            source.WeightedAvgCost, 
            source.RealizedPnL, 
            source.UnrealizedPnL, 
            source.TotalPnL, 
            source.ClosePrice, 
            CAST(GETUTCDATE() AS DATE)
        );
END;
GO


-- Indexes
CREATE NONCLUSTERED INDEX IX_EodPrices_PriceDate_SecurityId_Covering
ON dbo.EOD_Prices (PriceDate ASC, SecurityId ASC)
INCLUDE (ClosePrice);

--
CREATE NONCLUSTERED INDEX [IX_Trades_Blotter] ON [dbo].[Trades]
(
    [TradeDate] ASC,
    [TraderID] ASC,
    [SecurityID] ASC
)
INCLUDE([TradeID],[BuySell],[Quantity],[Price])

CREATE NONCLUSTERED INDEX IX_Securities_Covering
ON dbo.Securities (SecurityID)
INCLUDE (SecurityName, AssetClass, Category);