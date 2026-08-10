import PnLConsole from "./components/PnLConsole";
import TradeBlotter from "./components/TradeBlotter";
import Navbar from "./components/Navbar";
import SecuritiesView from "./components/SecuritiesView";
import React, { useState } from "react";

function App() {
  const [activeTab, setActiveTab] = useState('blotter');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="transition-all duration-150">
        <div className={activeTab === 'blotter' ? 'block' : 'hidden'}>
          <TradeBlotter isActive={activeTab === 'blotter'} />
        </div>

        <div className={activeTab === 'pnl' ? 'block' : 'hidden'}>
          <PnLConsole isActive={activeTab === 'pnl'} />
        </div>

        <div className={activeTab === 'securities' ? 'block' : 'hidden'}>
          <SecuritiesView isActive={activeTab === 'securities'} />
        </div>
      </main>
    </div>
  );
}

export default App;