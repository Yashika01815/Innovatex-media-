import type { AuthRole } from '@/types/auth';

export interface NavItem {
  label: string;
  path: string;
  icon: string; // lucide icon name
  superAdminOnly?: boolean;
  group?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', group: 'Revenue' },
  { label: 'Leads', path: '/leads', icon: 'Users', group: 'Revenue' },
  { label: 'WhatsApp Panel', path: '/whatsapp', icon: 'MessageCircle', group: 'Revenue' },
  { label: 'AI Qualification', path: '/qualification', icon: 'Sparkles', group: 'Revenue' },
  { label: 'Pipeline', path: '/pipeline', icon: 'KanbanSquare', group: 'Revenue' },
  { label: 'Nurture', path: '/nurture', icon: 'Workflow', group: 'Revenue' },
  { label: 'Calendar / Bookings', path: '/bookings', icon: 'CalendarDays', group: 'Revenue' },
  { label: 'Call Intelligence', path: '/calls', icon: 'PhoneCall', group: 'Revenue' },
  { label: 'Attribution', path: '/attribution', icon: 'Network', group: 'Growth' },
  { label: 'Campaigns', path: '/campaigns', icon: 'Megaphone', group: 'Growth' },
  { label: 'Payments', path: '/payments', icon: 'CreditCard', group: 'Growth' },
  { label: 'Reports', path: '/reports', icon: 'BarChart3', group: 'Growth' },
  { label: 'Automations', path: '/automations', icon: 'Zap', group: 'Growth' },
  { label: 'Templates', path: '/templates', icon: 'FileText', group: 'Growth' },
  { label: 'Team', path: '/team', icon: 'UserCog', group: 'Admin' },
  { label: 'Integrations', path: '/integrations', icon: 'Plug', group: 'Admin' },
  { label: 'Settings', path: '/settings', icon: 'Settings', group: 'Admin' },
  { label: 'Super Admin Panel', path: '/super-admin', icon: 'ShieldCheck', superAdminOnly: true, group: 'Admin' },
];

export function visibleNav(role: AuthRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.superAdminOnly || role === 'super_admin');
}
