import React from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import { Sliders, Sprout, Activity, History, Settings, LogOut, User, Cpu } from 'lucide-react';

export const Navbar: React.FC<{ isSetupMode?: boolean }> = ({ isSetupMode = false }) => {
  const {
    currentTab,
    setCurrentTab,
    isDiagnosticsOpen,
    setIsDiagnosticsOpen,
    logout,
    currentUser,
    isDemoMode,
    sensors,
    isSetupCompleted,
    setIsSetupWizardOpen,
  } = useIrrigation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D1E0CE] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isSetupMode && isSetupCompleted) {
                setIsSetupWizardOpen(false);
              }
              setCurrentTab('dashboard');
            }}
            className="group flex items-center gap-2 text-left focus-visible:outline-none cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E6EFE4] border border-[#CFDFCB] text-[#143826] group-hover:border-[#143826] transition-colors">
              <Sprout className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#143826] font-display">
              TERRAFLUX
            </span>
          </button>

          {/* Node Connection & Cloud Status Badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide bg-[#E6EFE4] text-[#143826] border border-[#CFDFCB]">
            <span className={`h-1.5 w-1.5 rounded-full ${isDemoMode ? 'bg-amber-500' : 'bg-emerald-600'} animate-pulse`} />
            {isDemoMode ? 'DEMO SIMULATION' : 'CLOUD SYNC'}
          </span>

          {isSetupMode && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#143826] text-white">
              INITIAL SETUP
            </span>
          )}
        </div>

        {/* Zone 2: Navigation Links (hidden in setup mode unless already completed) */}
        {!isSetupMode ? (
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-[#143826] text-white font-semibold shadow-xs'
                  : 'text-[#4A5D4E] hover:text-[#143826] hover:bg-[#F2F6F0]'
              }`}
            >
              <Activity className="h-4 w-4" />
              Dashboard
            </button>

            <button
              onClick={() => setCurrentTab('plant')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'plant'
                  ? 'bg-[#143826] text-white font-semibold shadow-xs'
                  : 'text-[#4A5D4E] hover:text-[#143826] hover:bg-[#F2F6F0]'
              }`}
            >
              <Sprout className="h-4 w-4" />
              Plant Selection
            </button>

            <button
              onClick={() => setCurrentTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'history'
                  ? 'bg-[#143826] text-white font-semibold shadow-xs'
                  : 'text-[#4A5D4E] hover:text-[#143826] hover:bg-[#F2F6F0]'
              }`}
            >
              <History className="h-4 w-4" />
              Irrigation History
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'settings'
                  ? 'bg-[#143826] text-white font-semibold shadow-xs'
                  : 'text-[#4A5D4E] hover:text-[#143826] hover:bg-[#F2F6F0]'
              }`}
            >
              <Settings className="h-4 w-4" />
              System Settings
            </button>
          </nav>
        ) : isSetupCompleted ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSetupWizardOpen(false)}
              className="text-xs font-semibold text-[#143826] hover:underline px-3 py-1 rounded-xl bg-[#E6EFE4] border border-[#CFDFCB] cursor-pointer"
            >
              ← Back to Dashboard
            </button>
          </div>
        ) : null}

        {/* Zone 3: Actions & Diagnostics */}
        <div className="flex items-center gap-2.5">
          {/* Hardware Diagnostics & Calibration Drawer Toggle */}
          <button
            onClick={() => setIsDiagnosticsOpen(!isDiagnosticsOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
              isDiagnosticsOpen
                ? 'bg-[#143826] text-white border-[#143826] font-semibold shadow-xs'
                : 'bg-white hover:bg-[#F2F6F0] text-[#143826] border-[#CFDFCB]'
            }`}
            title="Open Hardware Diagnostics & Calibration"
          >
            <Sliders className="h-3.5 w-3.5 text-[#143826]" />
            <span className="hidden sm:inline">Diagnostics</span>
            {(sensors.lowFlowActive || sensors.noFlowActive || sensors.rainDetected) && (
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>

          {/* Download ZIP button */}
          <a
            href="/nurtura-smart-irrigation.zip"
            download="nurtura-smart-irrigation.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#E6EFE4] hover:bg-[#D7E6D3] text-[#143826] border border-[#CFDFCB] transition-all cursor-pointer shadow-xs"
            title="Download complete website source code (.zip)"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="hidden md:inline">Download ZIP</span>
          </a>

          {/* User Profile Pill */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#F8FAF6] border border-[#CFDFCB] text-xs font-medium text-[#334237]">
            <User className="h-3.5 w-3.5 text-[#143826]" />
            <span>{currentUser?.name || 'Local Admin'}</span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 text-[#667C6A] hover:text-rose-600 hover:bg-[#F2F6F0] rounded-xl transition-colors cursor-pointer"
            title="Sign out of local session"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
