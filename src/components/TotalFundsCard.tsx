import React, { useState } from 'react';
import { Save, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

interface TotalFundsCardProps {
  totalFunds: number;
  accountCount: number;
  lastHistoryDate?: string;
  onSaveEntry: () => void;
}

export const TotalFundsCard: React.FC<TotalFundsCardProps> = ({
  totalFunds,
  accountCount,
  lastHistoryDate,
  onSaveEntry,
}) => {
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  const handleSaveClick = () => {
    onSaveEntry();
    setIsSavedRecently(true);
    setTimeout(() => {
      setIsSavedRecently(false);
    }, 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-zinc-800 p-4 sm:p-5 shadow-xl backdrop-blur-xl">
      <div className="relative z-10 flex items-center justify-between gap-3">
        {/* Total Funds Display */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-[11px] uppercase tracking-wider font-bold text-emerald-400/90">
            <span className="p-1 rounded-md bg-emerald-500/15 text-emerald-400">
              <TrendingUp className="w-3 h-3" />
            </span>
            <span>Total Funds</span>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-emerald-400 font-mono drop-shadow-[0_0_12px_rgba(16,185,129,0.2)] flex items-baseline gap-2 overflow-x-auto scrollbar-none">
            <span className="whitespace-nowrap text-emerald-400">{formatCurrency(totalFunds)}</span>
          </div>
        </div>

        {/* Save Entry Action Button - Icon Only */}
        <button
          id="save-history-entry-btn"
          onClick={handleSaveClick}
          disabled={isSavedRecently}
          title={isSavedRecently ? 'Entry Saved!' : 'Save Entry'}
          className={`p-2.5 sm:p-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-md active:scale-95 cursor-pointer shrink-0 ${
            isSavedRecently
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-900/30'
              : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-blue-900/20'
          }`}
        >
          {isSavedRecently ? (
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          ) : (
            <Save className="w-5 h-5 stroke-[2.2]" />
          )}
        </button>
      </div>
    </div>
  );
};
