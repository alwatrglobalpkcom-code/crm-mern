const MODULE_ACCESS = {
  dashboard: ['admin', 'manager', 'agent'],
  clients: ['admin', 'manager', 'agent'],
  tasks: ['admin', 'manager', 'agent'],
  documents: ['admin', 'manager', 'agent'],
  users: ['admin'],
  teamusers: ['manager'],
  reports: ['admin', 'manager', 'agent'],
  settings: ['admin', 'manager', 'agent'],
  notifications: ['admin', 'manager', 'agent'],
  chat: ['manager', 'agent'],
  activitylogs: ['admin'],
  profile: ['admin', 'manager', 'agent']
};

export const canAccess = (user, module) => {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  return MODULE_ACCESS[module]?.includes(role) ?? false;
};
