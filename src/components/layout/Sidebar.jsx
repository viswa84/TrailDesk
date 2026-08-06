import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import {
  LayoutDashboard, Mountain, CalendarRange, BookOpen, Users, Navigation,
  Wallet, Megaphone, MessageCircle, Settings, X, ChevronLeft, Building2, Shield, Bot, Workflow, BarChart2, Tag, Send, FileText, Contact, Gift, Database, TrendingUp, Star, Cpu, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MANUAL_PAYMENT_PENDING_COUNT } from '../../graphql/queries';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/cities', label: 'Cities', icon: Building2 },
  { path: '/treks', label: 'Treks', icon: Mountain },
  { path: '/departures', label: 'Departures', icon: CalendarRange },
  { path: '/bookings', label: 'Bookings', icon: BookOpen },
  // badgeKey drives the unread-style counter — see pendingPayments below.
  { path: '/payment-verification', label: 'Payment Verification', icon: ShieldCheck, badgeKey: 'pendingPayments' },
  { path: '/participants', label: 'Participants', icon: Users },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/contacts', label: 'Contacts', icon: Contact },
  { path: '/guides', label: 'Guides', icon: Navigation },
  { path: '/finance', label: 'Finance', icon: Wallet },
  { path: '/marketing', label: 'Marketing', icon: Megaphone },
  { path: '/broadcast', label: 'Broadcast', icon: Send },
  { path: '/templates', label: 'Templates', icon: FileText },
  { path: '/support-chat', label: 'WhatsApp Chat', icon: MessageCircle },
  { path: '/whatsapp-flow', label: 'WhatsApp Flow', icon: Bot },
  { path: '/ai-logs', label: 'AI Logs', icon: Database },
  { path: '/ai-usage', label: 'AI Usage', icon: Cpu },
  { path: '/flow-builder',  label: 'Flow Builder',  icon: Workflow },
  { path: '/traffic',  label: 'Traffic',  icon: BarChart2 },
  { path: '/growth',   label: 'Growth',   icon: TrendingUp },
  { path: '/coupons', label: 'Coupons', icon: Tag },
  { path: '/referrals', label: 'Referrals', icon: Gift },
  { path: '/reviews', label: 'Reviews', icon: Star },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }) {
  const location = useLocation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  // Manual UPI payments waiting on a human. Polled rather than socket-driven:
  // the sidebar is always mounted, and a stale-by-a-minute badge is fine.
  // errorPolicy 'ignore' so a company with no UPI provider never sees an error.
  const { data: pendingData } = useQuery(MANUAL_PAYMENT_PENDING_COUNT, {
    pollInterval: 60000,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'ignore',
  });
  const badgeCounts = {
    pendingPayments: pendingData?.manualPaymentPendingCount || 0,
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-slate-200/80 z-50 transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-0
          ${collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'}
          w-[280px]
        `}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-slate-100 shrink-0 ${collapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            {!collapsed && <span className="text-lg font-bold text-slate-900 tracking-tight">TrekOps</span>}
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              const badge = item.badgeKey ? badgeCounts[item.badgeKey] : 0;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 group
                    ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                    ${isActive
                      ? 'bg-secondary-50 text-secondary-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <div className="relative shrink-0">
                    <Icon className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-secondary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {/* Collapsed rail has no room for a label, so the count
                        becomes a dot on the icon itself. */}
                    {collapsed && badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                    )}
                  </div>
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                  {!collapsed && badge > 0 && (
                    <span className="px-1.5 py-0.5 text-[11px] font-semibold bg-red-100 text-red-700 rounded-full">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Super Admin link — visible only to superadmin role */}
          {isSuperAdmin && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              {!collapsed && (
                <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  Platform
                </p>
              )}
              <NavLink
                to="/superadmin"
                onClick={onClose}
                title={collapsed ? 'Super Admin' : undefined}
                className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                  ${location.pathname.startsWith('/superadmin')
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                  }
                `}
              >
                <Shield className={`w-[18px] h-[18px] shrink-0 ${location.pathname.startsWith('/superadmin') ? 'text-violet-600' : 'text-slate-400 group-hover:text-violet-500'}`} />
                {!collapsed && <span>Super Admin</span>}
              </NavLink>
            </div>
          )}
        </nav>

        {/* Collapse Toggle (desktop only) */}
        <div className={`hidden lg:flex border-t border-slate-100 p-3 ${collapsed ? 'justify-center' : ''}`}>
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>
    </>
  );
}
