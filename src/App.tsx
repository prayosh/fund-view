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
import { PWAInstallModal, BeforeInstallPromptEvent } from './components/PWAInstallModal';
import { Plus, WalletCards, Sparkles, Landmark, Wallet, CreditCard, Coins } from 'lucide-react';
import { formatCurrency } from './utils/formatters';

const CATEGORY_ORDER = ['Bank', 'Cash', 'Wallet', 'Credit Card', 'Investment'];

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }>; color: string }
> = {
  Bank: { label: 'Bank Accounts', icon: Landmark, color: '#3b82f6' },
  Cash: { label: 'Cash in Hand', icon: Wallet, color: '#10b981' },
  Wallet: { label: 'UPI / Wallets', icon: CreditCard, color: '#8b5cf6' },
  'Credit Card': { label: 'Credit Cards', icon: CreditCard, color: '#f43f5e' },
  Investment: { label: 'Investment', icon: Coins, color: '#f59e0b' },
  Other: { label: 'Other Accounts', icon: Landmark, color: '#a1a1aa' },
};

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('accounts');

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isPWAInstallOpen, setIsPWAInstallOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // Initialize data from LocalStorage & register Service Worker & PWA listeners
  useEffect(() => {
    const loadedAccounts = getStoredAccounts();
    const loadedHistory = getStoredHistory();
    setAccounts(loadedAccounts);
    setHistory(loadedHistory);

    // Register Service Worker for Progressive Web App capabilities
    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(
          (registration) => {
            console.log('PWA ServiceWorker registered with scope:', registration.scope);
          },
          (err) => {
            console.warn('PWA ServiceWorker registration failed:', err);
          }
        );
      };

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    // Check standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
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
  };

  // 4. Delete an account
  const handleDeleteAccount = (id: string) => {
    const updated = accounts.filter((acc) => acc.id !== id);
    setAccounts(updated);
    saveStoredAccounts(updated);
    updateTodayHistoryIfExists(updated, history);
  };

  // Group accounts by category in canonical order
  const groupedAccounts = useMemo(() => {
    const categoryMap = new Map<string, { account: Account; globalIndex: number }[]>();

    accounts.forEach((acc, globalIndex) => {
      let catKey = acc.category || 'Bank';
      if (!CATEGORY_META[catKey]) {
        catKey = 'Other';
      }
      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, []);
      }
      categoryMap.get(catKey)!.push({ account: acc, globalIndex });
    });

    const categoriesInOrder = [
      ...CATEGORY_ORDER,
      ...Array.from(categoryMap.keys()).filter((k) => !CATEGORY_ORDER.includes(k)),
    ];

    const groups: {
      categoryKey: string;
      meta: { label: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }>; color: string };
      items: { account: Account; globalIndex: number }[];
      subtotal: number;
    }[] = [];

    categoriesInOrder.forEach((catKey) => {
      const items = categoryMap.get(catKey);
      if (items && items.length > 0) {
        const subtotal = items.reduce((sum, item) => sum + item.account.balance, 0);
        groups.push({
          categoryKey: catKey,
          meta: CATEGORY_META[catKey] || CATEGORY_META.Other,
          items,
          subtotal,
        });
      }
    });

    return groups;
  }, [accounts]);

  // Drag & Drop Account Reordering State (Strictly within Category)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [touchStartIndex, setTouchStartIndex] = useState<number | null>(null);

  const reorderCategoryAccounts = (fromGlobalIdx: number, toGlobalIdx: number) => {
    const fromAcc = accounts[fromGlobalIdx];
    const toAcc = accounts[toGlobalIdx];
    if (!fromAcc || !toAcc) return;

    const fromCat = fromAcc.category || 'Bank';
    const toCat = toAcc.category || 'Bank';
    if (fromCat !== toCat) return; // Prevent reordering across different categories

    // Find all global indices in this category
    const catIndices: number[] = [];
    accounts.forEach((acc, i) => {
      const accCat = acc.category || 'Bank';
      if (accCat === fromCat) {
        catIndices.push(i);
      }
    });

    const fromCatSubIdx = catIndices.indexOf(fromGlobalIdx);
    const toCatSubIdx = catIndices.indexOf(toGlobalIdx);

    if (fromCatSubIdx === -1 || toCatSubIdx === -1 || fromCatSubIdx === toCatSubIdx) return;

    const catAccounts = catIndices.map((i) => accounts[i]);
    const [movedItem] = catAccounts.splice(fromCatSubIdx, 1);
    catAccounts.splice(toCatSubIdx, 0, movedItem);

    const updated = [...accounts];
    catIndices.forEach((globalIdx, idx) => {
      updated[globalIdx] = catAccounts[idx];
    });

    setAccounts(updated);
    saveStoredAccounts(updated);
    updateTodayHistoryIfExists(updated, history);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, globalIndex: number) => {
    setDraggedIndex(globalIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetGlobalIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const draggedCat = accounts[draggedIndex]?.category || 'Bank';
    const targetCat = accounts[targetGlobalIndex]?.category || 'Bank';

    if (draggedCat === targetCat) {
      e.dataTransfer.dropEffect = 'move';
      if (dragOverIndex !== targetGlobalIndex) {
        setDragOverIndex(targetGlobalIndex);
      }
    } else {
      e.dataTransfer.dropEffect = 'none';
      if (dragOverIndex !== null) {
        setDragOverIndex(null);
      }
    }
  };

  const handleDragLeave = () => {
    // leave handled
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropGlobalIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropGlobalIndex) {
      reorderCategoryAccounts(draggedIndex, dropGlobalIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveAccount = (fromGlobalIdx: number, toGlobalIdx: number) => {
    reorderCategoryAccounts(fromGlobalIdx, toGlobalIdx);
  };

  const handleTouchStartDrag = (e: React.TouchEvent<HTMLDivElement>, globalIndex: number) => {
    setTouchStartIndex(globalIndex);
    setDraggedIndex(globalIndex);
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
        if (!isNaN(hoverIdx)) {
          const touchCat = accounts[touchStartIndex]?.category || 'Bank';
          const hoverCat = accounts[hoverIdx]?.category || 'Bank';
          if (touchCat === hoverCat && hoverIdx !== dragOverIndex) {
            setDragOverIndex(hoverIdx);
          } else if (touchCat !== hoverCat && dragOverIndex !== null) {
            setDragOverIndex(null);
          }
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (
      touchStartIndex !== null &&
      dragOverIndex !== null &&
      touchStartIndex !== dragOverIndex
    ) {
      reorderCategoryAccounts(touchStartIndex, dragOverIndex);
    }
    setTouchStartIndex(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 5. Save Entry (Snapshot today's balances into History)
  const handleSaveEntry = () => {
    if (accounts.length === 0) {
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
    }
  };

  // 6. Export History to Excel
  const handleExportExcel = () => {
    exportHistoryToExcel(history, accounts);
  };

  // 7. Clear All Data
  const handleClearAllData = () => {
    clearAllAppData();
    setAccounts([]);
    setHistory([]);
  };

  // 8. Delete a single history entry
  const handleDeleteHistoryEntry = (id: string) => {
    const updatedHistory = history.filter((h) => h.id !== id);
    setHistory(updatedHistory);
    saveStoredHistory(updatedHistory);
  };

  const lastHistoryDate = history.length > 0 ? history[0].date : undefined;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-blue-500 selection:text-white pb-28">
      {/* Top Header */}
      <Header
        totalAccounts={accounts.length}
        lastSavedDate={lastHistoryDate}
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
                  <WalletCards className="w-4 h-4 text-sky-400" />
                  <h2 className="text-base font-extrabold tracking-wide text-sky-400">Your Accounts</h2>
                  <span className="text-xs text-sky-500/80 font-mono font-bold">
                    ({accounts.length})
                  </span>
                </div>
                <button
                  id="add-account-header-btn"
                  onClick={() => setIsAddAccountOpen(true)}
                  className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-sky-400 border border-zinc-800 hover:border-sky-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
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
                  className="space-y-6"
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {groupedAccounts.map((group, groupIdx) => {
                    const Icon = group.meta.icon;
                    return (
                      <div key={group.categoryKey} className="space-y-3">
                        {/* Thin separator line between categories */}
                        {groupIdx > 0 && (
                          <div className="pt-2 border-t border-zinc-800/80" />
                        )}

                        {/* Category Header */}
                        <div className="flex items-center justify-between px-0.5 pb-0.5">
                          <div className="flex items-center space-x-2.5">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${group.meta.color}20`,
                                border: `1px solid ${group.meta.color}45`,
                              }}
                            >
                              <Icon className="w-3.5 h-3.5" style={{ color: group.meta.color }} />
                            </div>
                            <h3
                              className="text-sm font-bold tracking-tight"
                              style={{ color: group.meta.color }}
                            >
                              {group.meta.label}
                            </h3>
                            <span
                              className="text-[11px] font-mono px-2 py-0.5 rounded-md border font-medium"
                              style={{
                                color: group.meta.color,
                                backgroundColor: `${group.meta.color}12`,
                                borderColor: `${group.meta.color}30`,
                              }}
                            >
                              {group.items.length} {group.items.length === 1 ? 'account' : 'accounts'}
                            </span>
                          </div>
                          <div
                            className="text-xs sm:text-sm font-mono font-bold"
                            style={{ color: group.meta.color }}
                          >
                            {formatCurrency(group.subtotal)}
                          </div>
                        </div>

                        {/* Accounts list for this category */}
                        <div className="space-y-3 pt-1">
                          {group.items.map(({ account, globalIndex }) => (
                            <AccountRow
                              key={account.id}
                              account={account}
                              index={globalIndex}
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
                              isDragging={draggedIndex === globalIndex}
                              isDragOver={dragOverIndex === globalIndex && draggedIndex !== globalIndex}
                              onTouchStartDrag={handleTouchStartDrag}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
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
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400">
                    Fund Log History
                  </span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
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
        deferredPrompt={deferredPrompt}
        isInstalled={isInstalled}
      />

      {/* Toast Messages */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
