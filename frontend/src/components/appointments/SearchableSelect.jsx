import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check, ChevronDown, User, UserCheck } from 'lucide-react';

export default function SearchableSelect({
  label,
  required = false,
  placeholder = 'Type to search...',
  options = [], // [{ id, title, subtitle, badge }]
  value, // selected id
  onChange, // (id) => void
  disabled = false,
  error = null,
  icon: IconComponent = User,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return options.find((opt) => String(opt.id) === String(value)) || null;
  }, [options, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const q = searchTerm.toLowerCase().trim();
    return options.filter((opt) => {
      const titleMatch = (opt.title || '').toLowerCase().includes(q);
      const subMatch = (opt.subtitle || '').toLowerCase().includes(q);
      const idMatch = String(opt.id || '').includes(q);
      return titleMatch || subMatch || idMatch;
    });
  }, [options, searchTerm]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id) => {
    onChange(id);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <IconComponent className="w-3.5 h-3.5 text-blue-500" />
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
          {selectedOption && (
            <span className="text-[11px] font-normal normal-case text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
              {selectedOption.subtitle || `ID #${selectedOption.id}`}
            </span>
          )}
        </label>
      )}

      {/* Main Selector Box */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            if (inputRef.current) inputRef.current.focus();
          }
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-colors cursor-pointer ${
          disabled
            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 cursor-not-allowed'
            : error
            ? 'bg-rose-50/20 dark:bg-rose-950/20 border-rose-400 text-slate-900 dark:text-slate-100'
            : isOpen
            ? 'bg-white dark:bg-slate-800 border-blue-500 ring-2 ring-blue-500/20 text-slate-900 dark:text-slate-100'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <IconComponent className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          
          {selectedOption ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {selectedOption.title}
              </span>
              {selectedOption.badge && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 shrink-0">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-blue-500' : ''
            }`}
          />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
          {error}
        </p>
      )}

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-fade-in">
          
          {/* Search Box inside Dropdown */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-850/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to filter..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-100/60 dark:divide-slate-700/40">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                No matching results found for "{searchTerm}"
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.id) === String(value);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate flex items-center gap-1.5">
                        <span>{opt.title}</span>
                        {opt.badge && (
                          <span className="text-[9px] px-1 py-0.2 rounded-xs bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.subtitle && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-400 truncate mt-0.5">
                          {opt.subtitle}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

