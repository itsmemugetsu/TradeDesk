import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Search, RotateCcw, Info, Calendar, ArrowUpRight, ArrowDownRight,
  Loader2, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, X
} from 'lucide-react';
import { fetchPnLSnapshot } from '../services/pnlservice';
import { fetchEquityCurve } from '../services/fetchEquityCurve';
import PnLEquityCurveChart from './PnLEquityCurveChart';
import ExportPnLButton from './ExportPnLButton';

export default function PnLConsole({ isActive }) {

  const todayDate = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [valuationDate, setValuationDate] = useState('2026-03-31');
  const [fetchedValuationDate, setFetchedValuationDate] = useState('2026-03-31');

  // Tracks initial mount state & in-memory trajectory cache
  const hasLoadedRef = useRef(false);
  const trajectoryCacheRef = useRef(new Map());

  const [pnlData, setPnlData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search Input State
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [selectedAssetClass, setSelectedAssetClass] = useState('ALL');
  const [sortColumn, setSortColumn] = useState('unrealized');
  const [sortDirection, setSortDirection] = useState('DESC');
  const [quickFilter, setQuickFilter] = useState('ALL');

  // Debounce Effect (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleClearSearch = () => {
    setSearchInput('');
    setDebouncedSearch('');
  };

  const resolveAssetClass = (item) => {
    if (item.assetClass) return item.assetClass;
    if (item.securityId?.startsWith('BD')) return 'Bond';
    if (item.securityId?.startsWith('EQ')) return 'Equity';
    if (item.securityId?.startsWith('ET')) return 'ETF';
    return 'Other';
  };

  // 🟢 FIX FOR FLAW #1: Only return a security ID if it EXACTLY matches a valid ticker in pnlData
  const validSecurityId = useMemo(() => {
    if (!debouncedSearch) return '';
    const match = pnlData.find(
      (item) => item.securityId?.toLowerCase() === debouncedSearch.toLowerCase()
    );
    return match ? match.securityId : '';
  }, [pnlData, debouncedSearch]);

  // 1. Fetch PnL Snapshot
  const loadSnapshotData = useCallback(async (targetDate, forceRefresh = false) => {
    try {
      const snapshot = await fetchPnLSnapshot(targetDate, forceRefresh);
      setPnlData(snapshot || []);
      setFetchedValuationDate(targetDate);
    } catch (err) {
      throw new Error(err.message || 'Failed to fetch PnL snapshot.'); //catching from the server
    }
  }, []);

  // Trajectory Fetcher with In-Memory Caching per Asset Class
  const loadTrajectoryData = useCallback(async (targetDate, assetClass, security, forceRefresh = false) => {
    const cacheKey = `${targetDate}_${assetClass}_${security}`;

    // Serve from component cache if available and not forced refresh
    if (!forceRefresh && trajectoryCacheRef.current.has(cacheKey)) {
      setChartData(trajectoryCacheRef.current.get(cacheKey));
      return;
    }

    try {
      const trajectory = await fetchEquityCurve(targetDate, assetClass, security, forceRefresh);
      trajectoryCacheRef.current.set(cacheKey, trajectory || []);
      setChartData(trajectory || []);
    } catch (err) {
     throw new Error(err.message || 'Failed to fetch trajectory curve.');
    }
  }, []);

  // Master Orchestrator (Used for initial mount & manual forced refresh)
  const handleFullLoad = useCallback(async (isManualRefresh = false) => {
    setLoading(true);
    setError(null);

    if (isManualRefresh) {
      trajectoryCacheRef.current.clear(); // Invalidate trajectory cache on explicit refresh
    }

    try {
      await Promise.all([
        loadSnapshotData(valuationDate, isManualRefresh),
        loadTrajectoryData(valuationDate, selectedAssetClass, validSecurityId, isManualRefresh)
      ]);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [valuationDate, selectedAssetClass, validSecurityId, loadSnapshotData, loadTrajectoryData]);

  // Handle Tab Activation and Date Changes
  useEffect(() => {
    if (!isActive) return;

    if (!hasLoadedRef.current) {
      handleFullLoad(false);
    }
  }, [isActive, handleFullLoad]);

  // Handle Date Picker Changes
  useEffect(() => {
    if (!isActive || !hasLoadedRef.current) return;
    handleFullLoad(false);
  }, [valuationDate]);

  // Uses Cached Trajectory Data where available
// Handles chart updates and catches backend errors when asset class or ticker changes
  useEffect(() => {
    if (!isActive || !hasLoadedRef.current) return;

    let isSubscribed = true;

    const updateChartOnly = async () => {
      try {
        await loadTrajectoryData(valuationDate, selectedAssetClass, validSecurityId, false);
        if (isSubscribed) setError(null);
      } catch (err) {
        if (isSubscribed) {
          setError(err.message);
        }
      }
    };

    updateChartOnly();

    return () => {
      isSubscribed = false;
    };
  }, [selectedAssetClass, validSecurityId, valuationDate, loadTrajectoryData, isActive]);

  const weekendDisclaimer = useMemo(() => {
    if (loading || fetchedValuationDate !== valuationDate) return null;

    if (pnlData.length > 0) {
      const returnedDate = pnlData[0].valuationDate;
      if (returnedDate && returnedDate !== valuationDate) {
        return `Markets were closed on ${valuationDate}. Showing position for the last active trading session (${returnedDate}).`;
      }
    }
    return null;
  }, [pnlData, valuationDate, fetchedValuationDate, loading]);

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('DESC');
    }
  };

  const filteredData = useMemo(() => {
    return pnlData
      .map((item) => {
        const qty = item.netQuantity ?? item.position ?? 0;
        const wac = item.weightedAvgCost ?? item.wac ?? 0;
        const closePrice = item.closePrice ?? item.closingPrice ?? 0;
        const realized = item.cumulativeRealizedPnL ?? item.realizedPnL ?? 0;
        const unrealized = item.unrealizedPnL ?? 0;
        const total = item.totalPnL ?? (realized + unrealized);
        const returnPct = wac > 0 ? ((closePrice - wac) / wac) * 100 : 0;
        return {
          ...item,
          qty,
          wac,
          closePrice,
          realized,
          unrealized,
          total,
          returnPct
        };
      })
      .filter((item) => {
        const query = debouncedSearch.toLowerCase();
        const matchesSearch =
          !query ||
          item.securityId?.toLowerCase().includes(query) ||
          item.securityName?.toLowerCase().includes(query);

        const assetType = resolveAssetClass(item);
        const matchesAsset =
          selectedAssetClass === 'ALL' || assetType.toLowerCase() === selectedAssetClass.toLowerCase();

        let matchesQuickFilter = true;
        if (quickFilter === 'ALL_OPEN') matchesQuickFilter = item.qty > 0;
        else if (quickFilter === 'GAINERS') matchesQuickFilter = item.qty > 0 && item.unrealized > 0;
        else if (quickFilter === 'LOSERS') matchesQuickFilter = item.qty > 0 && item.unrealized < 0;
        else if (quickFilter === 'CLOSED') matchesQuickFilter = item.qty === 0;

        return matchesSearch && matchesAsset && matchesQuickFilter;
      })
      .sort((a, b) => {
        let aVal = a[sortColumn] ?? 0;
        let bVal = b[sortColumn] ?? 0;
        if (typeof aVal === 'string') {
          return sortDirection === 'ASC'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return sortDirection === 'ASC' ? aVal - bVal : bVal - aVal;
      });
  }, [pnlData, debouncedSearch, selectedAssetClass, quickFilter, sortColumn, sortDirection]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => ({
        realized: acc.realized + item.realized,
        unrealized: acc.unrealized + item.unrealized,
        total: acc.total + item.total,
      }),
      { realized: 0, unrealized: 0, total: 0 }
    );
  }, [filteredData]);

  const formatCurrency = (val) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${isNegative ? '-' : '+'}₹${absVal}`;
  };

  const renderSortIcon = (columnKey) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'ASC' ? (
      <ArrowUp className="h-3 w-3 text-emerald-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-emerald-600" />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-xl font-bold tracking-wide text-slate-900">Positions & P&L Console</h1>
            <p className="text-xs text-slate-500 mt-0.5">Mark-to-Market P&L with yield attribution</p>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-xl p-1.5">
            <div className="flex items-center gap-2 px-3 py-1.5 text-slate-500 text-xs">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">Valuation Date</span>
            </div>
            
            <input
              type="date"
              value={valuationDate}
              min="2026-02-02"
              max={todayDate}
              onChange={(e) => setValuationDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
            
            <ExportPnLButton valuationDate={valuationDate} pnlData={pnlData} />

          </div>
        </div>

        {weekendDisclaimer && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2 shadow-sm">
            <Info className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="font-medium">{weekendDisclaimer}</span>
          </div>
        )}

        <PnLEquityCurveChart
          data={chartData}
          valuationDate={valuationDate}
          activeAssetClass={selectedAssetClass}
          activeSecurity={validSecurityId}
        />

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Realized P&L</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-2xl font-mono font-bold ${totals.realized >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(totals.realized)}
              </span>
              {totals.realized >= 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-rose-600" />}
            </div>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Unrealized P&L</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-2xl font-mono font-bold ${totals.unrealized >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(totals.unrealized)}
              </span>
              {totals.unrealized >= 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-rose-600" />}
            </div>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 bg-gradient-to-br from-white to-slate-50">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Combined P&L</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-2xl font-mono font-bold ${totals.total >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="space-y-3 bg-white border border-slate-200 shadow-sm rounded-xl p-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticker, security name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-emerald-500 placeholder-slate-400"
              />
              {searchInput && (
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

            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1 w-full sm:w-auto">
              {['ALL', 'Equity', 'Bond', 'ETF'].map((asset) => (
                <button
                  key={asset}
                  type="button"
                  onClick={() => setSelectedAssetClass(asset)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    selectedAssetClass === asset
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {asset === 'ALL' ? 'All Assets' : asset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium mr-1 uppercase tracking-wider shrink-0">Strategy View:</span>
            {[
              { id: 'ALL', label: 'Show All', tooltip: 'Display all portfolio positions regardless of profit or loss' },
              { id: 'GAINERS', label: 'Top Gainers', tooltip: 'Show open positions currently generating profit (Unrealized P&L > 0)' },
              { id: 'LOSERS', label: 'Underperformers', tooltip: 'Show open positions currently generating a loss (Unrealized P&L < 0)' },
            ].map((preset) => (
              <div key={preset.id} className="relative group shrink-0">
                <button
                  type="button"
                  onClick={() => setQuickFilter(preset.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                    quickFilter === preset.id
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>

                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                  <div className="bg-slate-900 text-slate-100 text-[10px] font-medium py-1 px-2.5 rounded-md shadow-lg whitespace-nowrap">
                    {preset.tooltip}
                  </div>
                  <div className="w-2 h-2 -mt-1 bg-slate-900 rotate-45"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 shadow-sm">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Positions Matrix Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider select-none">
                  <th onClick={() => handleSort('securityId')} className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>Ticker</span>
                      {renderSortIcon('securityId')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('securityName')} className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>Security Name</span>
                      {renderSortIcon('securityName')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Asset-Class</th>
                  <th onClick={() => handleSort('qty')} className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Qty</span>
                      {renderSortIcon('qty')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('wac')} className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>WAC (Avg)</span>
                      {renderSortIcon('wac')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('closePrice')} className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>EOD Price</span>
                      {renderSortIcon('closePrice')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('returnPct')} className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Return %</span>
                      {renderSortIcon('returnPct')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('realized')} className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Realized P&L</span>
                      {renderSortIcon('realized')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('unrealized')} className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Unrealized P&L</span>
                      {renderSortIcon('unrealized')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('total')} className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Total P&L</span>
                      {renderSortIcon('total')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Fetching position snapshots for {valuationDate}...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No position snapshots found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => {
                    const assetType = resolveAssetClass(row);
                    const isBond = assetType === 'Bond';
                    return (
                      <tr
                        key={row.securityId}
                        className={`hover:bg-slate-50 transition-colors ${isBond ? 'bg-amber-50/40' : ''}`}
                      >
                        <td className="py-3.5 px-4 font-mono text-sm font-bold text-slate-900 tracking-wide">
                          {row.securityId}
                        </td>
                        <td className="py-3.5 px-4 text-[12px] text-slate-700 font-bold">
                          {row.securityName || row.securityId}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[12px] font-semibold rounded-md border ${
                            isBond
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : assetType === 'Equity'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {assetType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[13px] text-center font-mono font-medium text-slate-900">
                          {row.qty.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-[13px] text-center font-mono text-slate-500">
                          ₹{row.wac.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-[13px] text-center font-mono text-slate-900 font-medium">
                          ₹{row.closePrice.toFixed(2)}
                        </td>
                        <td className={`py-3.5 px-4 text-[13px] text-center font-mono font-medium ${
                          row.returnPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {row.returnPct >= 0 ? '+' : ''}{row.returnPct.toFixed(2)}%
                        </td>
                        <td className={`py-3.5 px-4 text-[13px] text-center font-mono font-medium ${
                          row.realized >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {formatCurrency(row.realized)}
                        </td>
                        <td className={`py-3.5 px-4 text-[13px] text-center font-mono font-medium ${
                          row.unrealized >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {formatCurrency(row.unrealized)}
                        </td>
                        <td className={`py-3.5 px-4 text-[12px] text-right font-mono font-bold ${
                          row.total >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {formatCurrency(row.total)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}