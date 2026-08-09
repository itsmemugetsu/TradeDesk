import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, RotateCcw, Info, Calendar, Wallet, ArrowUpRight, ArrowDownRight,
  Loader2, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { fetchPnLSnapshot } from '../services/pnlservice';

export default function PnLConsole() {
  const [valuationDate, setValuationDate] = useState('2026-03-31');
  const [pnlData, setPnlData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetClass, setSelectedAssetClass] = useState('ALL');

  // Decision Support States: Sorting & Strategy Presets
  const [sortColumn, setSortColumn] = useState('unrealized');
  const [sortDirection, setSortDirection] = useState('DESC');
  const [quickFilter, setQuickFilter] = useState('ALL_OPEN');

  // Helper to determine asset class (uses backend value or infers from securityId prefix)
  const resolveAssetClass = (item) => {
    if (item.assetClass) return item.assetClass;
    if (item.securityId?.startsWith('BD')) return 'Bond';
    if (item.securityId?.startsWith('EQ')) return 'Equity';
    if (item.securityId?.startsWith('ET')) return 'ETF';
    return 'Other';
  };

  const loadPnLData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // GET /api/PnL?valuationDate=YYYY-MM-DD
      const data = await fetchPnLSnapshot(valuationDate);
      setPnlData(data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message 
        || err.message 
        || 'Failed to fetch PnL Snapshot.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [valuationDate]);

  useEffect(() => {
    loadPnLData();
  }, [loadPnLData]);

  // Handle Dynamic Header Sorting
  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('DESC');
    }
  };

  // Client-Side Data Mapping, Filtering & Sorting
  const filteredData = useMemo(() => {
    return pnlData
      .map((item) => {
        const qty = item.netQuantity ?? item.position ?? 0;
        const wac = item.weightedAvgCost ?? item.wac ?? 0;
        const closePrice = item.closePrice ?? item.closingPrice ?? 0;
        const realized = item.cumulativeRealizedPnL ?? item.realizedPnL ?? 0;
        const unrealized = item.unrealizedPnL ?? 0;
        const total = item.totalPnL ?? (realized + unrealized);

        // Unrealized Return % on open capital base
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
        // 1. Text Search Filter
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          item.securityId?.toLowerCase().includes(query) ||
          item.securityName?.toLowerCase().includes(query);
        
        // 2. Asset Class Filter
        const assetType = resolveAssetClass(item);
        const matchesAsset = 
          selectedAssetClass === 'ALL' || assetType.toLowerCase() === selectedAssetClass.toLowerCase();

        // 3. Strategy Quick Filter Presets
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
  }, [pnlData, searchQuery, selectedAssetClass, quickFilter, sortColumn, sortDirection]);

  // Portfolio KPIs recalculated dynamically from filtered view
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => {
        return {
          realized: acc.realized + item.realized,
          unrealized: acc.unrealized + item.unrealized,
          total: acc.total + item.total,
        };
      },
      { realized: 0, unrealized: 0, total: 0 }
    );
  }, [filteredData]);

  // Formatter: Indian Rupee (₹) with 3 decimal places
  const formatCurrency = (val) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val || 0).toLocaleString('en-IN', { 
      minimumFractionDigits: 3, 
      maximumFractionDigits: 3 
    });
    return `${isNegative ? '-' : '+'}₹${absVal}`;
  };

  // Helper to render sort column direction icons
  const renderSortIcon = (columnKey) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'ASC' ? (
      <ArrowUp className="h-3 w-3 text-emerald-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-emerald-400" />
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#E1E4EA] font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E232F] pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#161B26] border border-[#262C3A] rounded-xl text-emerald-400">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-wide text-white">Positions & P&L Console</h1>
              </div>
              <p className="text-xs text-[#8A93A6] mt-0.5">Mark-to-Market ledger & yield attribution</p>
            </div>
          </div>

          {/* Valuation Date Picker Controls */}
          <div className="flex items-center gap-2 bg-[#161B26] border border-[#262C3A] rounded-xl p-1.5">
            <div className="flex items-center gap-2 px-3 text-[#8A93A6] text-xs">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <span className="font-medium">Valuation Date</span>
            </div>
            <input
              type="date"
              value={valuationDate}
              onChange={(e) => setValuationDate(e.target.value)}
              className="bg-[#0B0E14] border border-[#262C3A] text-white text-xs font-mono font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
            <button
              onClick={loadPnLData}
              disabled={loading}
              title="Refresh Data"
              className="p-1.5 hover:bg-[#262C3A] text-[#8A93A6] hover:text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Portfolio Summary Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#121621] border border-[#1E232F] rounded-xl p-4">
            <div className="text-xs font-medium text-[#8A93A6] uppercase tracking-wider">Total Realized P&L</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-2xl font-mono font-bold ${totals.realized >= 0 ? 'text-[#00D09C]' : 'text-[#EB5757]'}`}>
                {formatCurrency(totals.realized)}
              </span>
              {totals.realized >= 0 ? <ArrowUpRight className="h-4 w-4 text-[#00D09C]" /> : <ArrowDownRight className="h-4 w-4 text-[#EB5757]" />}
            </div>
          </div>

          <div className="bg-[#121621] border border-[#1E232F] rounded-xl p-4">
            <div className="text-xs font-medium text-[#8A93A6] uppercase tracking-wider">Total Unrealized P&L</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-2xl font-mono font-bold ${totals.unrealized >= 0 ? 'text-[#00D09C]' : 'text-[#EB5757]'}`}>
                {formatCurrency(totals.unrealized)}
              </span>
              {totals.unrealized >= 0 ? <ArrowUpRight className="h-4 w-4 text-[#00D09C]" /> : <ArrowDownRight className="h-4 w-4 text-[#EB5757]" />}
            </div>
          </div>

          <div className="bg-[#121621] border border-[#1E232F] rounded-xl p-4 bg-gradient-to-br from-[#121621] to-[#171D2B]">
            <div className="text-xs font-medium text-[#8A93A6] uppercase tracking-wider">Net Combined P&L</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-2xl font-mono font-bold ${totals.total >= 0 ? 'text-[#00D09C]' : 'text-[#EB5757]'}`}>
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Controls Bar: Search, Asset Tabs & Strategy Presets */}
        <div className="space-y-3 bg-[#121621] border border-[#1E232F] rounded-xl p-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Text Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5A6375]" />
              <input
                type="text"
                placeholder="Search ticker, security name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#262C3A] text-white text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500 placeholder-[#5A6375]"
              />
            </div>

            {/* Asset Class Filter Tabs */}
            <div className="flex items-center bg-[#0B0E14] border border-[#262C3A] rounded-lg p-1 w-full sm:w-auto">
              {['ALL', 'Equity', 'Bond', 'ETF'].map((asset) => (
                <button
                  key={asset}
                  onClick={() => setSelectedAssetClass(asset)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    selectedAssetClass === asset
                      ? 'bg-[#1E232F] text-white shadow-sm border border-[#323B4E]'
                      : 'text-[#8A93A6] hover:text-white'
                  }`}
                >
                  {asset === 'ALL' ? 'All Assets' : asset}
                </button>
              ))}
            </div>
          </div>

          {/* Trader Action Strategy Presets */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[#1E232F]/60">
            <span className="text-[11px] text-[#8A93A6] font-medium mr-1 uppercase tracking-wider shrink-0">Strategy View:</span>
            {[
              // { id: 'ALL_OPEN', label: 'Active Positions' },
              { id: 'GAINERS', label: ' Top Gainers' },
              { id: 'LOSERS', label: ' Underperformers' },
              // { id: 'CLOSED', label: 'Closed Positions' },
              { id: 'ALL', label: 'Show All' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => setQuickFilter(preset.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
                  quickFilter === preset.id
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-[#161B26] text-[#8A93A6] border-[#262C3A] hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Main Terminal Table */}
        <div className="bg-[#121621] border border-[#1E232F] rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#161B26] border-b border-[#1E232F] text-[11px] font-semibold text-[#8A93A6] uppercase tracking-wider select-none">
                  
                  {/* Ticker */}
                  <th onClick={() => handleSort('securityId')} className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>Ticker</span>
                      {renderSortIcon('securityId')}
                    </div>
                  </th>

                  {/* Security Name */}
                  <th onClick={() => handleSort('securityName')} className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>Security Name</span>
                      {renderSortIcon('securityName')}
                    </div>
                  </th>

                  <th className="py-3.5 px-4">Asset-Class</th>

                  {/* Qty */}
                  <th onClick={() => handleSort('qty')} className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Qty</span>
                      {renderSortIcon('qty')}
                    </div>
                  </th>

                  {/* WAC */}
                  <th onClick={() => handleSort('wac')} className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>WAC (Avg)</span>
                      {renderSortIcon('wac')}
                    </div>
                  </th>

                  {/* EOD Price */}
                  <th onClick={() => handleSort('closePrice')} className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>EOD Price</span>
                      {renderSortIcon('closePrice')}
                    </div>
                  </th>

                  {/* Return % */}
                  <th onClick={() => handleSort('returnPct')} className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Return %</span>
                      {renderSortIcon('returnPct')}
                    </div>
                  </th>

                  {/* Realized P&L */}
                  <th onClick={() => handleSort('realized')} className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Realized P&L</span>
                      {renderSortIcon('realized')}
                    </div>
                  </th>

                  {/*  Unrealized P&L */}
                  <th onClick={() => handleSort('unrealized')} className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Unrealized P&L</span>
                      {renderSortIcon('unrealized')}
                    </div>
                  </th>

                  {/* Total P&L */}
                  <th onClick={() => handleSort('total')} className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Total P&L</span>
                      {renderSortIcon('total')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E232F] text-xs font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-[#8A93A6]">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-400" />
                      Fetching position snapshots for {valuationDate}...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[#5A6375]">
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
                        className={`hover:bg-[#1A202C] transition-colors ${
                          isBond ? 'bg-[#1C1812]/50' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-white tracking-wide">
                          {row.securityId}
                        </td>

                        <td className="py-3.5 px-4 text-[#C2C7D0] font-medium">
                          {row.securityName || row.securityId}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="relative group/tooltip inline-block">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-semibold rounded-md border ${
                              isBond 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                                : assetType === 'Equity'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            }`}>
                              {assetType}
                              {isBond && <Info className="h-3 w-3 text-amber-400 cursor-pointer" />}
                            </span>

                            {isBond && (row.faceValue || row.couponRate) && (
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block z-30 w-64 p-3 bg-[#1A202C] text-white rounded-xl shadow-2xl border border-[#2E3646] pointer-events-none">
                                <div className="text-[11px] font-bold text-amber-400 border-b border-[#2E3646] pb-1.5 mb-2 flex items-center justify-between">
                                  <span>{row.subCategory || 'Bond Specification'}</span>
                                  <span className="text-[9px] bg-amber-500/20 px-1.5 py-0.5 rounded">SECURITIES MASTER</span>
                                </div>
                                <div className="space-y-1.5 text-[11px]">
                                  {row.faceValue && (
                                    <div className="flex justify-between">
                                      <span className="text-[#8A93A6]">Face Value:</span>
                                      <span className="font-mono text-white">₹{row.faceValue?.toLocaleString('en-IN')}</span>
                                    </div>
                                  )}
                                  {row.couponRate && (
                                    <div className="flex justify-between">
                                      <span className="text-[#8A93A6]">Coupon Rate:</span>
                                      <span className="font-mono text-emerald-400">{row.couponRate}</span>
                                    </div>
                                  )}
                                  {row.maturityDate && (
                                    <div className="flex justify-between">
                                      <span className="text-[#8A93A6]">Maturity Date:</span>
                                      <span className="font-mono text-white">{row.maturityDate}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-medium text-white">
                          {row.qty.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-[#8A93A6]">
                          ₹{row.wac.toFixed(3)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-white font-medium">
                          ₹{row.closePrice.toFixed(3)}
                        </td>

                        <td className={`py-3.5 px-4 text-right font-mono font-medium ${
                          row.returnPct >= 0 ? 'text-[#00D09C]' : 'text-[#EB5757]'
                        }`}>
                          {row.returnPct >= 0 ? '+' : ''}{row.returnPct.toFixed(3)}%
                        </td>

                        {/* Realized PnL - Rupee with 3 Decimals */}
                        <td className={`py-3.5 px-4 text-right font-mono font-medium ${
                          row.realized >= 0 ? 'text-[#00D09C]' : 'text-[#EB5757]'
                        }`}>
                          {formatCurrency(row.realized)}
                        </td>

                        {/* Unrealized PnL - Rupee with 3 Decimals */}
                        <td className={`py-3.5 px-4 text-right font-mono font-medium ${
                          row.unrealized >= 0 ? 'text-[#00D09C]' : 'text-[#EB5757]'
                        }`}>
                          {formatCurrency(row.unrealized)}
                        </td>

                        {/* Net Total PnL - Rupee with 3 Decimals */}
                        <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                          row.total >= 0 ? 'text-[#00D09C]' : 'text-[#EB5757]'
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