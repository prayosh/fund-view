import React, { useState } from 'react';
import { X, Plus, Wallet, Landmark, CreditCard, Coins, Check } from 'lucide-react';
import { parseBalanceInput } from '../utils/formatters';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (data: {
    name: string;
    balance: number;
    category: string;
    color: string;
  }) => void;
}

const CATEGORIES = [
  { id: 'Bank', label: 'Bank Account', icon: Landmark, color: '#3b82f6' },
  { id: 'Cash', label: 'Cash in Hand', icon: Wallet, color: '#10b981' },
  { id: 'Wallet', label: 'UPI / Wallet', icon: CreditCard, color: '#8b5cf6' },
  { id: 'Credit Card', label: 'Credit Card', icon: CreditCard, color: '#f43f5e' },
  { id: 'Investment', label: 'Investment', icon: Coins, color: '#f59e0b' },
];

const PRESET_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#06b6d4', // cyan
];

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAddAccount,
}) => {
  const [name, setName] = useState('');
  const [balanceInput, setBalanceInput] = useState('');
  const [category, setCategory] = useState('Bank');
  const [color, setColor] = useState('#10b981');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter an account name.');
      return;
    }

    const initialBalance = parseBalanceInput(balanceInput);

    onAddAccount({
      name: trimmed,
      balance: initialBalance,
      category,
      color,
    });

    // Reset and close
    setName('');
    setBalanceInput('');
    setCategory('Bank');
    setColor('#10b981');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Add New Account</h2>
              <p className="text-xs text-zinc-400">Track a new bank, wallet, or cash fund</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Account Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Account Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Axis Bank, Paytm, Cash Savings"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl text-sm font-medium text-white focus:outline-none transition-colors"
            />
          </div>

          {/* Initial Balance */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Initial Balance (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-zinc-500 font-mono text-sm font-bold">
                ₹
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl font-mono text-base font-bold text-white focus:outline-none transition-colors min-h-[44px]"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      setColor(cat.color);
                    }}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500/50 text-white shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: isSelected ? cat.color : undefined }}
                    />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-zinc-300">Tag Color</label>
            <div className="flex items-center space-x-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center space-x-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 cursor-pointer"
            >
              Add Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
