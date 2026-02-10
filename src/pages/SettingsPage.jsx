import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, User, Bell, Building2, Shield, Save } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || 'Admin User',
    email: 'admin@traildesk.in',
    phone: user?.phone || '',
    role: 'Administrator',
  });
  const [org, setOrg] = useState({
    name: 'TrailDesk Adventures',
    gst: '27AABCT1234F1Z5',
    address: '204, Mountain View Complex, Rishikesh, Uttarakhand - 249201',
    website: 'www.traildesk.in',
  });
  const [notifs, setNotifs] = useState({
    newBooking: true, paymentReceived: true, batchFull: true,
    cancelation: true, lowSeats: false, marketing: false,
  });

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div><h1 className="page-title">Settings</h1><p className="page-subtitle mt-1">Manage your account and preferences</p></div>

      {saved && (
        <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium animate-fade-in border border-emerald-200">
          ✓ Settings saved successfully
        </div>
      )}

      {/* Profile */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-slate-900 text-sm">Profile Settings</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-emerald-400 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md">
              {profile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div><p className="font-semibold text-slate-900">{profile.name}</p><p className="text-sm text-slate-500">{profile.role}</p></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label><input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Role</label><input value={profile.role} disabled className="input-field bg-slate-50 cursor-not-allowed" /></div>
          </div>
        </div>
      </div>

      {/* Organization */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-slate-900 text-sm">Organization</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label><input value={org.name} onChange={e => setOrg({...org, name: e.target.value})} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label><input value={org.gst} onChange={e => setOrg({...org, gst: e.target.value})} className="input-field" /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Address</label><input value={org.address} onChange={e => setOrg({...org, address: e.target.value})} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Website</label><input value={org.website} onChange={e => setOrg({...org, website: e.target.value})} className="input-field" /></div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-slate-900 text-sm">Notification Preferences</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {Object.entries(notifs).map(([key, val]) => (
              <label key={key} className="flex items-center justify-between py-2 cursor-pointer group">
                <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                </span>
                <button
                  type="button"
                  onClick={() => setNotifs({...notifs, [key]: !val})}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${val ? 'bg-primary-600' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${val ? 'translate-x-5' : ''}`} />
                </button>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</button>
      </div>
    </div>
  );
}
