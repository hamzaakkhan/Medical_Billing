import React from 'react';
import { Stethoscope, Clock, Users, ClipboardList } from 'lucide-react';
import { StatCard, SkeletonCard, SectionHeader, StatusBadge, DashTable, Th, Td } from './DashWidgets';

const MY_PATIENTS = [
  { name: 'Jane Smith',  time: '08:30 AM', status: 'In Session',  dob: '1985-04-12' },
  { name: 'Mark Davis',  time: '09:30 AM', status: 'Scheduled',   dob: '1990-11-03' },
  { name: 'Sima Davis',  time: '10:00 AM', status: 'Scheduled',   dob: '1978-07-22' },
];

export default function DoctorDashboard({ patients, isLoading, navigate }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Clinical Overview</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Your today's schedule and patient queue</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_,i) => <SkeletonCard key={i}/>)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="My Patients Today" value="3" icon={Users} iconBg="bg-blue-50 dark:bg-blue-950/50" iconColor="text-blue-600 dark:text-blue-400" />
          <StatCard label="In Session Now" value="1" icon={Stethoscope} iconBg="bg-green-50 dark:bg-emerald-950/50" iconColor="text-green-600 dark:text-emerald-400" />
          <StatCard label="Pending Notes" value="2" icon={ClipboardList} iconBg="bg-amber-50 dark:bg-amber-950/50" iconColor="text-amber-600 dark:text-amber-400" />
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
        <SectionHeader title="Today's Patient Schedule" action={
          <button onClick={() => navigate('/patients')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all patients</button>
        }/>
        <DashTable>
          <thead><tr><Th>Patient</Th><Th>Time</Th><Th>Status</Th><Th>DOB</Th><Th>Action</Th></tr></thead>
          <tbody>
            {MY_PATIENTS.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                <Td><span className="font-medium text-gray-900 dark:text-slate-100">{p.name}</span></Td>
                <Td className="text-gray-500 dark:text-slate-400">{p.time}</Td>
                <Td><StatusBadge status={p.status}/></Td>
                <Td className="text-gray-500 dark:text-slate-400">{p.dob}</Td>
                <Td><button onClick={() => navigate('/clinical')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">Add Note</button></Td>
              </tr>
            ))}
          </tbody>
        </DashTable>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
        <SectionHeader title="Recent Clinical Notes" action={
          <button onClick={() => navigate('/clinical')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</button>
        }/>
        <div className="text-center py-10 text-gray-400 dark:text-slate-500">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No clinical notes yet. Start by selecting a patient above.</p>
        </div>
      </div>
    </div>
  );
}
