# VANTAGE MARKET CAPTIALS : Trades execution and transaction history

An enterprise-grade trading execution blotter and real-time Mark-to-Market (MtM) Position & PnL tracking console designed for institutional trading desks. This solution delivers a low-latency, resilient platform that unifies real-time transaction auditing with an automated Mark-to-Market (MtM) valuation engine. By leveraging targeted database indexing, client-side memory caching, and incremental snapshot generation, the system minimizes server overhead while ensuring complete auditability and zero data misinterpretation.

---

## Tech Stack

* **Frontend:** React, Tailwind CSS, Lucide Icons, Axios
* **Backend:** .NET 8 Web API (C#)
* **Database:** SQL Server 2019+ (Views, Stored Procedures, Indexes)

---

## Prerequisites

* **Database:** SQL Server 2019+ or Azure SQL
* **Backend:** .NET 8.0 SDK
* **Frontend:** Node.js v18+ & npm v9+

---

## 1. Database Setup

1. Connect to your SQL Server instance via SQL Server Management Studio (SSMS).
2. Execute the setup script to initialize the target database
3. Run database scripts in the following execution order:
* **Base Tables:** Execute scripts for `Traders`, `Securities`, and `Trades`.
* **Database Views:** Deploy `dbo.vw_TradeHistory`.
* **Stored Procedures:** Deploy `sp_GetTradeBlotter` and PnL Engine stored procedures.
* **Indexes:** Create non-clustered indexes on `dbo.Trades(TradeDate, TraderID, SecurityID)` and `dbo.EOD_Prices (PriceDate ASC, SecurityId ASC)`


---

## 2. Backend API Setup (.NET)

1. Navigate to the Web API project folder:
```bash
cd server/VCMTradingDesk

```


2. Configure the database connection string in `appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=YOUR_SERVER_NAME;Database=VCMTradingDesk;Trusted_Connection=True;TrustServerCertificate=True;"
}

```


3. Restore project dependencies and start the API server:
```bash
dotnet restore
dotnet run

```


4. Access Swagger documentation at `https://localhost:7123/swagger` to verify endpoints.

---

## 3. Frontend Setup (React)

1. Navigate to the React frontend folder:
```bash
cd frontend

```


2. Install required npm packages:
```bash
npm install

```


3. Confirm API base URL configuration in `src/utils/apiConfig.js`:
```javascript
export const API_BASE_URL = "https://localhost:7057/api";

```


4. Start the local development server:
```bash
npm run dev

```

5. Launch the application in the browser at `http://localhost:5173`.

---

## Key Features

* **Trade Execution Blotter:** Multi-parameter search, sorting, dynamic pagination, and instant client-side text filtering.
* **Mark-to-Market PnL Console:** Realized vs. Unrealized yield attribution across Equities, Bonds, and ETFs calculated using Weighted Average Cost (WAC) methodology along with TOP GAINERS , LOSERS w.r.t Return pct
* **Equity Curve Trajectory & Analytics:** Interactive historical performance visualization with in-memory trajectory caching *apiCache* to eliminate redundant backend queries.
* **Incremental EOD Snapshot Engine:** Automated calculation and backfilling of End-of-Day (EOD) position snapshots for selected valuation dates.
* **Security & Asset Summary:** Security-level exposure breakdowns providing granular visibility into individual security metrics, closing prices, net quantity holdings, asset class categorizations
* **Dynamic Error Handling:** Direct server-to-UI error propagation for clear institutional risk visibility.

---

## System Architecture

```
┌─────────────────┐       HTTP              ┌──────────────────┐       ADO.NET                ┌─────────────────┐
│ React Frontend  │ ──────────────────────> │  .NET Web API    │ ───────────────────────────> │   SQL Server    │
│ (Blotter & PnL) │ <────────────────────── │ (Controllers/SPs)│ <─────────────────────────── │  (Views & SPs)  │
└─────────────────┘                         └──────────────────┘                              └─────────────────┘

```
