import PnLConsole from "./components/PnLConsole"
import TradeBlotter from "./components/TradeBlotter"
import Navbar from "./components/Navbar";
import SecuritiesView from "./components/SecuritiesView";
import React, {useState} from "react";

function App() {
//className="min-h-screen bg-slate-100/60 py-8"
const [activeTab, setActiveTab] = useState('blotter');
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Isolated Navbar Component */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* View Router */}
      <main className="transition-all duration-150">
        {activeTab === 'blotter' && <TradeBlotter />}
        {activeTab === 'pnl' && <PnLConsole />}
        {activeTab === 'securities' && <SecuritiesView />}
      </main>
    </div>
  )
}

export default App
