import PnLConsole from "./components/PnLConsole";
import TradeBlotter from "./components/TradeBlotter";
import Navbar from "./components/Navbar";
import SecuritiesView from "./components/SecuritiesView";
import NotFound from "./components/NotFound";
import React, { useState , useEffect} from "react";

const VALID_TABS = ['blotter', 'pnl', 'securities'];

function App() {
  // Read path from URL on initial load
  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname.replace('/', '').toLowerCase();
    if (!path || path === '') return 'blotter';
    return VALID_TABS.includes(path) ? path : 'not-found';
  });

  // Wrapper function to update state AND browser URL bar when a tab is clicked
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (VALID_TABS.includes(newTab)) {
      window.history.pushState({}, '', `/${newTab}`);
    }
  };

  // navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '').toLowerCase();
      if (!path || path === '') {
        setActiveTab('blotter');
      } else if (VALID_TABS.includes(path)) {
        setActiveTab(path);
      } else {
        setActiveTab('not-found');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isNotFound = !VALID_TABS.includes(activeTab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
     
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />

      <main className="transition-all duration-150">
        {isNotFound ? (
          <NotFound />
        ) : (
          <>
            <div className={activeTab === 'blotter' ? 'block' : 'hidden'}>
              <TradeBlotter isActive={activeTab === 'blotter'} />
            </div>

            <div className={activeTab === 'pnl' ? 'block' : 'hidden'}>
              <PnLConsole isActive={activeTab === 'pnl'} />
            </div>

            <div className={activeTab === 'securities' ? 'block' : 'hidden'}>
              <SecuritiesView isActive={activeTab === 'securities'} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;