import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PnLEquityCurveChart({ data, valuationDate, activeAssetClass, activeSecurity }) {
  const normalizedData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      valuationDate: item.valuationDate || item.ValuationDate || '',
      netCombinedPnL: item.netCombinedPnL ?? item.NetCombinedPnL ?? 0,
      realizedPnL: item.realizedPnL ?? item.RealizedPnL ?? 0,
      unrealizedPnL: item.unrealizedPnL ?? item.UnrealizedPnL ?? 0,
    }));
  }, [data]);

  if (!normalizedData || normalizedData.length === 0) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-xl text-slate-400 text-center text-xs shadow-sm">
        No performance trajectory data available for current selection.
      </div>
    );
  }

  const latestNetPnL = normalizedData[normalizedData.length - 1]?.netCombinedPnL ?? 0;
  const isPositive = latestNetPnL >= 0;
  const totalDays = normalizedData.length;

  const chartData = {
    labels: normalizedData.map((d) =>
      d.valuationDate && d.valuationDate.length >= 10
        ? d.valuationDate.substring(5, 10) // '2026-02-15' -> '02-15'
        : d.valuationDate
    ),
    datasets: [
      {
        label: 'Net Combined P&L',
        data: normalizedData.map((d) => d.netCombinedPnL),
        borderColor: isPositive ? '#059669' : '#e11d48',
        backgroundColor: isPositive ? '#059669' : '#e11d48',
        borderWidth: 2.5,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
      {
        label: 'Realized P&L',
        data: normalizedData.map((d) => d.realizedPnL),
        borderColor: '#64748b',
        backgroundColor: '#64748b',
        borderWidth: 1.8,
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
      },
      {
        label: 'Unrealized P&L',
        data: normalizedData.map((d) => d.unrealizedPnL),
        borderColor: '#d97706',
        backgroundColor: '#d97706',
        borderWidth: 1.8,
        borderDash: [2, 2],
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
      },
    ],
  };

    const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#475569',
          font: { size: 12 },
          padding: 24, 
          
          // Custom label generator to enforce clean solid squares
          generateLabels: (chart) => {
            return chart.data.datasets.map((dataset, i) => ({
              text: dataset.label,
              fillStyle: dataset.borderColor,  
              strokeStyle: 'transparent',      
              lineWidth: 0,                   
              hidden: !chart.isDatasetVisible(i),
              datasetIndex: i,
            }));
          },
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#34d399',
        bodyColor: '#f8fafc',
        padding: 12,
        boxPadding: 4,
        callbacks: {
          title: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            return `Valuation Date: ${normalizedData[index]?.valuationDate || ''}`;
          },
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            const formattedVal = Number(value).toLocaleString('en-IN', {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            });
            return `${label}: ₹${formattedVal}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          maxRotation: 0,
          autoSkip: false,
          callback: function (value, index) {
            const label = this.getLabelForValue(value);
            if (totalDays <= 7) return label;
            if (index % 7 === 0 || index === totalDays - 1) return label;
            return '';
          },
        },
      },
      y: {
        grid: { color: '#e2e8f0', borderDash: [3, 3] },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          callback: (value) => `₹${(value / 1000).toFixed(0)}k`,
        },
      },
    },
  };

  return (
    <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Cumulative P&L Trajectory
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                isPositive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {isPositive ? '+' : ''}₹
              {latestNetPnL.toLocaleString('en-IN', {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
              })}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            History Range:{' '}
            <span className="text-slate-700 font-medium">Feb 02, 2026</span> →{' '}
            <span className="text-emerald-600 font-medium">{valuationDate}</span>
            {activeAssetClass && activeAssetClass !== 'ALL' && (
              <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold">
                Asset: {activeAssetClass}
              </span>
            )}
            {activeSecurity && (
              <span className="ml-2 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md font-semibold">
                Ticker: {activeSecurity}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="h-72 w-full pt-1">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}