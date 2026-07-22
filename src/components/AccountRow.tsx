import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  Landmark,
  CreditCard,
  Coins,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Account } from '../types';
import { formatCurrency, parseBalanceInput } from '../utils/formatters';

interface AccountRowProps {
  account: Account;
  index: number;
  totalAccounts: number;
  onUpdateBalance: (id: string, newBalance: number) => void;
  onUpdateName: (id: string, newName: string) => void;
  onDeleteAccount: (id: string) => void;
  onMoveAccount?: (fromIndex: number, toIndex: number) => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onTouchStartDrag?: (e: React.TouchEvent<HTMLDivElement>, index: number) => void;
}

export const AccountRow: React.FC<AccountRowProps> = ({
  account,
  index,
  totalAccounts,
  onUpdateBalance,
  onUpdateName,
  onDeleteAccount,
  onMoveAccount,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging = false,
  isDragOver = false,
  onTouchStartDrag,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(account.name);
  const [inputValue, setInputValue] = useState(account.balance.toString());
  const [isFocused, setIsFocused] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal input when account balance updates from outside
  useEffect(() => {
    if (!isFocused) {
      setInputValue(account.balance.toString());
    }
  }, [account.balance, isFocused]);

  useEffect(() => {
    setNameValue(account.name);
  }, [account.name]);

  const handleNameSave = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== account.name) {
      onUpdateName(account.id, trimmed);
    } else {
      setNameValue(account.name);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNameSave();
    if (e.key === 'Escape') {
      setNameValue(account.name);
      setIsEditingName(false);
    }
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    const parsed = parseBalanceInput(raw);
    onUpdateBalance(account.id, parsed);
  };

  // Long press timer handlers for touch reordering
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Don't trigger long press if interacting with input or button
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button') || target.closest('input')) {
      return;
    }

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    
    longPressTimerRef.current = setTimeout(() => {
      if (onTouchStartDrag) {
        onTouchStartDrag(e, index);
      }
    }, 300);
  };

  const handleTouchEndOrMove = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Icon based on category or name
  const getCategoryIcon = () => {
    const cat = (account.category || account.name).toLowerCase();
    if (cat.includes('credit card') || cat.includes('credit')) {
      return <CreditCard className="w-5 h-5 text-rose-400" />;
    }
    if (cat.includes('bank') || cat.includes('sbi') || cat.includes('hdfc') || cat.includes('icici')) {
      return <Landmark className="w-5 h-5 text-blue-400" />;
    }
    if (cat.includes('cash')) {
      return <Wallet className="w-5 h-5 text-emerald-400" />;
    }
    if (cat.includes('upi') || cat.includes('wallet') || cat.includes('paytm')) {
      return <CreditCard className="w-5 h-5 text-purple-400" />;
    }
    return <Coins className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div
      id={`account-card-${account.id}`}
      data-account-index={index}
      data-account-category={account.category || 'Bank'}
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, index)}
      onDragOver={(e) => onDragOver && onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop && onDrop(e, index)}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchEndOrMove}
      onTouchEnd={handleTouchEndOrMove}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('input') || target.closest('button')) {
          return;
        }
        setShowMobileActions((prev) => !prev);
      }}
      className={`group relative bg-zinc-900 border rounded-2xl p-3.5 sm:p-4 transition-all duration-200 shadow-md select-none cursor-pointer ${
        isDragging
          ? 'opacity-40 border-dashed border-blue-500/60 bg-blue-500/5 scale-[0.98]'
          : isDragOver
          ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30 scale-[1.01] shadow-blue-500/10'
          : showMobileActions
          ? 'border-blue-500/50 bg-zinc-900 ring-1 ring-blue-500/20'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Account Icon & Name */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-1">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: account.color ? `${account.color}15` : '#3b82f615',
              border: `1px solid ${account.color ? `${account.color}30` : '#3b82f630'}`,
            }}
          >
            {getCategoryIcon()}
          </div>

          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  autoFocus
                  className="bg-zinc-950 border border-blue-500/60 rounded-lg px-2.5 py-1 text-sm text-white font-medium focus:outline-none w-full max-w-[140px] sm:max-w-[180px]"
                />
                <button
                  type="button"
                  onClick={handleNameSave}
                  className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                  title="Save Name"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNameValue(account.name);
                    setIsEditingName(false);
                  }}
                  className="p-1.5 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 group/title">
                <h3 className="text-sm sm:text-base font-medium text-zinc-100 truncate">
                  {account.name}
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingName(true);
                  }}
                  className={`p-1 text-zinc-500 hover:text-zinc-300 transition-all rounded-md hover:bg-zinc-800 ${
                    showMobileActions
                      ? 'inline-flex opacity-100 text-blue-400'
                      : 'hidden sm:inline-flex sm:opacity-0 sm:group-hover/title:opacity-100'
                  }`}
                  title="Edit account name"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="text-xs text-zinc-500 mt-0.5">
              <span className="truncate max-w-[120px] sm:max-w-none">{account.category || 'General'}</span>
            </div>
          </div>
        </div>

        {/* Right: Amount Input & Controls on the SAME line */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
          {/* Amount Input */}
          <div className="relative flex items-center shrink-0">
            <span className="absolute left-2.5 text-zinc-500 font-mono text-xs sm:text-sm font-semibold pointer-events-none">
              ₹
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={inputValue}
              onChange={handleBalanceChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="0"
              className="w-28 sm:w-36 md:w-40 pl-6 sm:pl-7 pr-2.5 sm:pr-3 py-1.5 sm:py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-xl text-right font-mono text-sm sm:text-base font-bold text-white focus:outline-none transition-colors min-h-[38px] sm:min-h-[42px]"
            />
          </div>

          {/* Delete Account Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteAccount(account.id);
            }}
            className={`p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer shrink-0 min-w-[36px] min-h-[36px] sm:min-w-[42px] sm:min-h-[42px] items-center justify-center ${
              showMobileActions ? 'flex text-rose-400 bg-rose-500/10' : 'hidden sm:flex'
            }`}
            title="Delete Account"
          >
            <Trash2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

