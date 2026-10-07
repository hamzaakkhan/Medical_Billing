import React from 'react';
import { UserPlus, CheckCircle, Clock, AlertTriangle, ShieldOff } from 'lucide-react';
import { StatCard, SkeletonCard, SectionHeader, StatusBadge, DashTable, Th, Td } from './DashWidgets';

const TODAY_APPOINTMENTS = [
  { patient: 'Jane Smith',  time: '08:30 AM', status: 'Checked In', doctor: 'Dr. Amanda Chen', insurer: 'Aetna' },
  { patient: 'Mark Davis',  time: '08:30 AM', status: 'Checked In', doctor: 'Dr. Amanda Chen', insurer: 'Aetna' },
  { patient: 'Mark Davis',  time: '09:30 AM', status: 'In Session',  doctor: 'Dr. Amanda Chen', insurer: 'Aetna' },
  { patient: 'Jane Smith',  time: '09:30 AM', status: 'Scheduled',   doctor: 'Dr. Amanda Chen', insurer: 'Aetna' },
  { patient: 'Mark Davis',  time: '09:30 AM', status: 'Scheduled',   doctor: 'Dr. Amanda Chen', insurer: 'Aetna' },
  { patient: 'Jane Smith',  time: '09:30 AM', status: 'Scheduled',   doctor: 'Dr. Amanda Chen', insurer: 'Aetna' },
];

const INSURERS = [
  { name: 'BlueCross', status: 'Active' },
  { name: 'Aetna',     status: 'Active' },
  { name: 'Cigna',     status: 'Active' },
];

export default function ReceptionistDashboard({ patients, isLoading, navigate }) {
  const totalPatients   = patients.length;
  const recentPatients  = [...patients].slice(-4).reverse();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Scheduling & Registration</h1>
          <p className="text-sm text-gray-500 mt-0.5">Today's patient intake, appointments & check-ins</p>
        </div>
        <button
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Register Patient
        </button>
      </div>

      {/* Today's status bar */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Today's Status</p>
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="pr-6">
              <p className="text-3xl font-extrabold text-gray-900">14</p>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" />Active Check-ins</p>
            </div>
            <div className="px-6">
              <p className="text-3xl font-extrabold text-gray-900">8</p>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3 text-blue-500" />Pending Appointments</p>
            </div>
            <div className="pl-6">
              <p className="text-3xl font-extrabold text-amber-600">2</p>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" />Uninsured/Action Required</p>
            </div>
          </div>
        </div>
      )}

      {/* Appointments table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <SectionHeader title="Today's Appointments & Check-In Schedule" />
        <DashTable>
          <thead>
            <tr>
              <Th>Patient Name</Th>
              <Th>Time</Th>
              <Th>Status</Th>
              <Th>Doctor</Th>
              <Th>Insurer</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {TODAY_APPOINTMENTS.map((a, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <Td><span className="font-medium text-gray-900">{a.patient}</span></Td>
                <Td className="text-gray-500 font-medium">{a.time}</Td>
                <Td><StatusBadge status={a.status} /></Td>
                <Td>{a.doctor}</Td>
                <Td>{a.insurer}</Td>
                <Td>
                  <button className="text-[11px] font-semibold text-blue-600 hover:underline">Edit Details</button>
                </Td>
              </tr>
            ))}
          </tbody>
        </DashTable>
      </div>

      {/* Recent registrations + insurer quick view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <SectionHeader
            title="Recent Patient Registrations"
            action={
              <button onClick={() => navigate('/patients')} className="text-xs text-blue-600 hover:underline">View all ({totalPatients})</button>
            }
          />
          <DashTable>
            <thead>
              <tr>
                <Th>Patient</Th>
                <Th>Phone</Th>
                <Th>Date Registered</Th>
              </tr>
            </thead>
            <tbody>
              {recentPatients.length === 0 && (
                <tr><Td colSpan={3} className="text-center py-5 text-gray-400">No patients yet.</Td></tr>
              )}
              {recentPatients.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <Td><span className="font-medium text-gray-900">{p.first_name} {p.last_name}</span></Td>
                  <Td>{p.phone}</Td>
                  <Td className="text-gray-500">{p.dob}</Td>
                </tr>
              ))}
            </tbody>
          </DashTable>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <SectionHeader title="Quick Insurer View" />
          <div className="space-y-2">
            <div className="flex text-[11px] font-bold text-gray-400 uppercase px-2">
              <span className="flex-1">Carrier</span>
              <span>Validation</span>
            </div>
            {INSURERS.map((ins) => (
              <div key={ins.name} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-800">{ins.name}</span>
                <span className="text-xs font-semibold text-emerald-600">{ins.status}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/insurers')}
            className="mt-3 w-full text-xs text-center text-blue-600 hover:underline py-1"
          >
            Manage all insurers →
          </button>
        </div>
      </div>
    </div>
  );
}
