import React from 'react';
import { Code2, FileText, CheckCircle, Clock } from 'lucide-react';
import { StatCard, SkeletonCard, SectionHeader, StatusBadge, DashTable, Th, Td } from './DashWidgets';

const RECENT_CODING = [
  { patient: 'Jane Smith',  encounter: 'Office Visit',    icd: 'J06.9', cpt: '99213', status: 'Completed', date: 'Oct 4, 2026' },
  { patient: 'Mark Davis',  encounter: 'Annual Physical', icd: 'Z00.00', cpt: '99396', status: 'Pending',   date: 'Oct 5, 2026' },
  { patient: 'Sima Torres', encounter: 'Follow-up',       icd: 'I10',    cpt: '99214', status: 'Pending',   date: 'Oct 6, 2026' },
];

export default function CoderDashboard({ isLoading, navigate }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Medical Coding Workbench</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review encounters, assign ICD & CPT codes</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_,i) => <SkeletonCard key={i}/>)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Encounters to Code" value="12" icon={Code2} iconBg="bg-amber-50" iconColor="text-amber-600" />
          <StatCard label="Coded Today" value="8" icon={CheckCircle} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard label="Pending Review" value="4" icon={Clock} iconBg="bg-blue-50" iconColor="text-blue-600" />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <SectionHeader title="Recent Coding Queue" action={
          <button onClick={() => navigate('/coding')} className="text-xs text-blue-600 hover:underline">Open full workbench</button>
        }/>
        <DashTable>
          <thead><tr><Th>Patient</Th><Th>Encounter</Th><Th>ICD-10</Th><Th>CPT</Th><Th>Status</Th><Th>Date</Th></tr></thead>
          <tbody>
            {RECENT_CODING.map((c, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <Td><span className="font-medium text-gray-900">{c.patient}</span></Td>
                <Td>{c.encounter}</Td>
                <Td><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{c.icd}</code></Td>
                <Td><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{c.cpt}</code></Td>
                <Td><StatusBadge status={c.status}/></Td>
                <Td className="text-gray-500">{c.date}</Td>
              </tr>
            ))}
          </tbody>
        </DashTable>
      </div>
    </div>
  );
}
