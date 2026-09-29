import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-slide-up"
    >
      <div
        className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm backdrop-blur-md transition-all ${
          isSuccess
            ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-900/10'
            : isError
            ? 'bg-rose-50/95 border-rose-200 text-rose-900 shadow-rose-900/10'
            : 'bg-sky-50/95 border-sky-200 text-sky-900 shadow-sky-900/10'
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          {isError && <AlertCircle className="w-5 h-5 text-rose-600" />}
          {!isSuccess && !isError && <Info className="w-5 h-5 text-sky-600" />}
        </div>
        <div className="flex-1">
          <p className="font-semibold">{toast.title || (isSuccess ? 'Success' : isError ? 'Error' : 'Notice')}</p>
          <p className="mt-0.5 text-xs text-opacity-90">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 text-slate-400 hover:text-slate-700 rounded-lg p-1 transition"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
