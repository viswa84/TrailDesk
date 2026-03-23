import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { v, validateForm, onlyDigits } from '../utils/validators';
import { useQuery, useMutation } from '@apollo/client/react';
import { ME, MY_ORGANIZATION, GET_COMPANY_PROFILE } from '../graphql/queries';
import { UPDATE_PROFILE, UPDATE_ORGANIZATION, UPDATE_NOTIFICATION_PREFS, SAVE_COMPANY_PROFILE } from '../graphql/mutations';
import {
  Settings, User, Bell, Building2, Shield, Save, Loader2,
  Image, FileSignature, Upload, MapPin, Landmark, FileText, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import ArchitectureDoc from './ArchitectureDoc';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function getToken() {
  return localStorage.getItem('traildesk_token') || '';
}

async function uploadImage(file, type) {
  const fd = new FormData();
  fd.append(type === 'logo' ? 'logo' : 'signature', file);
  const res = await fetch(`${API_BASE}/api/company/upload-${type}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Upload failed');
  return json.url;
}

const COMPANY_EMPTY = {
  companyName: '', tagline: '', establishedYear: '', registrationNumber: '',
  gstNumber: '', panNumber: '', aboutUs: '',
  email: '', phone: '', altPhone: '', website: '',
  addressLine1: '', addressLine2: '', city: '', state: '', country: 'India', pincode: '',
  bankName: '', accountNumber: '', ifscCode: '', branchName: '', accountHolderName: '',
  pdfFooterText: '', termsAndConditions: '', cancellationPolicy: '',
  logoUrl: '', signatureUrl: '',
};

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  // ── Fetch real data from backend ──
  const { data: meData } = useQuery(ME);
  const { data: orgData } = useQuery(MY_ORGANIZATION);
  const { data: companyData } = useQuery(GET_COMPANY_PROFILE, { fetchPolicy: 'cache-and-network' });

  const [profile, setProfile] = useState({ name: '', email: '', phone: '', role: '' });
  const [org, setOrg] = useState({ name: '', gst: '', address: '', website: '' });
  const [notifs, setNotifs] = useState({
    newBooking: true, paymentReceived: true, batchFull: true,
    cancelation: true, lowSeats: false, marketing: false,
  });

  // ── Company Profile state ──────────────────────────────────────────────
  const [company, setCompany] = useState(COMPANY_EMPTY);
  const [logoPreview, setLogoPreview] = useState(null);
  const [sigPreview, setSigPreview] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [sigUploading, setSigUploading] = useState(false);
  const [companySaving, setCompanySaving] = useState(false);
  const [companySection, setCompanySection] = useState('brand'); // brand | contact | bank | pdf
  const logoInputRef = useRef(null);
  const sigInputRef = useRef(null);

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

  useEffect(() => {
    const p = companyData?.getCompanyProfile;
    if (!p) return;
    setCompany({
      companyName: p.companyName || '', tagline: p.tagline || '',
      establishedYear: p.establishedYear ? String(p.establishedYear) : '',
      registrationNumber: p.registrationNumber || '', gstNumber: p.gstNumber || '',
      panNumber: p.panNumber || '', aboutUs: p.aboutUs || '',
      email: p.email || '', phone: p.phone || '', altPhone: p.altPhone || '',
      website: p.website || '', addressLine1: p.addressLine1 || '',
      addressLine2: p.addressLine2 || '', city: p.city || '', state: p.state || '',
      country: p.country || 'India', pincode: p.pincode || '',
      bankName: p.bankName || '', accountNumber: p.accountNumber || '',
      ifscCode: p.ifscCode || '', branchName: p.branchName || '',
      accountHolderName: p.accountHolderName || '', pdfFooterText: p.pdfFooterText || '',
      termsAndConditions: p.termsAndConditions || '', cancellationPolicy: p.cancellationPolicy || '',
      logoUrl: p.logoUrl || '', signatureUrl: p.signatureUrl || '',
    });
    if (p.logoUrl) setLogoPreview(`${API_BASE}${p.logoUrl}`);
    if (p.signatureUrl) setSigPreview(`${API_BASE}${p.signatureUrl}`);
  }, [companyData]);

  // ── Mutations ──
  const [updateProfileMut] = useMutation(UPDATE_PROFILE);
  const [updateOrgMut] = useMutation(UPDATE_ORGANIZATION);
  const [updateNotifMut] = useMutation(UPDATE_NOTIFICATION_PREFS);
  const [saveCompanyMut] = useMutation(SAVE_COMPANY_PROFILE, {
    refetchQueries: [{ query: GET_COMPANY_PROFILE }],
  });

  // ── Company image upload handlers ────────────────────────────────────────
  const setC = (field) => (e) => setCompany((prev) => ({ ...prev, [field]: e.target.value }));

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);
    try {
      const url = await uploadImage(file, 'logo');
      setCompany((prev) => ({ ...prev, logoUrl: url }));
      setLogoPreview(`${API_BASE}${url}`);
    } catch (err) {
      toast.error(err.message);
      setLogoPreview(company.logoUrl ? `${API_BASE}${company.logoUrl}` : null);
    } finally { setLogoUploading(false); }
  };

  const handleSigChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSigPreview(URL.createObjectURL(file));
    setSigUploading(true);
    try {
      const url = await uploadImage(file, 'signature');
      setCompany((prev) => ({ ...prev, signatureUrl: url }));
      setSigPreview(`${API_BASE}${url}`);
    } catch (err) {
      toast.error(err.message);
      setSigPreview(company.signatureUrl ? `${API_BASE}${company.signatureUrl}` : null);
    } finally { setSigUploading(false); }
  };

  const handleCompanySave = async () => {
    if (!company.companyName.trim()) {
      toast.error('Company name is required');
      setCompanySection('brand');
      return;
    }
    setCompanySaving(true);
    try {
      const input = { ...company, establishedYear: company.establishedYear ? parseInt(company.establishedYear, 10) : null };
      Object.keys(input).forEach((k) => { if (input[k] === '') input[k] = null; });
      input.companyName = company.companyName.trim();
      await saveCompanyMut({ variables: { input } });
      toast.success('Company profile saved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to save company profile');
    } finally { setCompanySaving(false); }
  };

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
    <div className="space-y-6 animate-fade-in w-full max-w-3xl">
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
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label><input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} maxLength={10} className="input-field" /></div>
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
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label><input value={org.name} onChange={e => setOrg({ ...org, name: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label><input value={org.gst} onChange={e => setOrg({ ...org, gst: e.target.value })} className="input-field" /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Address</label><input value={org.address} onChange={e => setOrg({ ...org, address: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Website</label><input value={org.website} onChange={e => setOrg({ ...org, website: e.target.value })} className="input-field" /></div>
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
                  onClick={() => setNotifs({ ...notifs, [key]: !val })}
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

      {/* ── Company Profile ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-900 text-sm">Company Profile</h3>
              <span className="text-xs text-slate-400 font-normal">— used in PDFs &amp; invoices</span>
            </div>
            <button
              onClick={handleCompanySave}
              disabled={companySaving || logoUploading || sigUploading}
              className="btn-primary flex items-center gap-2 text-xs px-3 py-1.5"
            >
              {companySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {companySaving ? 'Saving…' : 'Save'}
            </button>
          </div>

          {/* Sub-section tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto">
            {[
              { id: 'brand',   label: 'Brand & Identity' },
              { id: 'contact', label: 'Contact & Address' },
              { id: 'bank',    label: 'Bank Details' },
              { id: 'pdf',     label: 'PDF & Legal' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setCompanySection(id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-150
                  ${companySection === id
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* Brand & Identity */}
          {companySection === 'brand' && (<>
            {/* Logo + Signature */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Logo</label>
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="relative flex items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all group overflow-hidden bg-slate-50"
                >
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium flex items-center gap-1"><Upload className="w-3 h-3" /> Change</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-400 group-hover:text-primary-500 transition-colors">
                      {logoUploading ? <Loader2 className="w-6 h-6 animate-spin text-primary-500" /> : <Image className="w-6 h-6" />}
                      <span className="text-xs font-medium">{logoUploading ? 'Uploading…' : 'Upload Logo'}</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, SVG · 5 MB</span>
                    </div>
                  )}
                  {logoUploading && logoPreview && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>}
                </div>
                <input ref={logoInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml" className="hidden" onChange={handleLogoChange} />
              </div>

              {/* Signature */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Authorized Signature</label>
                <div
                  onClick={() => sigInputRef.current?.click()}
                  className="relative flex items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all group overflow-hidden bg-slate-50"
                >
                  {sigPreview ? (
                    <>
                      <img src={sigPreview} alt="Signature" className="max-h-full max-w-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium flex items-center gap-1"><Upload className="w-3 h-3" /> Change</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-400 group-hover:text-primary-500 transition-colors">
                      {sigUploading ? <Loader2 className="w-6 h-6 animate-spin text-primary-500" /> : <FileSignature className="w-6 h-6" />}
                      <span className="text-xs font-medium">{sigUploading ? 'Uploading…' : 'Upload Signature'}</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, SVG · 3 MB</span>
                    </div>
                  )}
                  {sigUploading && sigPreview && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>}
                </div>
                <input ref={sigInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml" className="hidden" onChange={handleSigChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                <input value={company.companyName} onChange={setC('companyName')} className="input-field" placeholder="e.g. Sahyadri Treks Pvt. Ltd." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
                <input value={company.tagline} onChange={setC('tagline')} className="input-field" placeholder="e.g. Discover the Trails" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Established Year</label>
                <input type="number" value={company.establishedYear} onChange={setC('establishedYear')} className="input-field" placeholder="e.g. 2015" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label>
                <input value={company.gstNumber} onChange={setC('gstNumber')} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PAN Number</label>
                <input value={company.panNumber} onChange={setC('panNumber')} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
                <input value={company.registrationNumber} onChange={setC('registrationNumber')} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">About Us</label>
                <textarea value={company.aboutUs} onChange={setC('aboutUs')} rows={3} className="input-field resize-none" placeholder="Brief description shown on documents…" />
              </div>
            </div>
          </>)}

          {/* Contact & Address */}
          {companySection === 'contact' && (<>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={company.email} onChange={setC('email')} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input type="tel" value={company.phone} onChange={setC('phone')} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Alternate Phone</label><input type="tel" value={company.altPhone} onChange={setC('altPhone')} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Website</label><input type="url" value={company.website} onChange={setC('website')} className="input-field" placeholder="https://yourcompany.com" /></div>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2">Address</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1</label><input value={company.addressLine1} onChange={setC('addressLine1')} className="input-field" /></div>
              <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2</label><input value={company.addressLine2} onChange={setC('addressLine2')} className="input-field" placeholder="Landmark, area (optional)" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">City</label><input value={company.city} onChange={setC('city')} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">State</label><input value={company.state} onChange={setC('state')} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Country</label><input value={company.country} onChange={setC('country')} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">PIN Code</label><input value={company.pincode} onChange={setC('pincode')} className="input-field" /></div>
            </div>
          </>)}

          {/* Bank Details */}
          {companySection === 'bank' && (<>
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              These details are printed on payment invoices and receipts.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label><input value={company.bankName} onChange={setC('bankName')} className="input-field" placeholder="e.g. HDFC Bank" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Account Holder Name</label><input value={company.accountHolderName} onChange={setC('accountHolderName')} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label><input value={company.accountNumber} onChange={setC('accountNumber')} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">IFSC Code</label><input value={company.ifscCode} onChange={setC('ifscCode')} className="input-field" placeholder="e.g. HDFC0001234" /></div>
              <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Branch Name</label><input value={company.branchName} onChange={setC('branchName')} className="input-field" /></div>
            </div>
          </>)}

          {/* PDF & Legal */}
          {companySection === 'pdf' && (
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">PDF Footer Text</label><input value={company.pdfFooterText} onChange={setC('pdfFooterText')} className="input-field" placeholder="e.g. Thank you for choosing us!" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Terms &amp; Conditions</label><textarea value={company.termsAndConditions} onChange={setC('termsAndConditions')} rows={6} className="input-field resize-none" placeholder="Booking T&C shown on invoices…" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Cancellation Policy</label><textarea value={company.cancellationPolicy} onChange={setC('cancellationPolicy')} rows={6} className="input-field resize-none" placeholder="Cancellation and refund policy…" /></div>
            </div>
          )}
        </div>
      </div>

      {(user?.role === 'admin' || user?.role === 'superadmin') && (
        <ArchitectureDoc />
      )}
    </div>
  );
}
