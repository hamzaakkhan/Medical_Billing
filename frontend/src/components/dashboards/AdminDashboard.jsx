import React from 'react';
import { Users, FileText, Building2, TrendingUp, DollarSign, AlertCircle, UserPlus, Eye } from 'lucide-react';
import { StatCard, SkeletonCard, SectionHeader, StatusBadge, DashTable, Th, Td } from './DashWidgets';

// Placeholder chart bars (visual-only)
function MiniBarChart({ data }) {
  const max = Math.max(...data.map(d => d.val));
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-sm bg-blue-500 opacity-80"
            style={{ height: `${(d.val / max) * 52}px` }}
          />
          <span className="text-[9px] text-gray-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

const REVENUE_CHART = [
  { label:'Jan', val:72000 }, { label:'Feb', val:61000 }, { label:'Mar', val:84000 },
  { label:'Apr', val:79000 }, { label:'May', val:91000 }, { label:'Jun', val:76000 },
  { label:'Jul', val:88000 }, { label:'Aug', val:95000 }, { label:'Sep', val:83000 },
  { label:'Oct', val:72000 },
];

const SAMPLE_USERS = [
  { name: 'Dr. Amanda Chen',  role: 'Admin',        lastActive: '13 months ago' },
  { name: 'Alex Rivera',      role: 'Receptionist', lastActive: 'Aug 18, 2023' },
  { name: 'Jane Smith',       role: 'Biller',       lastActive: '23 days ago' },
  { name: 'Dr. Amolituetn',   role: 'Doctor',       lastActive: '1 day ago' },
  { name: 'Mark Torres',      role: 'Coder',        lastActive: '2 days ago' },
];

export default function AdminDashboard({ patients, isLoading, navigate }) {
  const totalPatients = patients.length;
  const recentPatients = [...patients].slice(-5).reverse();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Revenue & Finance + User Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">System-wide overview — admin access only</p>
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total MTD Billings"
            value="$845,920"
            sub="Month to date"
            icon={DollarSign}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
          <StatCard
            label="Net Received"
            value={<span className="text-emerald-600">$612,400</span>}
            sub="Collections received"
            trend="vs last month"
            trendUp={true}
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            label="AR Days"
            value="30.7"
            sub="Average days outstanding"
            icon={AlertCircle}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            label="Outstanding Denials"
            value="1.8%"
            sub="Of total claims"
            icon={FileText}
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
        </div>
      )}

      {/* Revenue chart + collection rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">Monthly Revenue vs Collections</h3>
            <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-1 rounded-md">— Billed  — Trend</span>
          </div>
          <MiniBarChart data={REVENUE_CHART} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Collection Rate</p>
            <p className="text-4xl font-extrabold text-gray-900 mt-2">84.8<span className="text-2xl">%</span></p>
            <p className="text-xs text-gray-400 mt-1">Keep it above realistic targets</p>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '84.8%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0%</span><span>Target: 90%</span><span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Patients & Invoices quick view */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <SectionHeader
          title="Patients, Invoices & Payers (View-Only)"
          action={
            <div className="flex gap-2">
              <button onClick={() => navigate('/patients')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Eye className="w-3 h-3" /> View Patients ({totalPatients})
              </button>
              <button onClick={() => navigate('/invoices')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Eye className="w-3 h-3" /> View Invoices
              </button>
            </div>
          }
        />
        <div className="overflow-x-auto">
          <DashTable>
            <thead>
              <tr>
                <Th>Patient Name</Th>
                <Th>Phone</Th>
                <Th>Email</Th>
                <Th>City</Th>
                <Th>DOB</Th>
              </tr>
            </thead>
            <tbody>
              {recentPatients.length === 0 && (
                <tr><Td className="text-center py-6 text-gray-400" colSpan={5}>No patients registered yet.</Td></tr>
              )}
              {recentPatients.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <Td><span className="font-medium text-gray-900">{p.first_name} {p.last_name}</span></Td>
                  <Td>{p.phone}</Td>
                  <Td>{p.email}</Td>
                  <Td>{p.city}, {p.state}</Td>
                  <Td>{p.dob}</Td>
                </tr>
              ))}
            </tbody>
          </DashTable>
        </div>
      </div>

      {/* User management */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <SectionHeader
          title="User Management"
          action={
            <button
              onClick={() => navigate('/users')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add New User
            </button>
          }
        />
        <DashTable>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Last Active</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_USERS.map((u, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <Td><span className="font-medium text-gray-900">{u.name}</span></Td>
                <Td>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                    u.role === 'Admin' ? 'bg-violet-100 text-violet-700' :
                    u.role === 'Receptionist' ? 'bg-blue-100 text-blue-700' :
                    u.role === 'Doctor' ? 'bg-green-100 text-green-700' :
                    u.role === 'Biller' ? 'bg-rose-100 text-rose-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{u.role}</span>
                </Td>
                <Td className="text-gray-500">{u.lastActive}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <button className="text-[11px] font-semibold text-blue-600 hover:underline">Edit Permissions</button>
                    <button className="text-[11px] font-semibold text-red-500 hover:underline">Delete</button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </DashTable>
      </div>
    </div>
  );
}
