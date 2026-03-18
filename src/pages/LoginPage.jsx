import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useMutation } from '@apollo/client/react';
import { LOGIN, REGISTER } from '../graphql/mutations';
import { v, validateForm, onlyDigits } from '../utils/validators';
import { Mountain, Phone, KeyRound, ArrowRight, Loader2, UserPlus, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [form, setForm] = useState({
    phone: '',
    password: '',
    name: '',
    email: '',
    companyName: '',
    companySlug: '',
  });
  const [errors, setErrors] = useState({});

  const [loginMut, { loading: loginLoading }] = useMutation(LOGIN);
  const [registerMut, { loading: registerLoading }] = useMutation(REGISTER);
  const loading = loginLoading || registerLoading;

  const handleChange = (field) => (e) => {
    let val = e.target.value;
    if (field === 'phone') val = onlyDigits(val, 10);
    setForm({ ...form, [field]: val });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { valid, errors: errs } = validateForm({
      phone: v.phone(form.phone),
      password: v.required(form.password, 'Password'),
    });
    if (!valid) { setErrors(errs); toast.error('Please fix the errors below'); return; }
    try {
      const { data } = await loginMut({
        variables: { phone: form.phone, password: form.password },
      });
      login(data.login.token, data.login.user);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { valid, errors: errs } = validateForm({
      name: v.required(form.name, 'Full name'),
      phone: v.phone(form.phone),
      password: v.minLength(form.password, 6, 'Password'),
      email: v.emailOptional(form.email),
      companyName: v.required(form.companyName, 'Company name'),
      companySlug: v.slug(form.companySlug.toLowerCase().replace(/[^a-z0-9-]/g, ''), 'Company slug'),
    });
    if (!valid) { setErrors(errs); toast.error('Please fix the errors below'); return; }
    try {
      const { data } = await registerMut({
        variables: {
          input: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            companyName: form.companyName,
            companySlug: form.companySlug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
          },
        },
      });
      login(data.register.token, data.register.user);
      toast.success('Registration successful! Welcome aboard.');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    }
  };

  const fieldClass = (name) => `input-field ${errors[name] ? 'input-error' : ''}`;
  const errMsg = (name) => errors[name] ? <p className="text-xs text-red-500 mt-1">{errors[name]}</p> : null;

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-800 via-primary-700 to-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-emerald-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Mountain className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">TrekOps</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Manage your treks.<br />Effortlessly.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-md">
            The all-in-one platform for trek operators. Bookings, finance, customers, and marketing — all in one beautifully designed dashboard.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 max-w-sm">
            {[
              { val: '2,500+', label: 'Bookings managed' },
              { val: '₹45L+', label: 'Revenue tracked' },
              { val: '150+', label: 'Treks organized' },
              { val: '4.9★', label: 'Customer rating' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{s.val}</p>
                <p className="text-xs text-white/60 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Forms */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">TrekOps</span>
          </div>

          {/* Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
            <button onClick={() => { setMode('login'); setErrors({}); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button onClick={() => { setMode('register'); setErrors({}); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              <UserPlus className="w-4 h-4" /> Register
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
                <p className="text-sm text-slate-500 mt-1">Sign in with your phone number</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="tel" value={form.phone} onChange={handleChange('phone')} placeholder="10-digit mobile number" className={`${fieldClass('phone')} pl-10`} maxLength={10} />
                </div>
                {errMsg('phone')}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="password" value={form.password} onChange={handleChange('password')} placeholder="Enter your password" className={`${fieldClass('password')} pl-10`} />
                </div>
                {errMsg('password')}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Sign In</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
                <p className="text-sm text-slate-500 mt-1">Start managing your treks in minutes</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                  <input value={form.name} onChange={handleChange('name')} className={fieldClass('name')} placeholder="Your name" />
                  {errMsg('name')}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={handleChange('email')} className={fieldClass('email')} placeholder="you@email.com" />
                  {errMsg('email')}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number *</label>
                <input type="tel" value={form.phone} onChange={handleChange('phone')} className={fieldClass('phone')} placeholder="10-digit mobile" maxLength={10} />
                {errMsg('phone')}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
                <input type="password" value={form.password} onChange={handleChange('password')} className={fieldClass('password')} placeholder="Min 6 characters" />
                {errMsg('password')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Company Name *</label>
                  <input value={form.companyName} onChange={handleChange('companyName')} className={fieldClass('companyName')} placeholder="Your company" />
                  {errMsg('companyName')}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Company Slug *</label>
                  <input value={form.companySlug} onChange={handleChange('companySlug')} className={fieldClass('companySlug')} placeholder="my-company" />
                  {errMsg('companySlug')}
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Create Account</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
