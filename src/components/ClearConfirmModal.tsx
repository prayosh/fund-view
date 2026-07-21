import React, { useState } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface ClearConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: () => void;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmClear,
}) => {
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirmClear();
    setConfirmText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-zinc-900 border border-red-900/40 rounded-3xl p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Clear All App Data?</h2>
              <p className="text-xs text-red-400 font-medium uppercase tracking-wider">
                Irreversible Action
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Text */}
        <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-4 text-xs text-zinc-300 space-y-2">
          <p>
            This action will permanently delete <strong className="text-red-300">all accounts</strong>,{' '}
            <strong className="text-red-300">all history snapshots</strong>, and reset your{' '}
            <strong className="text-red-300">app data</strong>.
          </p>
          <p className="text-zinc-500">
            Once cleared, your data cannot be recovered unless you exported a backup beforehand.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="w-1/2 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950/50 transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider text-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Yes, Delete All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
