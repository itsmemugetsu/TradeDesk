import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchTradeBlotter } from '../services/tradeblotterapi';
import { 
  ChevronLeft, ChevronRight, Filter, RotateCcw, Search, ArrowUpDown, 
  Loader2, TrendingUp, TrendingDown, CalendarX, AlertCircle, X 
} from 'lucide-react';

const Initial_Filters = {
  traderId: '',
  securityId: '',
  assetClass: '',
  startDate: '',
  endDate: '',
  sortDirection: 'ASC',
};

const MIN_DATE = '2026-02-02';

export const TradeBlotter = ({ isActive }) => {

  const todayDate = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Separate Draft Inputs from applied filters
  const [draftFilters, setDraftFilters] = useState(Initial_Filters);
  const [appliedFilters, setAppliedFilters] = useState(Initial_Filters);
  
  // Instant Client-Side Search Bar State
  const [searchTerm, setSearchTerm] = useState('');

  // Track if initial API call finished
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Core Data Fetcher
  const loadTrades = useCallback(async (isManualRefresh = false) => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchTradeBlotter(appliedFilters, isManualRefresh);
      setTrades(data || []);
      setCurrentPage(1);
      setHasLoadedOnce(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch trades.');
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    if (isActive && !hasLoadedOnce) {
      loadTrades(false);
    }
  }, [isActive, hasLoadedOnce, loadTrades]);

  useEffect(() => {
    if (hasLoadedOnce && isActive) {
      loadTrades(false);
    }
  }, [appliedFilters]);

  // Draft inputs change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDraftFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Apply button click or Enter submit
  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    setAppliedFilters(draftFilters);
  };

  // Reset Filters
  const handleReset = () => {
    setDraftFilters(Initial_Filters);
    setAppliedFilters(Initial_Filters);
    setSearchTerm('');
    setError(null);
  };

  // Instant change handler specifically for Asset Class dropdown
const handleAssetClassChange = (e) => {
  const { value } = e.target;
  // Updates draft filters so the dropdown UI updates
  setDraftFilters((prev) => ({ ...prev, assetClass: value }));
  setAppliedFilters((prev) => ({ ...prev, assetClass: value }));
};

  // Sort Toggle
  const toggleSort = () => {
    const updatedSort = appliedFilters.sortDirection === 'DESC' ? 'ASC' : 'DESC';
    setDraftFilters((prev) => ({ ...prev, sortDirection: updatedSort }));
    setAppliedFilters((prev) => ({ ...prev, sortDirection: updatedSort }));
  };

  //Client-Side Instant Multi-Field Search Filter
  const filteredTrades = useMemo(() => {
    if (!searchTerm.trim()) return trades;
    const query = searchTerm.toLowerCase().trim();

    return trades.filter((trade) => {
      return (
        trade.securityID?.toLowerCase().includes(query) ||
        trade.securityName?.toLowerCase().includes(query) ||
        trade.traderName?.toLowerCase().includes(query) ||
        trade.traderID?.toString().toLowerCase().includes(query) ||
        trade.assetClass?.toLowerCase().includes(query) ||
        trade.buySell?.toLowerCase().includes(query) ||
        trade.tradeID?.toString().toLowerCase().includes(query)
      );
    });
  }, [trades, searchTerm]);

  // Search Input Handler (Resets pagination to page 1)
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Pagination math (Operates on filteredTrades)
  const totalRecords = filteredTrades.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedTrades = filteredTrades.slice(startIndex, endIndex);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trade Blotter</h1>
          <p className="text-sm text-slate-500">Real-time Trades execution and transaction history</p>
        </div>
      </div>

      {/* Filter Parameters Form */}
      <form onSubmit={handleApplyFilters} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" /> Filter Transactions
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Trader ID</label>
            <input
              type="number"
              name="traderId"
              placeholder="e.g. 101"
              value={draftFilters.traderId}
              onChange={handleInputChange}
              className="w-full h-9 px-3 py-1 bg-white border border-slate-300 rounded-md text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Security ID</label>
            <input
              type="text"
              name="securityId"
              placeholder="e.g. EQ01"
              value={draftFilters.securityId}
              onChange={handleInputChange}
              className="w-full h-9 px-3 py-1 bg-white border border-slate-300 rounded-md text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Asset Class</label>
            <select
              name="assetClass"
              value={draftFilters.assetClass}
              onChange={handleAssetClassChange}
              className="w-full h-9 px-3 py-1 bg-white border border-slate-300 rounded-md text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
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
              min={MIN_DATE}
              max={todayDate}
              value={draftFilters.startDate}
              onChange={handleInputChange}
              className="w-full h-9 px-3 py-1 bg-white border border-slate-300 rounded-md text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              min={MIN_DATE}
              max={todayDate}
              value={draftFilters.endDate}
              onChange={handleInputChange}
              className="w-full h-9 px-3 py-1 bg-white border border-slate-300 rounded-md text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="w-full h-9 inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-slate-900 text-white font-medium text-sm rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors cursor-pointer"
            >
              <Search className="h-4 w-4" /> Filter
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Reset Filters"
              className="h-9 px-3 py-1 border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-sm rounded-md focus:outline-none transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2 shadow-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Instant Search Bar Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search trader, security, ticker..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-slate-800 placeholder-slate-400 shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-semibold text-slate-900">{totalRecords}</span> matching records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider select-none">
                <th className="py-3 px-4 w-[80px]">Trade ID</th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors" onClick={toggleSort}>
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
              ) : displayedTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <CalendarX className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-700">No trades match the search criteria.</p>
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
                        <span className={`inline-flex items-center px-2.5 py-1 text-[12px] font-bold rounded-md border ${
                          trade.assetClass === 'Bond'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : trade.assetClass === 'Equity'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>  
                          {trade.assetClass}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[13px] font-semibold rounded ${
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
                        ₹{trade.price?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm font-semibold text-slate-900">
                        ₹{trade.totalValue?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalRecords > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
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
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
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

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 mr-2">
                Page <span className="font-medium text-slate-800">{currentPage}</span> of{' '}
                <span className="font-medium text-slate-800">{totalPages || 1}</span>
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium cursor-pointer"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeBlotter;