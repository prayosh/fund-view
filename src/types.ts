export interface Account {
  id: string;
  name: string;
  balance: number;
  category?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  serialNo: number;
  date: string; // ISO string or human formatted date
  timestamp: number; // for sorting
  balances: Record<string, number>; // accountId -> balance
  accountNames: Record<string, string>; // accountId -> account name at time of entry
  total: number;
  note?: string;
}

export type TabType = 'accounts' | 'history';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  text: string;
}
