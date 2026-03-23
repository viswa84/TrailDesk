import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Mountain, CalendarRange, BookOpen, Users, Navigation,
  Wallet, Megaphone, MessageCircle, Settings, X, ChevronLeft, Building2, Shield, Bot, Workflow
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/cities', label: 'Cities', icon: Building2 },
  { path: '/treks', label: 'Treks', icon: Mountain },
  { path: '/departures', label: 'Departures', icon: CalendarRange },
  { path: '/bookings', label: 'Bookings', icon: BookOpen },
  { path: '/participants', label: 'Participants', icon: Users },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/guides', label: 'Guides', icon: Navigation },
  { path: '/finance', label: 'Finance', icon: Wallet },
  { path: '/marketing', label: 'Marketing', icon: Megaphone },
  { path: '/support-chat', label: 'Support Chat', icon: MessageCircle },
  { path: '/whatsapp-flow', label: 'WhatsApp Flow', icon: Bot },
  { path: '/flow-builder',  label: 'Flow Builder',  icon: Workflow },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }) {
  const location = useLocation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

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

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 group
                    ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                    ${isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm shadow-primary-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {!collapsed && <span>{item.label}</span>}
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
