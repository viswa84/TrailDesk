import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { v, validateForm, onlyDigits } from '../utils/validators';
import { useQuery, useMutation } from '@apollo/client/react';
import { ME, MY_ORGANIZATION } from '../graphql/queries';
import { UPDATE_PROFILE, UPDATE_ORGANIZATION, UPDATE_NOTIFICATION_PREFS } from '../graphql/mutations';
import { Settings, User, Bell, Building2, Shield, Save, Loader2 } from 'lucide-react';
import ArchitectureDoc from './ArchitectureDoc';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  // ── Fetch real data from backend ──
  const { data: meData } = useQuery(ME);
  const { data: orgData } = useQuery(MY_ORGANIZATION);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
  });
  const [org, setOrg] = useState({
    name: '',
    gst: '',
    address: '',
    website: '',
  });
  const [notifs, setNotifs] = useState({
    newBooking: true,
    paymentReceived: true,
    batchFull: true,
    cancelation: true,
    lowSeats: false,
    marketing: false,
  });

  // Populate from server data when it loads
  useEffect(() => {
    if (meData?.me) {
      setProfile({
        name: meData.me.name || '',
        email: meData.me.email || '',
        phone: meData.me.phone || '',
        role: meData.me.role === 'superadmin' ? 'Super Admin' : meData.me.role === 'admin' ? 'Administrator' : 'Staff',
      });
      if (meData.me.notificationPrefs) {
        setNotifs(meData.me.notificationPrefs);
      }
    }
  }, [meData]);

  useEffect(() => {
    if (orgData?.myOrganization) {
      setOrg({
        name: orgData.myOrganization.name || '',
        gst: orgData.myOrganization.gst || '',
        address: orgData.myOrganization.address || '',
        website: orgData.myOrganization.website || '',
      });
    }
  }, [orgData]);

  // ── Mutations ──
  const [updateProfileMut] = useMutation(UPDATE_PROFILE);
  const [updateOrgMut] = useMutation(UPDATE_ORGANIZATION);
  const [updateNotifMut] = useMutation(UPDATE_NOTIFICATION_PREFS);

  const handleSave = async () => {
    // Validate profile fields
    const { valid, errors: errs } = validateForm({
      name: v.required(profile.name, 'Name'),
      phone: v.phone(profile.phone),
      email: v.emailOptional(profile.email),
    });
    if (!valid) {
      const firstError = Object.values(errs).find(Boolean);
      toast.error(firstError || 'Please fix the form errors');
      return;
    }
    setSaving(true);
    try {
      // Update profile
      const { data: profileRes } = await updateProfileMut({
        variables: {
          input: { name: profile.name, email: profile.email, phone: profile.phone },
        },
      });
      // Update local auth context
      if (profileRes?.updateProfile) {
        updateUser({
          name: profileRes.updateProfile.name,
          email: profileRes.updateProfile.email,
          phone: profileRes.updateProfile.phone,
          avatar: profileRes.updateProfile.avatar,
        });
      }

      // Update organization
      await updateOrgMut({
        variables: {
          input: { name: org.name, gst: org.gst, address: org.address, website: org.website },
        },
      });

      // Update notification prefs
      await updateNotifMut({
        variables: {
          input: {
            newBooking: notifs.newBooking,
            paymentReceived: notifs.paymentReceived,
            batchFull: notifs.batchFull,
            cancelation: notifs.cancelation,
            lowSeats: notifs.lowSeats,
            marketing: notifs.marketing,
          },
        },
      });

      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div><h1 className="page-title">Settings</h1><p className="page-subtitle mt-1">Manage your account and preferences</p></div>



      {/* Profile */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-slate-900 text-sm">Profile Settings</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-emerald-400 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md">
              {profile.name ? profile.name.split(' ').map(n => n[0]).join('') : 'AU'}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{profile.name || 'Loading...'}</p>
              <p className="text-sm text-slate-500">{profile.role}</p>
            </div>
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
            {Object.entries(notifs).filter(([key]) => key !== '__typename').map(([key, val]) => (
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
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {(user?.role === 'admin' || user?.role === 'superadmin') && (
        <ArchitectureDoc />
      )}
    </div>
  );
}
