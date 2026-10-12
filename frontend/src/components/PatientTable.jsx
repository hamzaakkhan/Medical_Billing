import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Eye,
  Edit3,
  Trash2,
  ArrowUpDown,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import EmptyState from './EmptyState';
import { formatFullName, getInitials } from '../utils/nameFormat';

export default function PatientTable({
  patients,
  onView,
  onEdit,
  onDelete,
  onOpenAddModal,
  searchQuery,
  onSearchChange,
  viewOnly = false,
}) {
  const [cityFilter, setCityFilter] = useState('ALL');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Extract distinct cities for quick filter
  const distinctCities = useMemo(() => {
    const set = new Set();
    patients.forEach((p) => {
      if (p.city && p.city.trim()) {
        set.add(p.city.trim());
      }
    });
    return Array.from(set).sort();
  }, [patients]);

  // Filtered and sorted patients
  const filteredPatients = useMemo(() => {
    let result = [...patients];

    // Search query filter
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const fullName = `${p.first_name || ''} ${p.middle_name || ''} ${p.last_name || ''}`.toLowerCase();
        const idMatch = String(p.id).includes(q);
        const phoneMatch = (p.phone || '').toLowerCase().includes(q);
        const emailMatch = (p.email || '').toLowerCase().includes(q);
        const cityMatch = (p.city || '').toLowerCase().includes(q);
        const stateMatch = (p.state || '').toLowerCase().includes(q);
        const zipMatch = (p.postal_code || '').toLowerCase().includes(q);
        return (
          idMatch ||
          fullName.includes(q) ||
          phoneMatch ||
          emailMatch ||
          cityMatch ||
          stateMatch ||
          zipMatch
        );
      });
    }

    // City filter
    if (cityFilter !== 'ALL') {
      result = result.filter((p) => (p.city || '').toLowerCase() === cityFilter.toLowerCase());
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'name') {
        valA = `${a.last_name || ''} ${a.first_name || ''}`.toLowerCase();
        valB = `${b.last_name || ''} ${b.first_name || ''}`.toLowerCase();
      } else if (sortField === 'id') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [patients, searchQuery, cityFilter, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age}y` : '';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Controls Bar: Search & City Filters */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50/50 dark:bg-slate-850 dark:bg-slate-800/40">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, phone, email, city, or ID..."
            className="w-full pl-10 pr-9 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/40 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter and Stats */}
        <div className="flex items-center gap-3">
          {distinctCities.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/40 transition"
              >
                <option value="ALL">All Cities ({distinctCities.length})</option>
                {distinctCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap pl-2 border-l border-slate-200 dark:border-slate-700">
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredPatients.length}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{patients.length}</span> records
          </div>
        </div>
      </div>

      {/* Table Content */}
      {patients.length === 0 ? (
        <EmptyState type="none" onAction={onOpenAddModal} actionLabel="Add Patient" />
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          type="search"
          onAction={() => {
            onSearchChange('');
            setCityFilter('ALL');
          }}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 select-none">
                <th
                  onClick={() => handleSort('id')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition w-20"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Chart #</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition min-w-[220px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Patient Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('dob')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition min-w-[130px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>DOB / Age</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[200px]">Contact Info</th>
                <th className="py-3 px-4 min-w-[180px]">Location</th>
                <th className="py-3 px-4 min-w-[140px]">Emergency</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {filteredPatients.map((patient) => {
                const fullName = formatFullName(patient.first_name, patient.middle_name, patient.last_name);
                const initials = getInitials(patient.first_name, patient.last_name);
                const age = calculateAge(patient.dob);

                return (
                  <tr
                    key={patient.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    onClick={(e) => {
                      // Only trigger view modal if not clicking action buttons
                      if (!e.target.closest('button') && !e.target.closest('a')) {
                        onView(patient);
                      }
                    }}
                  >
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                      #{patient.id}
                    </td>

                    {/* Patient Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center shrink-0 border border-sky-200/60 dark:border-sky-800/80">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-700 dark:group-hover:text-sky-400 transition truncate">
                            {fullName}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                            {patient.city}, {patient.state}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* DOB / Age */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">{patient.dob}</div>
                      {age && (
                        <span className="inline-block text-[11px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
                          {age}
                        </span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <a
                          href={`tel:${patient.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 transition"
                        >
                          <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>{patient.phone}</span>
                        </a>
                        <a
                          href={`mailto:${patient.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition truncate max-w-[200px]"
                        >
                          <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{patient.email}</span>
                        </a>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate max-w-[180px]">
                        {patient.address}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {patient.city}, {patient.state} {patient.postal_code}
                      </div>
                    </td>

                    {/* Emergency Contact */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {patient.emergency_phone ? (
                        <div className="flex items-center gap-1 text-xs font-mono text-slate-700 dark:text-slate-300">
                          <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{patient.emergency_phone}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">None</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(patient);
                          }}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/60 rounded-lg transition"
                          title="View Patient Chart"
                          aria-label="View Patient Chart"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(patient);
                          }}
                          className={`p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-lg transition ${viewOnly || !onEdit ? 'hidden' : ''}`}
                          title="Edit Patient"
                          aria-label="Edit Patient"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(patient);
                          }}
                          className={`p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition ${viewOnly || !onDelete ? 'hidden' : ''}`}
                          title="Delete Patient"
                          aria-label="Delete Patient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
