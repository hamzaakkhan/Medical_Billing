// Role-based permission matrix for the application
// Strictly aligned with existing backend capabilities (Users CRUD for Admin, Patients CRUD for Receptionist, Patients View-Only for Admin)

export const ROLES = {
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  DOCTOR: 'doctor',
  CODER: 'coder',
  BILLER: 'biller',
};

// Navigation items per completed role
export const NAV_CONFIG = {
  admin: [
    { id: '/',             label: 'Dashboard',            icon: 'LayoutDashboard' },
    { id: '/appointments', label: 'Appointments',         icon: 'Calendar', badge: 'View Only' },
    { id: '/users',        label: 'Staff & Users',        icon: 'Users' },
    { id: '/patients',     label: 'Patient Directory',    icon: 'UserRound', badge: 'View Only' },
  ],
  receptionist: [
    { id: '/',             label: 'Dashboard',            icon: 'LayoutDashboard' },
    { id: '/appointments', label: 'Appointments',         icon: 'Calendar' },
    { id: '/patients',     label: 'Patients',             icon: 'UserRound' },
  ],
  doctor: [
    { id: '/',             label: 'Dashboard',            icon: 'LayoutDashboard' },
    { id: '/appointments', label: 'My Appointments',      icon: 'Calendar' },
  ],
};

// Permissions per role per resource
export const PERMISSIONS = {
  admin: {
    appointments: { view: true, create: false, edit: false, delete: false },
    patients:     { view: true, create: false, edit: false, delete: false },
    users:        { view: true, create: true,  edit: true,  delete: true  },
  },
  receptionist: {
    appointments: { view: true, create: true,  edit: true,  delete: true  },
    patients:     { view: true, create: true,  edit: true,  delete: true  },
    users:        { view: false, create: false, edit: false, delete: false },
  },
  doctor: {
    appointments: { view: true, create: true,  edit: true,  delete: false },
    patients:     { view: true, create: false, edit: false, delete: false },
    users:        { view: false, create: false, edit: false, delete: false },
  },
};

export const canDo = (role, resource, action) => {
  return PERMISSIONS[role]?.[resource]?.[action] === true;
};

// Role display labels (matches backend role_name enum)
export const ROLE_LABELS = {
  admin:        { label: 'System Admin',   badge: 'ADMIN',      color: 'bg-violet-50 text-violet-700 border border-violet-200' },
  receptionist: { label: 'Receptionist',   badge: 'RECEPTION',  color: 'bg-blue-50 text-blue-700 border border-blue-200' },
  doctor:       { label: 'Doctor',         badge: 'DOCTOR',     color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  coder:        { label: 'Medical Coder',  badge: 'CODER',      color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  biller:       { label: 'Medical Biller', badge: 'BILLER',     color: 'bg-rose-50 text-rose-700 border border-rose-200' },
};
