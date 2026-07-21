import React from 'react';
import { Calendar } from 'lucide-react';

interface HeaderProps {
  totalAccounts: number;
  lastSavedDate?: string;
  onInstallClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ totalAccounts }) => {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'short' });
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  return (
    <header className="sticky top-0 z-30 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/50 px-4 py-2 sm:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-2.5">
          <div className="relative flex items-center">
            <img
              src="/logo.png"
              alt="Fund View Logo"
              className="w-7 h-7 rounded-lg object-cover border border-zinc-700/60 shadow-md"
              onError={(e) => {
                // Fallback to text box if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#09090b] animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-zinc-100">
              Fund View
            </h1>
          </div>
        </div>

        {/* Day & Date at Top Right */}
        <div className="flex items-center space-x-1.5 text-xs text-zinc-400 font-mono bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-zinc-800/80 shadow-inner">
          <Calendar className="w-3.5 h-3.5 text-blue-400 stroke-[2]" />
          <span>
            <strong className="text-zinc-200 font-medium">{dayName}</strong>, {formattedDate}
          </span>
        </div>
      </div>
    </header>
  );
};


