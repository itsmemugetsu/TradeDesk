import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiConfig';

export default function ExportPnLButton({ valuationDate, pnlData }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Export Active Screen View (Current Date)
  const exportCurrentDateCSV = () => {
    if (!pnlData || pnlData.length === 0) {
      alert(`No P&L records found for ${valuationDate}`);
      return;
    }

    const headers = [
      'Valuation Date',
      'Ticker',
      'Security Name',
      'Asset Class',
      'Net Quantity',
      'WAC (Avg Cost)',
      'Close Price',
      'Realized PnL',
      'Unrealized PnL',
      'Total PnL'
    ];

    const rows = pnlData.map((item) => [
      `"${valuationDate}"`,
      `"${item.securityId}"`,
      `"${item.securityName || item.securityId}"`,
      `"${item.assetClass || ''}"`,
      item.netQuantity ?? item.qty ?? 0,
      Number(item.weightedAvgCost ?? item.wac ?? 0).toFixed(4),
      Number(item.closePrice ?? 0).toFixed(4),
      Number(item.cumulativeRealizedPnL ?? item.realizedPnL ?? 0).toFixed(4),
      Number(item.unrealizedPnL ?? 0).toFixed(4),
      Number(item.totalPnL ?? 0).toFixed(4)
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PnL_Snapshot_${valuationDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  // 2. Export Pre-Calculated Full History File (Static File)
  const exportFullHistoryCSV = () => {

    const serverOrigin = new URL(API_BASE_URL).origin;
    const csvFileUrl = `${serverOrigin}/exports/PnL_Snapshots_2Feb_31Mar.csv`;

    const link = document.createElement('a');
    link.href = csvFileUrl;
    link.setAttribute('download', 'PnL_Snapshots_2Feb_31Mar.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
      >
        <Download className="h-4 w-4" />
        <span>Export Reports</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 py-1 divide-y divide-gray-100">
          <button
            type="button"
            onClick={exportCurrentDateCSV}
            className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-start gap-2.5 cursor-pointer transition-colors"
          >
            <Calendar className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold block">Export Selected Date</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Current view for {valuationDate}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={exportFullHistoryCSV}
            className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-start gap-2.5 cursor-pointer transition-colors"
          >
            <FileText className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold block">Export Full Period History</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Complete dataset (2nd Feb – 31st Mar)
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}