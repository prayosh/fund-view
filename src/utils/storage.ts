import { Account, HistoryEntry } from '../types';

const ACCOUNTS_STORAGE_KEY = 'fundview_accounts_v2';
const HISTORY_STORAGE_KEY = 'fundview_history_v2';

export const DEFAULT_ACCOUNTS: Account[] = [];

export const DEFAULT_INITIAL_HISTORY: HistoryEntry[] = [];

/**
 * Loads accounts from LocalStorage. Returns empty array if empty.
 */
export function getStoredAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      saveStoredAccounts([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse accounts from localStorage:', err);
    return [];
  }
}

/**
 * Saves accounts array to LocalStorage.
 */
export function saveStoredAccounts(accounts: Account[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save accounts to localStorage:', err);
  }
}

/**
 * Loads history from LocalStorage.
 */
export function getStoredHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      saveStoredHistory([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse history from localStorage:', err);
    return [];
  }
}

/**
 * Saves history array to LocalStorage.
 */
export function saveStoredHistory(history: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to save history to localStorage:', err);
  }
}

/**
 * Clears all accounts, history, and LocalStorage items for Fund View.
 */
export function clearAllAppData(): void {
  try {
    localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    // Also remove v1 keys if present
    localStorage.removeItem('fundview_accounts_v1');
    localStorage.removeItem('fundview_history_v1');
  } catch (err) {
    console.error('Failed to clear app data from localStorage:', err);
  }
}
