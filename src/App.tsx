/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IrrigationProvider, useIrrigation } from './context/IrrigationContext';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { PlantSelectionView } from './components/PlantSelectionView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { DemoControlPanel } from './components/DemoControlPanel';
import { StopWateringModal } from './components/StopWateringModal';
import { ResetDemoModal } from './components/ResetDemoModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { ToastNotification } from './components/ToastNotification';
import { SetupWizard } from './components/SetupWizard';
import { Sliders } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    isLoggedIn,
    authLoading,
    currentTab,
    isDiagnosticsOpen,
    setIsDiagnosticsOpen,
    sensors,
    isSetupCompleted,
    isSetupWizardOpen,
  } = useIrrigation();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAF6] text-[#1A221E] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#E6EFE4] border border-[#CFDFCB] text-[#143826] flex items-center justify-center animate-pulse">
            <span className="text-xl">🌿</span>
          </div>
          <p className="text-xs font-mono text-[#667C6A] tracking-wider uppercase">
            Connecting to TerraFlux Controller...
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginView />;
  }

  // IF new user / first-time setup or setup wizard requested:
  if (!isSetupCompleted || isSetupWizardOpen) {
    return (
      <div className="min-h-screen bg-[#F8FAF6] text-[#1A221E] flex flex-col font-sans">
        <Navbar isSetupMode={true} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
          <SetupWizard />
        </main>
        <ToastNotification />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF6] text-[#1A221E] flex flex-col font-sans">
      {/* Top Bar adhering to the Top Bar Contract */}
      <Navbar />

      {/* Main View Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'dashboard' && <DashboardView />}
        {currentTab === 'plant' && <PlantSelectionView />}
        {currentTab === 'history' && <HistoryView />}
        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Floating Hardware Diagnostics Drawer Trigger */}
      {!isDiagnosticsOpen && (
        <button
          onClick={() => setIsDiagnosticsOpen(true)}
          className="fixed bottom-6 left-6 z-30 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F2F6F0] text-[#143826] border border-[#CFDFCB] shadow-lg text-xs font-mono font-medium transition-all hover:border-[#143826] cursor-pointer"
          title="Open Hardware Diagnostics & Sensor Calibration"
        >
          <Sliders className="h-4 w-4 text-[#143826]" />
          <span>Calibration & Diagnostics</span>
          {(sensors.lowFlowActive || sensors.noFlowActive || sensors.rainDetected) && (
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          )}
        </button>
      )}

      {/* Hardware Diagnostics Drawer */}
      <DemoControlPanel />

      {/* Modals & Toasts */}
      <ArchitectureModal />
      <StopWateringModal />
      <ResetDemoModal />
      <ToastNotification />
    </div>
  );
};

export default function App() {
  return (
    <IrrigationProvider>
      <AppContent />
    </IrrigationProvider>
  );
}
