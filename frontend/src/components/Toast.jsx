import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, message, type = 'success', title, onClose }) {
  const activeMessage = toast?.message || message;
  const activeType = toast?.type || type || 'success';
  const activeTitle = toast?.title || title;

  useEffect(() => {
    if (!activeMessage) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [activeMessage, onClose]);

  if (!activeMessage) return null;

  const isSuccess = activeType === 'success';
  const isError = activeType === 'error';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-fade-in"
    >
      <div
        className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm backdrop-blur-md transition-all ${
          isSuccess
            ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
            : isError
            ? 'bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
            : 'bg-blue-50/95 dark:bg-blue-950/90 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          {isError && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
          {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-xs uppercase tracking-wider">
            {activeTitle || (isSuccess ? 'Success' : isError ? 'Error' : 'Notice')}
          </p>
          <p className="mt-0.5 text-xs font-medium leading-relaxed break-words">
            {activeMessage}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg p-1 transition"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
