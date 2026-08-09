import React from 'react';
import { ArrowLeftRight, Wallet, ShieldCheck } from 'lucide-react';
import tradelogo2 from '../assets/tradelogo2.png';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'blotter', label: 'Trade Blotter', icon: ArrowLeftRight },
    { id: 'pnl', label: 'P&L Console', icon: Wallet },
    { id: 'securities', label: 'Securities List', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-md border-b border-slate-200/60 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between bg-[#2E6199]">
        
        {/* Desk Brand Header */}
        <div className="flex items-center gap-3">
          <img 
            src={tradelogo2} 
            alt="Desk Logo" 
            className="h-9 w-auto object-contain rounded-lg" 
          />
          <div>
            <span className="font-extrabold text-base tracking-wider text-white block leading-tight font-sans">
              VANTAGE CAPITAL MARKETS
            </span>
            <span className="text-[9px] font-semibold text-white text-slate-600 uppercase tracking-widest block mt-0.5">
              Equities & Fixed Income Trading Desk
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-7 rounded-xl  backdrop-blur-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white/70 text-slate-600 border-slate-200/80 hover:text-slate-900 hover:bg-white hover:border-slate-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
}