import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_NOTIFICATIONS } from '../../graphql/queries';
import { MARK_NOTIFICATION_READ, MARK_ALL_NOTIFICATIONS_READ } from '../../graphql/mutations';
import {
  Search, Bell, Plus, Menu, ChevronDown, LogOut, User,
  BookOpen, Mountain, CalendarRange
} from 'lucide-react';

export default function TopBar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef(null);
  const quickRef = useRef(null);
  const profileRef = useRef(null);

  // ── GraphQL: fetch notifications ──
  const { data: notifData } = useQuery(GET_NOTIFICATIONS, { pollInterval: 30000 });
  const notifications = notifData?.getNotifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const [markRead] = useMutation(MARK_NOTIFICATION_READ, {
    refetchQueries: [{ query: GET_NOTIFICATIONS }],
  });
  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
    refetchQueries: [{ query: GET_NOTIFICATIONS }],
  });

  // compute relative time from ISO string
  const timeAgo = (isoStr) => {
    if (!isoStr) return '';
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (quickRef.current && !quickRef.current.contains(e.target)) setShowQuickActions(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const quickActions = [
    { label: 'New Booking', icon: BookOpen, action: () => navigate('/bookings?action=new') },
    { label: 'New Trek', icon: Mountain, action: () => navigate('/treks?action=new') },
    { label: 'New Departure', icon: CalendarRange, action: () => navigate('/departures?action=new') },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left - Menu + Search */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          <div className="hidden sm:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookings, treks, customers..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:bg-white focus:border-slate-200 focus:ring-2 focus:ring-primary-500/10 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Quick Actions */}
          <div className="relative" ref={quickRef}>
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="btn-primary flex items-center gap-1.5 px-3 py-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Action</span>
            </button>

            {showQuickActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 animate-scale-in">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => { action.action(); setShowQuickActions(false); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <action.icon className="w-4 h-4 text-slate-400" />
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg animate-scale-in">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead()}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-400">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => { if (!n.read) markRead({ variables: { id: n._id } }); }}
                        className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-primary-50/30' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-slate-100">
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-emerald-400 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {user?.avatar || 'AU'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 animate-scale-in">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.role} • {user?.phone}</p>
                </div>
                <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <User className="w-4 h-4 text-slate-400" />
                  Profile Settings
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
