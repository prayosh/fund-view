import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-slate-900/90 text-slate-100',
    error: 'border-rose-500/30 bg-slate-900/90 text-slate-100',
    warning: 'border-amber-500/30 bg-slate-900/90 text-slate-100',
    info: 'border-blue-500/30 bg-slate-900/90 text-slate-100',
  };

  return (
    <div className="fixed top-16 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-3 duration-200">
      <div
        className={`flex items-center justify-between p-3.5 rounded-2xl border shadow-xl backdrop-blur-md ${borders[toast.type]}`}
      >
        <div className="flex items-center space-x-3">
          {icons[toast.type]}
          <span className="text-xs font-semibold">{toast.text}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
