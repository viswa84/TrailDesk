import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mountain, ArrowRight, Check, Star, BarChart3, Users, CalendarRange,
  CreditCard, MessageSquare, Shield, Zap, Globe, ChevronDown, Menu, X,
  BookOpen, TrendingUp, Bell, Settings, Megaphone
} from 'lucide-react';

const features = [
  { icon: BookOpen, title: 'Booking Management', desc: 'End-to-end booking lifecycle — from inquiry to payment confirmation, all in one dashboard.' },
  { icon: Mountain, title: 'Trek Catalog', desc: 'Create, publish, and manage trek packages with live inventory, itineraries, and instant go-live.' },
  { icon: Users, title: 'Customer CRM', desc: 'Track every trekker — booking history, LTV, tags, preferences. Turn first-timers into repeat customers.' },
  { icon: CalendarRange, title: 'Departure Batches', desc: 'Schedule batches, assign guides, track seat availability, and manage capacity across all departures.' },
  { icon: CreditCard, title: 'Finance & Invoicing', desc: 'Invoices, payments, refunds — complete financial tracking with GST support and reconciliation.' },
  { icon: Megaphone, title: 'Campaign Analytics', desc: 'Track marketing spend, leads, conversions, and ROAS across Google Ads, Instagram, YouTube, and more.' },
  { icon: MessageSquare, title: 'WhatsApp Integration', desc: 'Built-in WhatsApp chat support — see all customer conversations in one unified inbox.' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Get instant alerts for new bookings, payments, low seats, and cancellations. Fully customizable.' },
  { icon: BarChart3, title: 'Real-Time Dashboard', desc: 'KPIs, revenue charts, booking trends, and regional breakdowns — all computed live from your data.' },
];

const plans = [
  {
    name: 'Starter',
    price: '₹0',
    period: 'Forever free',
    desc: 'Perfect for getting started',
    features: ['Up to 50 bookings/month', '1 admin user', 'Basic dashboard', 'Email support', 'WhatsApp chat'],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Professional',
    price: '₹2,999',
    period: '/month',
    desc: 'For growing trekking companies',
    features: ['Unlimited bookings', '5 team members', 'Advanced analytics', 'Campaign tracking', 'Priority support', 'Custom branding', 'API access'],
    cta: 'Start 30-Day Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'Contact us',
    desc: 'For large operators & agencies',
    features: ['Everything in Pro', 'Unlimited users', 'Multi-branch support', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'On-premise option'],
    cta: 'Contact Sales',
    popular: false,
  },
];

const testimonials = [
  { name: 'Rajesh Sharma', role: 'CEO, Himalaya Treks', quote: 'TrailDesk transformed how we manage 200+ departures per year. The dashboard alone saved us 10 hours a week.', rating: 5 },
  { name: 'Priya Negi', role: 'Founder, Sahyadri Adventures', quote: 'The WhatsApp integration is a game-changer. We respond to inquiries 5x faster and conversions are through the roof.', rating: 5 },
  { name: 'Vikram Singh', role: 'Operations Head, Peak Expeditions', quote: 'From bookings to refunds, everything is automated. We\'ve scaled from 3 treks to 25 without adding ops staff.', rating: 5 },
];

const stats = [
  { value: '500+', label: 'Trekking Companies' },
  { value: '2.5L+', label: 'Bookings Processed' },
  { value: '₹50Cr+', label: 'Revenue Managed' },
  { value: '99.9%', label: 'Uptime' },
];

const faqs = [
  { q: 'How long is the free trial?', a: 'Professional plan comes with a 30-day free trial. No credit card required. Starter plan is free forever.' },
  { q: 'Can I import my existing data?', a: 'Yes! We support CSV imports for treks, customers, and bookings. Our team will help you migrate for free.' },
  { q: 'Is my data secure?', a: 'Absolutely. We use industry-standard encryption, and each company\'s data is completely isolated. We\'re SOC 2 compliant.' },
  { q: 'Do you support WhatsApp Business API?', a: 'Yes, TrailDesk integrates with the official WhatsApp Business API for automated responses and chat management.' },
  { q: 'Can I customize the branding?', a: 'Pro and Enterprise plans include custom branding — your logo, colors, and domain.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                <Mountain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">TrailDesk</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Testimonials</a>
              <a href="#faq" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">FAQ</a>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                Sign In
              </button>
              <button onClick={() => navigate('/login')} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-emerald-500 rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200">
                Start Free Trial
              </button>
            </div>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2">
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3 animate-fade-in">
            <a href="#features" className="block text-sm text-slate-600 py-2">Features</a>
            <a href="#pricing" className="block text-sm text-slate-600 py-2">Pricing</a>
            <a href="#testimonials" className="block text-sm text-slate-600 py-2">Testimonials</a>
            <button onClick={() => navigate('/login')} className="w-full mt-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-emerald-500 rounded-xl">Start Free Trial</button>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-emerald-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-100/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-sm font-medium text-primary-700 mb-8">
              <Zap className="w-3.5 h-3.5" /> Trusted by 500+ trekking companies across India
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              The Complete ERP for{' '}
              <span className="bg-gradient-to-r from-primary-600 to-emerald-500 bg-clip-text text-transparent">
                Trekking Operators
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Manage bookings, departures, customers, finances, and marketing — all from one beautifully designed platform. Built by trekkers, for trekkers.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-emerald-500 rounded-xl hover:shadow-xl hover:shadow-primary-500/25 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                Start Free — 30 Days
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#features"
                className="px-8 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                See Features
              </a>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((s, i) => (
              <div key={i} className="text-center p-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{s.value}</div>
                <div className="text-sm text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-sm font-medium text-emerald-700 mb-4">
              <Settings className="w-3.5 h-3.5" /> Everything you need
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              One platform. Every feature.
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Stop juggling spreadsheets, WhatsApp groups, and accounting software. TrailDesk handles it all.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-slate-100 hover:border-primary-200 bg-white hover:bg-gradient-to-br hover:from-primary-50/50 hover:to-emerald-50/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary-100/50"
              >
                <div className="w-11 h-11 bg-gradient-to-br from-primary-100 to-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:from-primary-200 group-hover:to-emerald-200 transition-colors">
                  <f.icon className="w-5 h-5 text-primary-700" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Get started in 3 steps</h2>
            <p className="mt-4 text-lg text-slate-500">Go from zero to fully operational in under 10 minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Register Your Company', desc: 'Create your account, name your company, and you\'re in. No credit card needed.' },
              { step: '02', title: 'Add Your Treks', desc: 'Import or create trek packages with itineraries, pricing, and photos.' },
              { step: '03', title: 'Start Receiving Bookings', desc: 'Share your booking link. Manage everything from your TrailDesk dashboard.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-primary-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-primary-500/20 mb-5">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 border border-primary-100 rounded-full text-sm font-medium text-primary-700 mb-4">
              <CreditCard className="w-3.5 h-3.5" /> Simple pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Plans for every stage</h2>
            <p className="mt-4 text-lg text-slate-500">Start free. Upgrade when you grow. No hidden fees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  p.popular
                    ? 'bg-gradient-to-br from-primary-600 to-emerald-500 text-white shadow-2xl shadow-primary-500/30 scale-[1.03] z-10'
                    : 'bg-white border border-slate-200 hover:border-primary-200 hover:shadow-lg transition-all'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full shadow-sm">
                    MOST POPULAR
                  </div>
                )}
                <h3 className={`text-lg font-bold ${p.popular ? 'text-white' : 'text-slate-900'}`}>{p.name}</h3>
                <p className={`text-sm mt-1 ${p.popular ? 'text-white/80' : 'text-slate-500'}`}>{p.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold ${p.popular ? 'text-white' : 'text-slate-900'}`}>{p.price}</span>
                  <span className={`text-sm ${p.popular ? 'text-white/70' : 'text-slate-400'}`}>{p.period}</span>
                </div>
                <ul className="mt-8 space-y-3 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${p.popular ? 'text-emerald-200' : 'text-emerald-500'}`} />
                      <span className={p.popular ? 'text-white/90' : 'text-slate-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/login')}
                  className={`mt-8 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    p.popular
                      ? 'bg-white text-primary-700 hover:bg-primary-50 shadow-sm'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Loved by operators across India</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-emerald-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-slate-900">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-slate-500 leading-relaxed animate-fade-in">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-emerald-500 rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Ready to streamline your trekking business?
              </h2>
              <p className="mt-4 text-lg text-emerald-100/80 max-w-xl mx-auto">
                Join 500+ companies already using TrailDesk. Start your free trial today — no credit card required.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-8 px-10 py-4 bg-white text-primary-700 font-bold text-base rounded-xl hover:bg-primary-50 transition-colors shadow-lg shadow-primary-800/20 inline-flex items-center gap-2 group"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-emerald-400 rounded-lg flex items-center justify-center">
                  <Mountain className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold">TrailDesk</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">The complete ERP for trekking operators. Built in India 🇮🇳</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">© 2026 TrailDesk. All rights reserved.</p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Globe className="w-3.5 h-3.5" /> Made with ❤️ in India
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
