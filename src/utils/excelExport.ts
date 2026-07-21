import * as XLSX from 'xlsx';
import { Account, HistoryEntry } from '../types';
import { formatDate } from './formatters';

/**
 * Exports history entries and current accounts snapshot as a real .xlsx Excel file.
 */
export function exportHistoryToExcel(
  history: HistoryEntry[],
  currentAccounts: Account[]
): void {
  if (!history || history.length === 0) {
    alert('No history entries available to export.');
    return;
  }

  // 1. Collect all account IDs that appear across all history entries and current accounts
  const accountIdSet = new Set<string>();
  const accountNameMap: Record<string, string> = {};

  // First add current accounts to preserve order
  currentAccounts.forEach((acc) => {
    accountIdSet.add(acc.id);
    accountNameMap[acc.id] = acc.name;
  });

  // Then add any historical account IDs that might have been deleted later
  history.forEach((entry) => {
    Object.keys(entry.balances || {}).forEach((accId) => {
      accountIdSet.add(accId);
      if (!accountNameMap[accId] && entry.accountNames?.[accId]) {
        accountNameMap[accId] = entry.accountNames[accId];
      }
    });
  });

  const orderedAccountIds = Array.from(accountIdSet);

  // 2. Build Excel Header Row
  // S.No | Date | [Account 1 Name] | [Account 2 Name] ... | Total Funds
  const headers = [
    'S.No',
    'Date & Time',
    ...orderedAccountIds.map((id) => accountNameMap[id] || 'Unknown Account'),
    'Total Funds (₹)',
  ];

  // 3. Build Row Data
  const rows = history.map((entry, index) => {
    const serialNo = entry.serialNo || index + 1;
    const formattedDate = formatDate(entry.date || entry.timestamp);

    const rowObj: (string | number)[] = [serialNo, formattedDate];

    // For each account column, populate the recorded balance or empty string if account didn't exist then
    orderedAccountIds.forEach((accId) => {
      const val = entry.balances?.[accId];
      if (val !== undefined && val !== null) {
        rowObj.push(val);
      } else {
        rowObj.push(''); // Blank for non-existent accounts
      }
    });

    rowObj.push(entry.total || 0);
    return rowObj;
  });

  // Combine headers and data rows
  const sheetData = [headers, ...rows];

  // 4. Create Sheet and Workbook
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Calculate auto column widths for neat display
  const colWidths = headers.map((header, colIndex) => {
    let maxLen = String(header).length;
    rows.forEach((row) => {
      const cellVal = String(row[colIndex] ?? '');
      if (cellVal.length > maxLen) {
        maxLen = cellVal.length;
      }
    });
    return { wch: Math.max(maxLen + 4, 12) };
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fund History');

  // 5. Trigger download
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `FundView_History_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, filename);
}
