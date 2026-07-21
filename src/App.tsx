import React, { useState, useEffect, useMemo } from 'react';
import {
  getStoredAccounts,
  saveStoredAccounts,
  getStoredHistory,
  saveStoredHistory,
  clearAllAppData,
} from './utils/storage';
import { exportHistoryToExcel } from './utils/excelExport';
import { Account, HistoryEntry, TabType, ToastMessage } from './types';
import { Header } from './components/Header';
import { TotalFundsCard } from './components/TotalFundsCard';
import { AccountRow } from './components/AccountRow';
import { AddAccountModal } from './components/AddAccountModal';
import { HistoryTable } from './components/HistoryTable';
import { ClearConfirmModal } from './components/ClearConfirmModal';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { PWAInstallModal } from './components/PWAInstallModal';
import { Plus, WalletCards, Sparkles } from 'lucide-react';

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('accounts');

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isPWAInstallOpen, setIsPWAInstallOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Initialize data from LocalStorage & register Service Worker
  useEffect(() => {
    const loadedAccounts = getStoredAccounts();
    const loadedHistory = getStoredHistory();
    setAccounts(loadedAccounts);
    setHistory(loadedHistory);

    // Register Service Worker for Progressive Web App capabilities
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('PWA ServiceWorker registered with scope:', registration.scope);
          },
          (err) => {
            console.warn('PWA ServiceWorker registration failed:', err);
          }
        );
      });
    }
  }, []);

  // Calculate total funds dynamically
  const totalFunds = useMemo(() => {
    return accounts.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
  }, [accounts]);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({
      id: Date.now().toString(),
      text,
      type,
    });
  };

  // Helper to check if two dates fall on the same local calendar day
  const isSameDay = (d1Str: string | number, d2Date: Date) => {
    if (!d1Str) return false;
    const d1 = new Date(d1Str);
    return (
      d1.getFullYear() === d2Date.getFullYear() &&
      d1.getMonth() === d2Date.getMonth() &&
      d1.getDate() === d2Date.getDate()
    );
  };

  // Helper to update today's existing history entry if one already exists
  const updateTodayHistoryIfExists = (updatedAccounts: Account[], currentHistory: HistoryEntry[]) => {
    const now = new Date();
    const existingIndex = currentHistory.findIndex((h) => isSameDay(h.date || h.timestamp, now));

    if (existingIndex !== -1) {
      const balancesMap: Record<string, number> = {};
      const namesMap: Record<string, string> = {};
      let total = 0;

      updatedAccounts.forEach((acc) => {
        balancesMap[acc.id] = acc.balance;
        namesMap[acc.id] = acc.name;
        total += Number(acc.balance) || 0;
      });

      const updatedHistory = [...currentHistory];
      updatedHistory[existingIndex] = {
        ...updatedHistory[existingIndex],
        date: now.toISOString(),
        timestamp: now.getTime(),
        balances: balancesMap,
        accountNames: namesMap,
        total,
      };
      setHistory(updatedHistory);
      saveStoredHistory(updatedHistory);
    }
  };

  // 1. Update balance of an existing account
  const handleUpdateAccountBalance = (id: string, newBalance: number) => {
    const updated = accounts.map((acc) =>
      acc.id === id
        ? { ...acc, balance: newBalance, updatedAt: new Date().toISOString() }
        : acc
    );
    setAccounts(updated);
    saveStoredAccounts(updated);
    updateTodayHistoryIfExists(updated, history);
  };

  // 2. Update name of an existing account
  const handleUpdateAccountName = (id: string, newName: string) => {
    const updated = accounts.map((acc) =>
      acc.id === id
        ? { ...acc, name: newName, updatedAt: new Date().toISOString() }
        : acc
    );
    setAccounts(updated);
    saveStoredAccounts(updated);
    updateTodayHistoryIfExists(updated, history);
    showToast(`Account renamed to "${newName}"`, 'info');
  };

  // 3. Add a new account
  const handleAddAccount = (data: {
    name: string;
    balance: number;
    category: string;
    color: string;
  }) => {
    const newAccount: Account = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: data.name,
      balance: data.balance,
      category: data.category,
      color: data.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...accounts, newAccount];
    setAccounts(updated);
    saveStoredAccounts(updated);
    updateTodayHistoryIfExists(updated, history);
    showToast(`Added account "${data.name}"`, 'success');
  };

  // 4. Delete an account
  const handleDeleteAccount = (id: string) => {
    const accToDelete = accounts.find((a) => a.id === id);
    const confirmMessage = accToDelete
      ? `Are you sure you want to delete "${accToDelete.name}"?`
      : 'Delete this account?';

    if (window.confirm(confirmMessage)) {
      const updated = accounts.filter((acc) => acc.id !== id);
      setAccounts(updated);
      saveStoredAccounts(updated);
      updateTodayHistoryIfExists(updated, history);
      showToast('Account deleted', 'warning');
    }
  };

  // Drag & Drop Account Reordering State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    // leave handled
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...accounts];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, movedItem);

    setAccounts(updated);
    saveStoredAccounts(updated);
    updateTodayHistoryIfExists(updated, history);

    setDraggedIndex(null);
    setDragOverIndex(null);
    showToast(`Arranged "${movedItem.name}"`, 'info');
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveAccount = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= accounts.length) return;
    const updated = [...accounts];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);

    setAccounts(updated);
    saveStoredAccounts(updated);
    updateTodayHistoryIfExists(updated, history);
  };

  // Mobile Touch Reordering Support
  const [touchStartIndex, setTouchStartIndex] = useState<number | null>(null);

  const handleTouchStartDrag = (e: React.TouchEvent<HTMLDivElement>, index: number) => {
    setTouchStartIndex(index);
    setDraggedIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartIndex === null) return;
    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetEl) return;
    const cardEl = targetEl.closest('[data-account-index]');
    if (cardEl) {
      const idxStr = cardEl.getAttribute('data-account-index');
      if (idxStr !== null) {
        const hoverIdx = parseInt(idxStr, 10);
        if (!isNaN(hoverIdx) && hoverIdx !== dragOverIndex) {
          setDragOverIndex(hoverIdx);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchStartIndex !== null && dragOverIndex !== null && touchStartIndex !== dragOverIndex) {
      handleMoveAccount(touchStartIndex, dragOverIndex);
    }
    setTouchStartIndex(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 5. Save Entry (Snapshot today's balances into History)
  const handleSaveEntry = () => {
    if (accounts.length === 0) {
      showToast('Please add at least one account first.', 'warning');
      return;
    }

    const now = new Date();
    const existingIndex = history.findIndex((h) => isSameDay(h.date || h.timestamp, now));

    const balancesMap: Record<string, number> = {};
    const namesMap: Record<string, string> = {};

    accounts.forEach((acc) => {
      balancesMap[acc.id] = acc.balance;
      namesMap[acc.id] = acc.name;
    });

    if (existingIndex !== -1) {
      // Update existing entry for today instead of adding a new row
      const updatedHistory = [...history];
      updatedHistory[existingIndex] = {
        ...updatedHistory[existingIndex],
        date: now.toISOString(),
        timestamp: now.getTime(),
        balances: balancesMap,
        accountNames: namesMap,
        total: totalFunds,
      };
      setHistory(updatedHistory);
      saveStoredHistory(updatedHistory);
      showToast("Today's snapshot updated!", 'info');
    } else {
      // Create a single new entry for today
      const maxSerial = history.reduce((max, h) => Math.max(max, h.serialNo || 0), 0);

      const newEntry: HistoryEntry = {
        id: `hist_${Date.now()}`,
        serialNo: maxSerial + 1,
        date: now.toISOString(),
        timestamp: now.getTime(),
        balances: balancesMap,
        accountNames: namesMap,
        total: totalFunds,
      };

      const updatedHistory = [newEntry, ...history];
      setHistory(updatedHistory);
      saveStoredHistory(updatedHistory);
      showToast('Snapshot saved to History!', 'success');
    }
  };

  // 6. Export History to Excel
  const handleExportExcel = () => {
    exportHistoryToExcel(history, accounts);
    showToast('Exported history as Excel spreadsheet', 'success');
  };

  // 7. Clear All Data
  const handleClearAllData = () => {
    clearAllAppData();
    setAccounts([]);
    setHistory([]);
    showToast('All accounts and history cleared', 'warning');
  };

  // 8. Delete a single history entry
  const handleDeleteHistoryEntry = (id: string) => {
    const updatedHistory = history.filter((h) => h.id !== id);
    setHistory(updatedHistory);
    saveStoredHistory(updatedHistory);
    showToast('History entry deleted', 'info');
  };

  const lastHistoryDate = history.length > 0 ? history[0].date : undefined;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-blue-500 selection:text-white pb-28">
      {/* Top Header */}
      <Header
        totalAccounts={accounts.length}
        lastSavedDate={lastHistoryDate}
        onInstallClick={() => setIsPWAInstallOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-6 space-y-5 sm:space-y-6">
        {/* Tab 1: Accounts View */}
        {activeTab === 'accounts' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Total Funds Hero Card */}
            <TotalFundsCard
              totalFunds={totalFunds}
              accountCount={accounts.length}
              lastHistoryDate={lastHistoryDate}
              onSaveEntry={handleSaveEntry}
            />

            {/* Accounts List Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <WalletCards className="w-4 h-4 text-blue-400" />
                  <h2 className="text-base font-bold text-zinc-200">Your Accounts</h2>
                  <span className="text-xs text-zinc-500 font-mono">
                    ({accounts.length})
                  </span>
                </div>
                <button
                  id="add-account-header-btn"
                  onClick={() => setIsAddAccountOpen(true)}
                  className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800 hover:border-blue-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>New Account</span>
                </button>
              </div>

              {accounts.length === 0 ? (
                <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
                    <WalletCards className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">No Accounts Found</h3>
                  <button
                    onClick={() => setIsAddAccountOpen(true)}
                    className="px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Create First Account</span>
                  </button>
                </div>
              ) : (
                <div
                  className="space-y-3"
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {accounts.map((account, idx) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      index={idx}
                      totalAccounts={accounts.length}
                      onUpdateBalance={handleUpdateAccountBalance}
                      onUpdateName={handleUpdateAccountName}
                      onDeleteAccount={handleDeleteAccount}
                      onMoveAccount={handleMoveAccount}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedIndex === idx}
                      isDragOver={dragOverIndex === idx && draggedIndex !== idx}
                      onTouchStartDrag={handleTouchStartDrag}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: History View */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span>Fund Log History</span>
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </h2>
              </div>
            </div>

            <HistoryTable
              history={history}
              currentAccounts={accounts}
              onExportExcel={handleExportExcel}
              onClearAllClick={() => setIsClearModalOpen(true)}
              onDeleteHistoryEntry={handleDeleteHistoryEntry}
            />
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accountsCount={accounts.length}
        historyCount={history.length}
      />

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onAddAccount={handleAddAccount}
      />

      {/* Clear Confirmation Modal */}
      <ClearConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirmClear={handleClearAllData}
      />

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={isPWAInstallOpen}
        onClose={() => setIsPWAInstallOpen(false)}
      />

      {/* Toast Messages */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
