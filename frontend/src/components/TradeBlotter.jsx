import React, { useState, useEffect, useCallback } from 'react';
import { fetchTradeBlotter } from '../services/tradeblotterapi';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  Filter, 
  RotateCcw, 
  Search, 
  ArrowUpDown, 
  Loader2, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';

const Initial_Filters = {
  traderId: '',
  securityId: '',
  assetClass: '',
  startDate: '',
  endDate: '',
  sortDirection: 'ASC',
};

export const TradeBlotter = () => {
  const [filters, setFilters] = useState(Initial_Filters);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Default to 20

  //page size handling
  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1); //reset to 1
  };

  //pagination Calculations
  const totalRecords = trades.length;
  // console.log(totalRecords)
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedTrades = trades.slice(startIndex, endIndex);
  // console.log(displayedTrades)

  const loadTrades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTradeBlotter(filters);
      setTrades(data);
      setCurrentPage(1); 
    } catch (err) {
      setError(err.message || 'Failed to fetch trades.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters(Initial_Filters);
  };

  const toggleSort = () => {
    setFilters((prev) => ({
      ...prev,
      sortDirection: prev.sortDirection === 'DESC' ? 'ASC' : 'DESC',
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trade Blotter</h1>
          <p className="text-sm text-slate-500">Real-time execution log and transaction history</p>
        </div>
        <button
          onClick={loadTrades}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" /> Filter Transactions
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Trader ID</label>
            <input
              type="number"
              name="traderId"
              placeholder="e.g. 101"
              value={filters.traderId}
              onChange={handleInputChange}
              className="w-full h-9 px-3 py-1 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Security ID</label>
            <input
              type="text"
              name="securityId"
              placeholder="e.g. EQ01"
              value={filters.securityId}
              onChange={handleInputChange}
              className="w-full h-9 px-3 py-1 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Asset Class</label>
            <select
              name="assetClass"
              value={filters.assetClass}
              onChange={handleInputChange}
              className="w-full h-9 px-3 py-1 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">All Asset Classes</option>
              <option value="Equity">Equity</option>
              <option value="ETF">ETF</option>
              <option value="Bond">Bond</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleInputChange}
              className="w-full h-9 px-3 py-1 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleInputChange}
              className="w-full h-9 px-3 py-1 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={loadTrades}
              className="w-full h-9 inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-slate-900 text-white font-medium text-sm rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors"
            >
              <Search className="h-4 w-4" /> Filter
            </button>
            <button
              onClick={handleReset}
              title="Reset Filters"
              className="h-9 px-3 py-1 border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-sm rounded-md focus:outline-none transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Blotter Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-[80px]">Trade ID</th>
                <th className="py-3 px-4 cursor-pointer select-none" onClick={toggleSort}>
                  <div className="flex items-center gap-1">
                    Trade Date <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Trader</th>
                <th className="py-3 px-4">Security</th>
                <th className="py-3 px-4">Asset Class</th>
                <th className="py-3 px-4">Side</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
                    Fetching blotter records...
                  </td>
                </tr>
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No trades match the selected criteria.
                  </td>
                </tr>
              ) : (
                displayedTrades.map((trade) => {
                  const isBuy = trade.buySell?.toUpperCase() === 'BUY';
                  return (
                    <tr key={trade.tradeID} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-sm font-semibold text-slate-800">
                        {trade.tradeID}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                        {trade.tradeDate}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm text-slate-900">{trade.traderName}</div>
                        <div className="text-[10px] text-slate-400">ID: {trade.traderID}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-sm text-slate-900">{trade.securityID}</div>
                        <div className="text-[10px] text-slate-500">{trade.securityName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded">
                          {trade.assetClass}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded ${
                            isBuy
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isBuy ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {trade.buySell}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-slate-700">
                        {trade.quantity?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-slate-700">
                        ${trade.price?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm font-semibold text-slate-900">
                        ${trade.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
    {totalRecords > 0 && (
  <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
    
    {/* Record Counter & Page Size Selector */}
    <div className="flex items-center gap-4">
      <div>
        Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{' '}
        <span className="font-semibold text-slate-900">{Math.min(endIndex, totalRecords)}</span> of{' '}
        <span className="font-semibold text-slate-900">{totalRecords}</span> results
      </div>

      <div className="flex items-center gap-2 border-l border-slate-300 pl-4">
        <label htmlFor="pageSizeSelect" className="text-xs font-medium text-slate-500">
          Rows per page:
        </label>
        <select
          id="pageSizeSelect"
          value={pageSize}
          onChange={handlePageSizeChange}
          className="h-8 px-2 border border-slate-300 rounded-md bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>

    {/* Previous / Next Page Controls */}
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 mr-2">
        Page <span className="font-medium text-slate-800">{currentPage}</span> of{' '}
        <span className="font-medium text-slate-800">{totalPages || 1}</span>
      </span>

      <button
        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium"
      >
        <ChevronLeft className="h-4 w-4" /> Previous
      </button>

      <button
        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages || totalPages === 0}
        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium"
      >
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  </div>
    )}
    </div>
  );
}

export default TradeBlotter