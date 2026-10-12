import React from 'react';
import { DollarSign, FileText, TrendingUp, XCircle } from 'lucide-react';
import { StatCard, SkeletonCard, SectionHeader, StatusBadge, DashTable, Th, Td } from './DashWidgets';

const RECENT_CLAIMS = [
  { id: 'CLM-1021', patient: 'Jane Smith',  amount: '$1,250', insurer: 'Aetna',    status: 'Paid',    date: 'Oct 1, 2026' },
  { id: 'CLM-1022', patient: 'Mark Davis',  amount: '$3,400', insurer: 'BlueCross', status: 'Pending', date: 'Oct 2, 2026' },
  { id: 'CLM-1023', patient: 'Sima Torres', amount: '$780',   insurer: 'Cigna',     status: 'Denied',  date: 'Oct 3, 2026' },
  { id: 'CLM-1024', patient: 'Alex Brown',  amount: '$2,100', insurer: 'Medicare',  status: 'Paid',    date: 'Oct 4, 2026' },
];

export default function BillerDashboard({ isLoading, navigate }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Billing & Revenue Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Claims, invoices, denials, and payment tracking</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <SkeletonCard key={i}/>)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Billed MTD" value="$845,920" icon={DollarSign} iconBg="bg-blue-50 dark:bg-blue-950/50" iconColor="text-blue-600 dark:text-blue-400" />
          <StatCard label="Claims Submitted" value="142" sub="This month" icon={FileText} iconBg="bg-violet-50 dark:bg-violet-950/50" iconColor="text-violet-600 dark:text-violet-400" />
          <StatCard label="Collection Rate" value="84.8%" trend="↑ vs last month" trendUp icon={TrendingUp} iconBg="bg-emerald-50 dark:bg-emerald-950/50" iconColor="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Open Denials" value="7" sub="Require action" icon={XCircle} iconBg="bg-red-50 dark:bg-red-950/50" iconColor="text-red-500 dark:text-red-400" />
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
        <SectionHeader title="Recent Claims" action={
          <button onClick={() => navigate('/claims')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all claims</button>
        }/>
        <DashTable>
          <thead><tr><Th>Claim ID</Th><Th>Patient</Th><Th>Amount</Th><Th>Insurer</Th><Th>Status</Th><Th>Date</Th></tr></thead>
          <tbody>
            {RECENT_CLAIMS.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                <Td><span className="font-mono text-xs font-semibold text-gray-700 dark:text-slate-300">{c.id}</span></Td>
                <Td><span className="font-medium text-gray-900 dark:text-slate-100">{c.patient}</span></Td>
                <Td className="font-semibold text-gray-900 dark:text-slate-100">{c.amount}</Td>
                <Td className="text-gray-700 dark:text-slate-300">{c.insurer}</Td>
                <Td><StatusBadge status={c.status}/></Td>
                <Td className="text-gray-500 dark:text-slate-400">{c.date}</Td>
              </tr>
            ))}
          </tbody>
        </DashTable>
      </div>
    </div>
  );
}
