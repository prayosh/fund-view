import React from 'react';
import { WalletCards, History, Download, Smartphone } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  accountsCount: number;
  historyCount: number;
  onInstallClick?: () => void;
  isInstalled?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  accountsCount,
  historyCount,
  onInstallClick,
  isInstalled,
}) => {
  return (
    <>
      {/* Bottom Sticky Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#09090b]/95 backdrop-blur-xl border-t border-zinc-800 px-3 py-1 sm:py-1.5">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {/* Tab 1: Accounts */}
          <button
            id="tab-accounts-btn"
            onClick={() => onTabChange('accounts')}
            className={`relative flex flex-col items-center justify-center min-w-[85px] py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === 'accounts'
                ? 'text-blue-500 font-bold bg-blue-500/10 border border-blue-500/20'
                : 'text-zinc-500 hover:text-zinc-300 font-medium'
            }`}
          >
            <div className="relative">
              <WalletCards className={`w-4 h-4 ${activeTab === 'accounts' ? 'stroke-[2.5]' : ''}`} />
              <span className="absolute -top-1 -right-2.5 px-1 py-0 text-[9px] font-mono font-bold bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700">
                {accountsCount}
              </span>
            </div>
            <span className="text-[11px] mt-0.5">Accounts</span>
          </button>

          {/* Tab 2: History */}
          <button
            id="tab-history-btn"
            onClick={() => onTabChange('history')}
            className={`relative flex flex-col items-center justify-center min-w-[85px] py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === 'history'
                ? 'text-blue-500 font-bold bg-blue-500/10 border border-blue-500/20'
                : 'text-zinc-500 hover:text-zinc-300 font-medium'
            }`}
          >
            <div className="relative">
              <History className={`w-4 h-4 ${activeTab === 'history' ? 'stroke-[2.5]' : ''}`} />
              <span className="absolute -top-1 -right-2.5 px-1 py-0 text-[9px] font-mono font-bold bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700">
                {historyCount}
              </span>
            </div>
            <span className="text-[11px] mt-0.5">History</span>
          </button>

          {/* Tab 3: Install App */}
          {onInstallClick && (
            <button
              id="tab-install-btn"
              onClick={onInstallClick}
              className={`relative flex flex-col items-center justify-center min-w-[85px] py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer text-zinc-500 hover:text-blue-400 font-medium`}
            >
              <div className="relative">
                {isInstalled ? (
                  <Smartphone className="w-4 h-4 text-emerald-400 stroke-[2]" />
                ) : (
                  <Download className="w-4 h-4 text-blue-400 stroke-[2.2]" />
                )}
              </div>
              <span className={`text-[11px] mt-0.5 ${isInstalled ? 'text-emerald-400' : 'text-blue-400 font-semibold'}`}>
                {isInstalled ? 'App' : 'Install'}
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

