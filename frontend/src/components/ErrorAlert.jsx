import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorAlert({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6 text-rose-900 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-rose-100 rounded-xl text-rose-600 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">Failed to load patient records</h4>
          <p className="mt-1 text-xs text-rose-700 leading-relaxed">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition shrink-0 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
