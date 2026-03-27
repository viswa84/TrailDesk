import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Building2, Save, Loader2, Image, FileSignature,
  Phone, Mail, Globe, MapPin, Landmark, FileText, Info, X, CheckCircle
} from 'lucide-react';
import { GET_COMPANY_PROFILE } from '../graphql/queries';
import { SAVE_COMPANY_PROFILE } from '../graphql/mutations';
import FileUpload from '../components/ui/FileUpload';

const TABS = [
  { id: 'brand',   label: 'Brand & Identity',  icon: Building2 },
  { id: 'contact', label: 'Contact & Address',  icon: MapPin },
  { id: 'bank',    label: 'Bank Details',       icon: Landmark },
  { id: 'pdf',     label: 'PDF & Legal',        icon: FileText },
];

const EMPTY = {
  companyName: '', tagline: '', establishedYear: '', registrationNumber: '',
  gstNumber: '', panNumber: '', aboutUs: '',
  email: '', phone: '', altPhone: '', website: '',
  addressLine1: '', addressLine2: '', city: '', state: '', country: 'India', pincode: '',
  bankName: '', accountNumber: '', ifscCode: '', branchName: '', accountHolderName: '',
  pdfFooterText: '', termsAndConditions: '', cancellationPolicy: '',
  logoUrl: '', signatureUrl: '',
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function getToken() {
  return localStorage.getItem('trekops_token') || '';
}


export default function CompanyProfilePage() {
  const [activeTab, setActiveTab] = useState('brand');
  const [form, setForm] = useState(EMPTY);
  const [toast, setToast] = useState(null);

  const logoInputRef = useRef(null);
  const sigInputRef = useRef(null);

  const { data, loading: queryLoading } = useQuery(GET_COMPANY_PROFILE, {
    fetchPolicy: 'cache-and-network',
  });

  const [saveProfile, { loading: saving }] = useMutation(SAVE_COMPANY_PROFILE, {
    refetchQueries: [{ query: GET_COMPANY_PROFILE }],
  });

  // Populate form when data loads
  useEffect(() => {
    if (data?.getCompanyProfile) {
      const p = data.getCompanyProfile;
      setForm({
        companyName:         p.companyName || '',
        tagline:             p.tagline || '',
        establishedYear:     p.establishedYear ? String(p.establishedYear) : '',
        registrationNumber:  p.registrationNumber || '',
        gstNumber:           p.gstNumber || '',
        panNumber:           p.panNumber || '',
        aboutUs:             p.aboutUs || '',
        email:               p.email || '',
        phone:               p.phone || '',
        altPhone:            p.altPhone || '',
        website:             p.website || '',
        addressLine1:        p.addressLine1 || '',
        addressLine2:        p.addressLine2 || '',
        city:                p.city || '',
        state:               p.state || '',
        country:             p.country || 'India',
        pincode:             p.pincode || '',
        bankName:            p.bankName || '',
        accountNumber:       p.accountNumber || '',
        ifscCode:            p.ifscCode || '',
        branchName:          p.branchName || '',
        accountHolderName:   p.accountHolderName || '',
        pdfFooterText:       p.pdfFooterText || '',
        termsAndConditions:  p.termsAndConditions || '',
        cancellationPolicy:  p.cancellationPolicy || '',
        logoUrl:             p.logoUrl || '',
        signatureUrl:        p.signatureUrl || '',
      });
      // R2 URLs are already absolute (https://...) — no API_BASE prefix needed
      if (p.logoUrl) setForm(prev => ({ ...prev, logoUrl: p.logoUrl }));
      if (p.signatureUrl) setForm(prev => ({ ...prev, signatureUrl: p.signatureUrl }));
    }
  }, [data]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Save ───────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.companyName.trim()) {
      setToast({ type: 'error', msg: 'Company name is required.' });
      setActiveTab('brand');
      return;
    }
    try {
      const input = {
        ...form,
        establishedYear: form.establishedYear ? parseInt(form.establishedYear, 10) : null,
      };
      // Remove empty strings so backend doesn't overwrite with blanks
      Object.keys(input).forEach((k) => {
        if (input[k] === '') input[k] = null;
      });
      // companyName must not be null
      input.companyName = form.companyName.trim();

      await saveProfile({ variables: { input } });
      setToast({ type: 'success', msg: 'Company profile saved successfully!' });
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'Failed to save profile.' });
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  function Field({ label, id, type = 'text', value, onChange, placeholder, half, required }) {
    return (
      <div className={half ? 'sm:col-span-1' : ''}>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          id={id} type={type} value={value} onChange={onChange}
          placeholder={placeholder || label}
          className="input-field"
        />
      </div>
    );
  }

  function Textarea({ label, id, value, onChange, placeholder, rows = 4 }) {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        <textarea
          id={id} value={value} onChange={onChange} rows={rows}
          placeholder={placeholder || label}
          className="input-field resize-none"
        />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
          ${toast.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'}`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Company Profile</h1>
          <p className="page-subtitle mt-1">Configure your company details used in PDFs, invoices and bookings.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {queryLoading ? (
        <div className="card p-12 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 -mb-px
                  ${activeTab === id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* ── Tab: Brand & Identity ──────────────────────────────── */}
            {activeTab === 'brand' && (
              <div className="space-y-6">
                {/* Logo + Signature row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FileUpload
                    folder="logos"
                    accept="image"
                    label="Company Logo"
                    value={form.logoUrl}
                    onChange={(url) => setForm(prev => ({ ...prev, logoUrl: url }))}
                  />
                  <FileUpload
                    folder="signatures"
                    accept="image"
                    label="Authorized Signature"
                    value={form.signatureUrl}
                    onChange={(url) => setForm(prev => ({ ...prev, signatureUrl: url }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Company Name" id="companyName" value={form.companyName} onChange={set('companyName')} required />
                  <Field label="Tagline / Slogan" id="tagline" value={form.tagline} onChange={set('tagline')} placeholder="e.g. Discover the Trails" />
                  <Field label="Established Year" id="establishedYear" type="number" value={form.establishedYear} onChange={set('establishedYear')} placeholder="e.g. 2015" />
                  <Field label="Registration Number" id="registrationNumber" value={form.registrationNumber} onChange={set('registrationNumber')} />
                  <Field label="GST Number" id="gstNumber" value={form.gstNumber} onChange={set('gstNumber')} />
                  <Field label="PAN Number" id="panNumber" value={form.panNumber} onChange={set('panNumber')} />
                </div>

                <Textarea
                  label="About Us"
                  id="aboutUs"
                  value={form.aboutUs}
                  onChange={set('aboutUs')}
                  placeholder="Brief description of your company displayed on documents…"
                  rows={4}
                />
              </div>
            )}

            {/* ── Tab: Contact & Address ───────────────────────────────── */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Primary Email" id="email" type="email" value={form.email} onChange={set('email')} />
                    <Field label="Primary Phone" id="phone" type="tel" value={form.phone} onChange={set('phone')} />
                    <Field label="Alternate Phone" id="altPhone" type="tel" value={form.altPhone} onChange={set('altPhone')} />
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-1.5">
                        <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Website</span>
                      </label>
                      <input
                        id="website" type="url" value={form.website}
                        onChange={set('website')}
                        placeholder="https://yourcompany.com"
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Address
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field label="Address Line 1" id="addressLine1" value={form.addressLine1} onChange={set('addressLine1')} />
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Address Line 2" id="addressLine2" value={form.addressLine2} onChange={set('addressLine2')} placeholder="Landmark, area (optional)" />
                    </div>
                    <Field label="City" id="city" value={form.city} onChange={set('city')} />
                    <Field label="State" id="state" value={form.state} onChange={set('state')} />
                    <Field label="Country" id="country" value={form.country} onChange={set('country')} />
                    <Field label="PIN Code" id="pincode" value={form.pincode} onChange={set('pincode')} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Bank Details ────────────────────────────────────── */}
            {activeTab === 'bank' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                  <Info className="w-4 h-4 shrink-0" />
                  These details are printed on payment invoices. Keep them accurate.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Bank Name" id="bankName" value={form.bankName} onChange={set('bankName')} placeholder="e.g. HDFC Bank" />
                  <Field label="Account Holder Name" id="accountHolderName" value={form.accountHolderName} onChange={set('accountHolderName')} />
                  <Field label="Account Number" id="accountNumber" value={form.accountNumber} onChange={set('accountNumber')} />
                  <Field label="IFSC Code" id="ifscCode" value={form.ifscCode} onChange={set('ifscCode')} placeholder="e.g. HDFC0001234" />
                  <Field label="Branch Name" id="branchName" value={form.branchName} onChange={set('branchName')} />
                </div>
              </div>
            )}

            {/* ── Tab: PDF & Legal ─────────────────────────────────────── */}
            {activeTab === 'pdf' && (
              <div className="space-y-5">
                <Field label="PDF Footer Text" id="pdfFooterText" value={form.pdfFooterText} onChange={set('pdfFooterText')} placeholder="e.g. Thank you for choosing us!" />
                <Textarea
                  label="Terms & Conditions"
                  id="termsAndConditions"
                  value={form.termsAndConditions}
                  onChange={set('termsAndConditions')}
                  rows={6}
                  placeholder="Enter T&C that appear on invoices and booking confirmations…"
                />
                <Textarea
                  label="Cancellation Policy"
                  id="cancellationPolicy"
                  value={form.cancellationPolicy}
                  onChange={set('cancellationPolicy')}
                  rows={6}
                  placeholder="Describe your cancellation and refund policy…"
                />
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
