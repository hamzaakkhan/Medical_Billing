// Role-based permission matrix for the entire application
// Each role defines what pages they can see and what actions they can take

export const ROLES = {
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  DOCTOR: 'doctor',
  CODER: 'coder',
  BILLER: 'biller',
};

// Navigation items per role
export const NAV_CONFIG = {
  admin: [
    { id: '/',        label: 'Dashboard',        icon: 'LayoutDashboard', group: 'main' },
    { id: '/users',   label: 'Users',            icon: 'Users',           group: 'main', badge: 'Active' },
    { id: '/patients',label: 'Patients',         icon: 'UserRound',       group: 'main', badge: 'View Only' },
    { id: '/invoices',label: 'Invoices',         icon: 'FileText',        group: 'finance' },
    { id: '/payers',  label: 'Payers',           icon: 'Building2',       group: 'finance' },
    { id: '/reports', label: 'Reports',          icon: 'BarChart3',       group: 'finance' },
    { id: '/settings',label: 'Settings',         icon: 'Settings',        group: 'bottom' },
  ],
  receptionist: [
    { id: '/',           label: 'Dashboard',      icon: 'LayoutDashboard', group: 'main' },
    { id: '/schedule',   label: 'Schedule',       icon: 'CalendarCheck',   group: 'main' },
    { id: '/patients',   label: 'Patients',       icon: 'UserRound',       group: 'main', badge: 'Active' },
    { id: '/insurers',   label: 'Insurers',       icon: 'ShieldCheck',     group: 'main', badge: 'View Only' },
    { id: '/settings',   label: 'Settings',       icon: 'Settings',        group: 'bottom' },
  ],
  doctor: [
    { id: '/',          label: 'Dashboard',       icon: 'LayoutDashboard', group: 'main' },
    { id: '/patients',  label: 'Patients',        icon: 'UserRound',       group: 'main', badge: 'View Only' },
    { id: '/clinical',  label: 'Clinical Notes',  icon: 'ClipboardList',   group: 'main' },
    { id: '/settings',  label: 'Settings',        icon: 'Settings',        group: 'bottom' },
  ],
  coder: [
    { id: '/',          label: 'Dashboard',       icon: 'LayoutDashboard', group: 'main' },
    { id: '/patients',  label: 'Patients',        icon: 'UserRound',       group: 'main', badge: 'View Only' },
    { id: '/coding',    label: 'Medical Coding',  icon: 'Code2',           group: 'main' },
    { id: '/settings',  label: 'Settings',        icon: 'Settings',        group: 'bottom' },
  ],
  biller: [
    { id: '/',          label: 'Dashboard',       icon: 'LayoutDashboard', group: 'main' },
    { id: '/invoices',  label: 'Invoices',        icon: 'FileText',        group: 'finance' },
    { id: '/payers',    label: 'Payers',          icon: 'Building2',       group: 'finance' },
    { id: '/claims',    label: 'Claims',          icon: 'ClipboardCheck',  group: 'finance' },
    { id: '/denials',   label: 'Denials',         icon: 'XCircle',         group: 'finance' },
    { id: '/settings',  label: 'Settings',        icon: 'Settings',        group: 'bottom' },
  ],
};

// Permissions per role per resource
export const PERMISSIONS = {
  admin: {
    patients:  { view: true,  create: false, edit: false,  delete: false },
    users:     { view: true,  create: true,  edit: true,   delete: true  },
    invoices:  { view: true,  create: false, edit: false,  delete: false },
    payers:    { view: true,  create: false, edit: false,  delete: false },
    reports:   { view: true },
  },
  receptionist: {
    patients:  { view: true,  create: true,  edit: true,   delete: true  },
    schedule:  { view: true,  create: true,  edit: true,   delete: true  },
    insurers:  { view: true,  create: false, edit: false,  delete: false },
  },
  doctor: {
    patients:  { view: true,  create: false, edit: false,  delete: false },
    clinical:  { view: true,  create: true,  edit: true,   delete: false },
  },
  coder: {
    patients:  { view: true,  create: false, edit: false,  delete: false },
    coding:    { view: true,  create: true,  edit: true,   delete: false },
  },
  biller: {
    invoices:  { view: true,  create: true,  edit: true,   delete: false },
    payers:    { view: true,  create: false, edit: false,  delete: false },
    claims:    { view: true,  create: true,  edit: true,   delete: false },
    denials:   { view: true,  create: false, edit: true,   delete: false },
  },
};

export const canDo = (role, resource, action) => {
  return PERMISSIONS[role]?.[resource]?.[action] === true;
};

// Role display labels
export const ROLE_LABELS = {
  admin:        { label: 'System Admin',       badge: 'ADMIN',      color: 'bg-violet-100 text-violet-700' },
  receptionist: { label: 'Front Desk',         badge: 'RECEPTION',  color: 'bg-blue-100 text-blue-700' },
  doctor:       { label: 'Physician',          badge: 'DOCTOR',     color: 'bg-green-100 text-green-700' },
  coder:        { label: 'Medical Coder',      badge: 'CODER',      color: 'bg-amber-100 text-amber-700' },
  biller:       { label: 'Medical Biller',     badge: 'BILLER',     color: 'bg-rose-100 text-rose-700' },
};
