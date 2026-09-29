import React from 'react';
import { UserX, UserPlus, SearchX } from 'lucide-react';

export default function EmptyState({ type = 'none', onAction, actionLabel }) {
  const isSearch = type === 'search';

  return (
    <div className="py-16 px-6 text-center max-w-sm mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-inner">
        {isSearch ? (
          <SearchX className="w-8 h-8 text-sky-500" />
        ) : (
          <UserX className="w-8 h-8 text-sky-500" />
        )}
      </div>
      <h3 className="text-base font-semibold text-slate-800">
        {isSearch ? 'No matching patients found' : 'No patients registered yet'}
      </h3>
      <p className="mt-1.5 text-sm text-slate-500">
        {isSearch
          ? 'Try adjusting your search criteria or clearing filters to find records.'
          : 'Get started by creating a new patient record in the clinic database.'}
      </p>
      {onAction && (
        <div className="mt-6">
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition shadow-sm hover:shadow"
          >
            {isSearch ? (
              'Reset Search'
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {actionLabel || 'Register First Patient'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
