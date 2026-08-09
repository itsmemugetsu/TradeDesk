import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, ShieldCheck, ArrowUpRight, ArrowDownRight, RotateCcw, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { fetchSecuritiesSummary } from '../services/securitiesservice';

const MIN_DATE = '2026-02-02';
const MAX_DATE = '2026-03-31';


const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
};

export default function SecuritiesView() {
  const [activityDate, setActivityDate] = useState('2026-03-31');
  const [securities, setSecurities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetClass, setSelectedAssetClass] = useState('ALL');

  // Load securities with race-condition prevention using AbortController
  const loadSecurities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchSecuritiesSummary(activityDate);
      setSecurities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch asset liquidity summary.');
      setSecurities([]);
    } finally {
      setLoading(false);
    }
  }, [activityDate]);

  useEffect(() => {
    loadSecurities();
  }, [loadSecurities]);

 
  const filteredSecurities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return securities.filter((sec) => {
      const matchesSearch =
        !query ||
        sec.securityId?.toLowerCase().includes(query) ||
        sec.securityName?.toLowerCase().includes(query) ||
        sec.category?.toLowerCase().includes(query);

      const matchesAsset =
        selectedAssetClass === 'ALL' ||
        sec.assetClass?.toLowerCase() === selectedAssetClass.toLowerCase();

      return matchesSearch && matchesAsset;
    });
  }, [securities, searchQuery, selectedAssetClass]);

  // Total Desk stats
 const stats = useMemo(() => {
  return filteredSecurities.reduce(
    (acc, sec) => {
      const buys = Number(sec.buyCount) || 0;
      const sells = Number(sec.sellCount) || 0;
      const buyVol = Number(sec.totalBuyVolume) || 0;
      const sellVol = Number(sec.totalSellVolume) || 0;

      acc.totalTrades += Number(sec.totalTrades) || (buys + sells);
      acc.totalVolume += (buyVol + sellVol);
      return acc;
    },
    { totalTrades: 0, totalVolume: 0 }
  );
}, [filteredSecurities]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 shadow-xs">
            <ShieldCheck className="h-6 w-6 text-emerald-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Asset Liquidity & Desk Summary
            </h1>
            <p className="text-sm text-slate-500">
              Cumulative asset trades and turnover of{' '}
              <span className="font-mono font-semibold text-slate-700">{activityDate}</span>
            </p>
          </div>
        </div>

        {/* Date Selector &  Refresh */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs">
          <div className="flex items-center gap-2 px-3 text-slate-600 text-xs font-semibold">
            <Calendar className="h-4 w-4 text-emerald-800" />
            <span>As-Of Date</span>
          </div>
          <input
            type="date"
            min={MIN_DATE}
            max={MAX_DATE}
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-800 cursor-pointer"
          />
          <button
            onClick={loadSecurities}
            disabled={loading}
            title="Refresh Summary"
            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-900' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Desk Securities
          </span>
          <span className="text-2xl font-mono font-extrabold text-slate-900 mt-1 block">
            {filteredSecurities.length} Assets
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Cumulative Executions (As-Of {activityDate})
          </span>
          <span className="text-2xl font-mono font-extrabold text-emerald-950 mt-1 block">
            {stats.totalTrades.toLocaleString()} Trades
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Cumulative Traded Volume (As-Of {activityDate})
          </span>
          <span className="text-2xl font-mono font-extrabold text-slate-900 mt-1 block">
            {stats.totalVolume.toLocaleString()} Units
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search ticker, security name, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-slate-50 border border-slate-300 rounded-md text-xs pl-9 pr-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          />
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
          {['ALL', 'Equity', 'Bond', 'ETF'].map((asset) => (
            <button
              key={asset}
              onClick={() => setSelectedAssetClass(asset)}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                selectedAssetClass === asset
                  ? 'bg-white text-emerald-950 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {asset === 'ALL' ? 'All Assets' : asset}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Ticker</th>
                <th className="py-3.5 px-4">Security Name</th>
                <th className="py-3.5 px-4">Asset Class</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Start Price</th>
                <th className="py-3.5 px-4 text-center">Trades </th>
                <th className="py-3.5 px-4 text-right">Traded Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-800" />
                    Calculating asset liquidity metrics...
                  </td>
                </tr>
              ) : filteredSecurities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    No securities match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredSecurities.map((sec) => {
                  const isBond = sec.assetClass === 'Bond';
                  const buys = Number(sec.buyCount) || 0;
                  const sells = Number(sec.sellCount) || 0;
                  const totalSecTrades = Number(sec.totalTrades) || (buys + sells);
                  const totalVolume = (Number(sec.totalBuyVolume) || 0) + (Number(sec.totalSellVolume) || 0);

                  return (
                    <tr key={sec.securityId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Security ID */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                        {sec.securityId}
                      </td>

                      {/* Name & Fixed Income */}
                      <td className="py-3.5 px-4">
                        <div className="text-[14px] font-bold text-slate-800">{sec.securityName}</div>
                        {isBond && sec.couponRatePct && (
                          <div className="text-[12px] text-amber-600 font-semibold mt-0.5">
                            Coupon: {sec.couponRatePct} | Mat: {formatDate(sec.maturityDate)} | Face: ₹{sec.faceValue}
                          </div>
                        )}
                      </td>

                      {/* Asset Class Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-[12px] font-bold rounded-md border ${
                            sec.assetClass === 'Bond'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : sec.assetClass === 'Equity'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {sec.assetClass}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-[13px] font-medium text-slate-600">
                        {sec.category}
                      </td>

                      {/* Start Price */}
                      <td className="py-3.5 px-4 text-[13px] text-center font-mono font-bold text-slate-900">
                        ₹{Number(sec.startPrice || 0).toFixed(3)}
                      </td>

                      {/* Buy / Sell Breakdown Badges */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="flex items-center text-emerald-700 font-mono font-bold text-[13px]">
                            <ArrowUpRight className="h-3 w-3 mr-0.5" /> {buys}
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="flex items-center text-rose-700 font-mono font-bold text-[13px]">
                            <ArrowDownRight className="h-3 w-3 mr-0.5" /> {sells}
                          </span>
                          <span className="text-slate-400 text-[12px] font-semibold ml-1">
                            ({totalSecTrades})
                          </span>
                        </div>
                      </td>

                      {/* Traded Volume */}
                      <td className="py-3.5 px-4 text-[13px] text-right font-mono font-bold text-slate-800">
                        {totalVolume.toLocaleString()} Units
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
  );
}