import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Trash2,
  Download,
  AlertTriangle,
  Search,
  History,
  Calendar,
  Sparkles,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Account, HistoryEntry } from '../types';
import { formatCurrency, formatDate, formatShortDate } from '../utils/formatters';

interface HistoryTableProps {
  history: HistoryEntry[];
  currentAccounts: Account[];
  onExportExcel: () => void;
  onClearAllClick: () => void;
  onDeleteHistoryEntry: (id: string) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  history,
  currentAccounts,
  onExportExcel,
  onClearAllClick,
  onDeleteHistoryEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(false); // Default newest first

  // 1. Gather all unique account IDs across history and current accounts
  const accountIdSet = new Set<string>();
  const accountNameMap: Record<string, string> = {};

  // Preserve current account order
  currentAccounts.forEach((acc) => {
    accountIdSet.add(acc.id);
    accountNameMap[acc.id] = acc.name;
  });

  // Add historical account IDs
  history.forEach((entry) => {
    Object.keys(entry.balances || {}).forEach((accId) => {
      accountIdSet.add(accId);
      if (!accountNameMap[accId] && entry.accountNames?.[accId]) {
        accountNameMap[accId] = entry.accountNames[accId];
      }
    });
  });

  const orderedAccountIds = Array.from(accountIdSet);

  // Filter & Sort history entries
  const filteredHistory = history
    .filter((entry) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const dateStr = formatDate(entry.date || entry.timestamp).toLowerCase();
      const serialStr = String(entry.serialNo || '');
      const totalStr = String(entry.total || '');
      return dateStr.includes(term) || serialStr.includes(term) || totalStr.includes(term);
    })
    .sort((a, b) => {
      const timeA = a.timestamp || new Date(a.date).getTime() || 0;
      const timeB = b.timestamp || new Date(b.date).getTime() || 0;
      return sortAsc ? timeA - timeB : timeB - timeA;
    });

  return (
    <div className="space-y-5">
      {/* Action Bar & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/50 border border-zinc-800 p-3.5 sm:p-4 rounded-2xl backdrop-blur-md">
        {/* Search Input */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search date or amount..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-xs text-white focus:outline-none transition-colors font-mono min-h-[40px]"
          />
        </div>

        {/* Sorting & Action Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl flex items-center space-x-1.5 border border-zinc-700/60 transition-colors cursor-pointer min-h-[40px] whitespace-nowrap"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <span>{sortAsc ? 'Oldest' : 'Newest'}</span>
          </button>

          {/* Export to Excel Button */}
          <button
            id="export-excel-btn"
            onClick={onExportExcel}
            disabled={history.length === 0}
            className={`px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center space-x-2 transition-all active:scale-95 cursor-pointer min-h-[40px] whitespace-nowrap ${
              history.length === 0
                ? 'bg-zinc-800 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/80 shadow-md'
            }`}
          >
            <Download className="w-4 h-4 stroke-[2.2]" />
            <span>Export .XLSX</span>
          </button>

          {/* Clear All Data Button */}
          <button
            id="clear-all-btn"
            onClick={onClearAllClick}
            className="px-3.5 py-2.5 bg-red-950/30 hover:bg-red-900/40 text-red-500 border border-red-900/50 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer min-h-[40px] whitespace-nowrap"
            title="Clear all accounts and history"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      {filteredHistory.length === 0 ? (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No History Records Found</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {searchTerm
              ? 'No history entry matches your search terms.'
              : "Switch to the Accounts tab and click 'Save Entry Now' to log a snapshot of your current fund balances."}
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse font-mono text-xs">
              {/* Spreadsheet Table Header */}
              <thead>
                <tr className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 font-bold uppercase tracking-widest text-[10px]">
                  <th className="py-4 px-6 font-mono text-center w-16 border-r border-zinc-800/60 text-purple-400">
                    S.No
                  </th>
                  <th className="py-4 px-6 min-w-[160px] border-r border-zinc-800/60 text-sky-400">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>Date & Time</span>
                    </div>
                  </th>

                  {/* Dynamic Account Columns */}
                  {orderedAccountIds.map((accId) => (
                    <th
                      key={accId}
                      className="py-4 px-6 min-w-[130px] text-right font-semibold text-zinc-300 border-r border-zinc-800/60 bg-zinc-900/40"
                    >
                      <span className="truncate block max-w-[140px]">
                        {accountNameMap[accId] || 'Account'}
                      </span>
                    </th>
                  ))}

                  {/* Total Funds Column */}
                  <th className="py-4 px-6 min-w-[140px] text-right font-extrabold text-emerald-400 border-r border-zinc-800/60 bg-emerald-950/25">
                    Total Funds
                  </th>

                  {/* Action Column */}
                  <th className="py-4 px-3 text-center w-12 text-zinc-500">Action</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-zinc-800/50 text-zinc-200">
                {filteredHistory.map((entry, idx) => {
                  const displaySNo = entry.serialNo || idx + 1;
                  const dateFormatted = formatDate(entry.date || entry.timestamp);

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      {/* S.No */}
                      <td className="py-3.5 px-6 text-center font-bold text-zinc-500 border-r border-zinc-800/60">
                        {String(displaySNo).padStart(2, '0')}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-6 font-sans font-medium text-zinc-300 border-r border-zinc-800/60 whitespace-nowrap">
                        {dateFormatted}
                      </td>

                      {/* Account Dynamic Balances */}
                      {orderedAccountIds.map((accId) => {
                        const bal = entry.balances?.[accId];
                        return (
                          <td
                            key={accId}
                            className="py-3.5 px-6 text-right border-r border-zinc-800/60 text-zinc-300 font-semibold"
                          >
                            {bal !== undefined && bal !== null ? (
                              <span className="text-zinc-100">
                                {formatCurrency(bal)}
                              </span>
                            ) : (
                              <span className="text-zinc-600 font-normal text-[11px]">
                                -
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Funds Snapshot */}
                      <td className="py-3.5 px-6 text-right font-extrabold text-emerald-400 bg-emerald-500/10 border-r border-zinc-800/60 whitespace-nowrap">
                        {formatCurrency(entry.total || 0)}
                      </td>

                      {/* Delete Entry Row Action */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => onDeleteHistoryEntry(entry.id)}
                          className="p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete this history entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
};
