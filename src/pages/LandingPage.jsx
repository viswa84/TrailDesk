import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { CREATE_CONTACT_INQUIRY } from '../graphql/mutations';
import {
  Mountain, ArrowRight, Check, Star, BarChart3, Users, CalendarRange,
  CreditCard, MessageSquare, Shield, Zap, Globe, ChevronDown, Menu, X,
  BookOpen, TrendingUp, Bell, Settings, Megaphone, Phone, Send,
  Smile, Paperclip, Camera, Mic, ChevronLeft, MoreVertical, Video,
  CheckCheck, Bot, Sparkles, Reply, Clock, Workflow, GitBranch, Mail, MapPin,
  List
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
  { name: 'Rajesh Sharma', role: 'CEO, Himalaya Treks', quote: 'TrekOps transformed how we manage 200+ departures per year. The dashboard alone saved us 10 hours a week.', rating: 5 },
  { name: 'Priya Negi', role: 'Founder, Sahyadri Adventures', quote: 'The WhatsApp integration is a game-changer. We respond to inquiries 5x faster and conversions are through the roof.', rating: 5 },
  { name: 'Vikram Singh', role: 'Operations Head, Peak Expeditions', quote: 'From bookings to refunds, everything is automated. We\'ve scaled from 3 treks to 25 without adding ops staff.', rating: 5 },
];

const faqs = [
  { q: 'How long is the free trial?', a: 'Professional plan comes with a 30-day free trial. No credit card required. Starter plan is free forever.' },
  { q: 'Can I import my existing data?', a: 'Yes! We support CSV imports for treks, customers, and bookings. Our team will help you migrate for free.' },
  { q: 'Is my data secure?', a: 'Absolutely. We use industry-standard encryption, and each company\'s data is completely isolated. We\'re SOC 2 compliant.' },
  { q: 'Do you support WhatsApp Business API?', a: 'Yes, TrekOps integrates with the official WhatsApp Business API for automated responses and chat management.' },
  { q: 'Can I customize the branding?', a: 'Pro and Enterprise plans include custom branding — your logo, colors, and domain.' },
];

/* ── WhatsApp Chat Messages ── */
const chatMessages = [
  { from: 'bot', text: 'Hi! 👋 Welcome to TrekOps.\nHow can I help you today?', time: '10:30 AM', typingDelay: 1200 },
  { from: 'user', text: 'Hey! What treks do you have this weekend?', time: '10:31 AM', typingDelay: 900 },
  { from: 'bot', text: 'We have 3 amazing options! 🏔️\n\n1️⃣ Kalsubai Sunrise Trek\n2️⃣ Rajmachi Fort Night Trek\n3️⃣ Lohagad Monsoon Trek\n\nWhich one interests you?', time: '10:31 AM', typingDelay: 1800 },
  { from: 'user', text: 'Kalsubai sounds great! Details please 🙏', time: '10:32 AM', typingDelay: 800 },
  { from: 'bot', text: 'Here you go! ⛰️\n\n📅 March 22–23, 2026\n⏰ Depart: Sat 10PM\n👥 8 seats left (20 total)\n💰 ₹2,800 per person\n📍 Pickup: Kasara Station\n\nIncludes transport, meals, camping gear & guide! 🎒', time: '10:32 AM', typingDelay: 2000 },
  { from: 'user', text: 'Book 3 seats! 💪', time: '10:33 AM', typingDelay: 700 },
  { from: 'bot', text: '✅ Done! 3 seats confirmed.\n\n🎫 Booking ID: #TO-4291\n💳 Payment link sent to your number\n💲 Total: ₹8,400\n\nYou\'ll receive a packing list 24hrs before. See you at the summit! 🥾', time: '10:33 AM', typingDelay: 1800 },
  { from: 'user', text: 'Amazing! Can\'t wait 🎉', time: '10:34 AM', typingDelay: 600 },
  { from: 'bot', text: 'Happy trekking! 🌄\nReply anytime if you need help.', time: '10:34 AM', typingDelay: 1000 },
];

/* ── Typing Indicator ── */
function TypingIndicator() {
  return (
    <div className="wa-msg-enter" style={{
      display: 'flex', justifyContent: 'flex-start', marginBottom: '4px',
    }}>
      <div style={{
        background: 'white', borderRadius: '10px 10px 10px 2px',
        padding: '8px 12px', boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'center', gap: '3px',
      }}>
        <span className="wa-typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="wa-typing-dot" style={{ animationDelay: '150ms' }} />
        <span className="wa-typing-dot" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

/* ── iPhone 16 Pro Frame + Animated WhatsApp Chat ── */
function IPhoneMockup() {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef(null);
  const timeoutsRef = useRef([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const addTimeout = useCallback((fn, delay) => {
    const id = setTimeout(fn, delay);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    let currentDelay = 800; // initial delay before first message

    const playConversation = () => {
      clearAllTimeouts();
      setVisibleMessages([]);
      setIsTyping(false);
      currentDelay = 800;

      chatMessages.forEach((msg, idx) => {
        // Show typing indicator
        addTimeout(() => setIsTyping(true), currentDelay);

        currentDelay += msg.typingDelay;

        // Hide typing, show message
        const capturedIdx = idx;
        addTimeout(() => {
          setIsTyping(false);
          setVisibleMessages(prev => [...prev, capturedIdx]);
        }, currentDelay);

        // Pause between messages
        currentDelay += 500;
      });

      // After all messages played, wait then restart
      addTimeout(() => {
        playConversation();
      }, currentDelay + 3000);
    };

    playConversation();

    return () => clearAllTimeouts();
  }, [addTimeout, clearAllTimeouts]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [visibleMessages, isTyping]);

  return (
    <div className="iphone-float" style={{ perspective: '1200px' }}>
      {/* iPhone 16 Pro outer frame */}
      <div style={{
        position: 'relative',
        width: '290px',
        height: '600px',
        background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0d0d0d 100%)',
        borderRadius: '48px',
        padding: '10px',
        boxShadow: `
          0 0 0 1px rgba(255,255,255,0.08),
          0 25px 60px -12px rgba(0,0,0,0.5),
          0 12px 28px -8px rgba(0,0,0,0.35),
          inset 0 1px 0 rgba(255,255,255,0.06)
        `,
      }}>
        {/* Titanium-style edge highlight */}
        <div style={{
          position: 'absolute', inset: '0', borderRadius: '48px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)',
          pointerEvents: 'none', zIndex: 5,
        }} />

        {/* Side buttons — left */}
        <div style={{ position: 'absolute', left: '-2.5px', top: '100px', width: '3px', height: '28px', background: '#2a2a2a', borderRadius: '2px 0 0 2px', boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', left: '-2.5px', top: '155px', width: '3px', height: '50px', background: '#2a2a2a', borderRadius: '2px 0 0 2px', boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', left: '-2.5px', top: '215px', width: '3px', height: '50px', background: '#2a2a2a', borderRadius: '2px 0 0 2px', boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.1)' }} />
        {/* Right — power button */}
        <div style={{ position: 'absolute', right: '-2.5px', top: '175px', width: '3px', height: '60px', background: '#2a2a2a', borderRadius: '0 2px 2px 0', boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.1)' }} />

        {/* Screen */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '40px',
          overflow: 'hidden',
          background: '#ECE5DD',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Dynamic Island */}
          <div style={{
            position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
            width: '90px', height: '28px', background: '#000', borderRadius: '20px', zIndex: 30,
          }}>
            <div style={{ position: 'absolute', right: '22px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: '#1a1a2e', boxShadow: 'inset 0 0 2px rgba(50,50,100,0.8)' }} />
          </div>

          {/* Status bar */}
          <div style={{
            position: 'relative', zIndex: 20, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 22px 0', height: '48px',
            background: '#075E54',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'white', letterSpacing: '0.02em' }}>9:41</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1px', alignItems: 'flex-end' }}>
                {[6,8,10,12].map((h,i) => <div key={i} style={{ width: '3px', height: `${h}px`, background: 'white', borderRadius: '1px' }} />)}
              </div>
              <span style={{ fontSize: '11px', color: 'white', fontWeight: 600, marginLeft: '2px' }}>5G</span>
              <div style={{ marginLeft: '4px', width: '22px', height: '10px', border: '1px solid white', borderRadius: '2px', position: 'relative', display: 'flex', alignItems: 'center', padding: '1px' }}>
                <div style={{ width: '70%', height: '100%', background: 'white', borderRadius: '1px' }} />
                <div style={{ position: 'absolute', right: '-4px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '5px', background: 'white', borderRadius: '0 1px 1px 0' }} />
              </div>
            </div>
          </div>

          {/* WhatsApp header */}
          <div style={{
            position: 'relative', zIndex: 20, flexShrink: 0,
            background: '#075E54',
            padding: '6px 10px 10px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <ChevronLeft style={{ width: '18px', height: '18px', color: 'white', flexShrink: 0 }} />
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Mountain style={{ width: '15px', height: '15px', color: 'white' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>TrekOps</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.3, transition: 'all 0.2s' }}>
                {isTyping ? 'typing...' : 'online'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
              <Video style={{ width: '17px', height: '17px', color: 'white' }} />
              <Phone style={{ width: '15px', height: '15px', color: 'white' }} />
              <MoreVertical style={{ width: '17px', height: '17px', color: 'white' }} />
            </div>
          </div>

          {/* Chat area */}
          <div
            ref={chatRef}
            style={{
              flex: 1, overflowY: 'auto', padding: '10px 10px 6px',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M30 5c1 0 2 1 2 2s-1 2-2 2-2-1-2-2 1-2 2-2zM15 20c.5 0 1 .5 1 1s-.5 1-1 1-1-.5-1-1 .5-1 1-1zM45 35c.5 0 1 .5 1 1s-.5 1-1 1-1-.5-1-1 .5-1 1-1zM10 50c.5 0 1 .5 1 1s-.5 1-1 1-1-.5-1-1 .5-1 1-1z' fill='%23d5cfc6' fill-opacity='.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='60' height='60' fill='url(%23p)'/%3E%3C/svg%3E")`,
            }}
          >
            {/* Date chip */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <span style={{
                fontSize: '10px', color: '#667781', background: '#e2ddd5',
                padding: '3px 10px', borderRadius: '6px', fontWeight: 500,
                boxShadow: '0 1px 1px rgba(0,0,0,0.06)',
              }}>TODAY</span>
            </div>

            {/* Rendered messages */}
            {visibleMessages.map((msgIdx) => {
              const msg = chatMessages[msgIdx];
              const isUser = msg.from === 'user';
              return (
                <div
                  key={msgIdx}
                  className={isUser ? 'wa-msg-slide-right' : 'wa-msg-slide-left'}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    marginBottom: '4px',
                  }}
                >
                  <div style={{
                    maxWidth: '82%',
                    background: isUser ? '#D9FDD3' : 'white',
                    borderRadius: isUser ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                    padding: '5px 8px 3px',
                    position: 'relative',
                    boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
                  }}>
                    <div style={{
                      fontSize: '11.5px', color: '#111B21', lineHeight: 1.4,
                      whiteSpace: 'pre-line', wordBreak: 'break-word',
                    }}>
                      {msg.text}
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                      gap: '3px', marginTop: '1px',
                    }}>
                      <span style={{ fontSize: '9px', color: '#667781' }}>{msg.time}</span>
                      {isUser && (
                        <CheckCheck style={{ width: '13px', height: '13px', color: '#53BDEB' }} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}
          </div>

          {/* WhatsApp input bar */}
          <div style={{
            flexShrink: 0, zIndex: 20,
            padding: '5px 6px 22px',
            background: '#ECE5DD',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              background: 'white', borderRadius: '20px',
              padding: '6px 10px', gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            }}>
              <Smile style={{ width: '18px', height: '18px', color: '#8696a0', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '12px', color: '#8696a0' }}>Message</span>
              <Paperclip style={{ width: '16px', height: '16px', color: '#8696a0', flexShrink: 0 }} />
              <Camera style={{ width: '17px', height: '17px', color: '#8696a0', flexShrink: 0 }} />
            </div>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              background: '#00A884', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Mic style={{ width: '16px', height: '16px', color: 'white' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Contact Section Component ── */
function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [createContact, { loading }] = useMutation(CREATE_CONTACT_INQUIRY, {
    onCompleted: () => setSubmitted(true),
    onError: (e) => alert(e.message || 'Something went wrong'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return;
    createContact({ variables: { input: { ...form } } });
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <section id="contact" className="py-20 sm:py-28 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary-100/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-60 h-60 bg-emerald-100/20 rounded-full blur-3xl" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-sm font-semibold text-primary-700 mb-6">
            <Mail className="w-3.5 h-3.5" /> Get in Touch
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Contact Us
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Left — Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Contact Information</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Email</p>
                    <a href="mailto:contact@trekops.in" className="text-sm text-primary-600 hover:text-primary-700 transition-colors">contact@trekops.in</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Phone</p>
                    <a href="tel:+918464892914" className="text-sm text-slate-600 hover:text-slate-900 transition-colors block">+91 84648 92914</a>
                    <a href="tel:+919226001143" className="text-sm text-slate-600 hover:text-slate-900 transition-colors block">+91 92260 01143</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Location</p>
                    <p className="text-sm text-slate-600">India 🇮🇳</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-gradient-to-br from-primary-600 to-emerald-500 rounded-2xl p-6 text-white">
              <h4 className="text-base font-bold mb-3">Ready to get started?</h4>
              <p className="text-sm text-white/80 mb-4">Start your free 30-day trial — no credit card required.</p>
              <div className="flex gap-3">
                <a href="https://wa.me/918464892914" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </a>
                <a href="mailto:contact@trekops.in" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Us
                </a>
              </div>
            </div>
          </div>

          {/* Right — Contact Form */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                <p className="text-sm text-slate-500 mb-6">We'll get back to you within 24 hours.</p>
                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', message: '' }); }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Send us a Message</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                  <input type="text" value={form.name} onChange={f('name')} required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="Your name" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input type="email" value={form.email} onChange={f('email')}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="you@company.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                    <input type="tel" value={form.phone} onChange={f('phone')}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Message *</label>
                  <textarea rows={4} value={form.message} onChange={f('message')} required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none" placeholder="Tell us about your trekking business..." />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-emerald-500 rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? 'Sending...' : <><Send className="w-4 h-4" /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

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
              <span className="text-xl font-bold text-slate-900 tracking-tight">TrekOps</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#flow-builder" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Flow Builder</a>
              <a href="#whatsapp" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">WhatsApp</a>
              <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
              <a href="#contact" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Contact</a>
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
            <a href="#whatsapp" className="block text-sm text-slate-600 py-2">WhatsApp</a>
            <a href="#pricing" className="block text-sm text-slate-600 py-2">Pricing</a>
            <a href="#testimonials" className="block text-sm text-slate-600 py-2">Testimonials</a>
            <button onClick={() => navigate('/login')} className="w-full mt-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-emerald-500 rounded-xl">Start Free Trial</button>
          </div>
        )}
      </nav>

      {/* ── Hero — Two columns with iPhone mockup ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-emerald-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-100/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left — Text */}
            <div className="flex-1 text-center lg:text-left max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 border border-green-200 rounded-full text-sm font-medium text-green-700 mb-8">
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp-First Platform for Trekking Operators
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                Book Treks via{' '}
                <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                  WhatsApp
                </span>
                {' '}— Automagically
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed">
                Your customers chat on WhatsApp. Now your bookings, confirmations, and reminders happen right there too. Built by trekkers, for trekkers.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 flex items-center justify-center gap-2 group"
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

              {/* Social proof mini */}
              <div className="mt-10 flex items-center gap-4 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {['RS', 'PN', 'VS', 'AK'].map((initials, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white" style={{
                      background: ['#059669','#0ea5e9','#8b5cf6','#f59e0b'][i],
                    }}>{initials}</div>
                  ))}
                </div>
                <div className="text-sm text-slate-500">
                  Trusted by <span className="font-semibold text-slate-700">leading operators</span> across India
                </div>
              </div>
            </div>

            {/* Right — iPhone 16 Mockup */}
            <div className="flex-shrink-0 relative">
              {/* Glow effects behind the phone */}
              <div className="absolute -inset-10 bg-gradient-to-br from-green-200/40 via-emerald-100/20 to-teal-200/30 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-400/10 rounded-full blur-2xl" />
              <div className="relative">
                <IPhoneMockup />
              </div>
            </div>
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
              Stop juggling spreadsheets, WhatsApp groups, and accounting software. TrekOps handles it all.
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

      {/* ── Flow Builder Demo ── */}
      <section id="flow-builder" className="py-20 sm:py-28 bg-gradient-to-b from-slate-50 via-indigo-50/30 to-white relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-100/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full text-sm font-semibold text-indigo-700 mb-6">
              <Workflow className="w-3.5 h-3.5" /> Visual Flow Builder
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Build <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">WhatsApp Chatbot Flows</span> Visually
            </h2>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              Drag and drop conversation nodes, connect them visually, and see a live WhatsApp preview — all without writing a single line of code.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-center">
            {/* Left — Flow Builder Visual Demo */}
            <div className="flex-1 relative">
              <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-indigo-200/30 overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-white/80">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 ml-2">TrekOps Flow Builder</span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">✓ Auto-saved</span>
                  </div>
                </div>
                {/* Canvas */}
                <div className="p-6 min-h-[340px] relative" style={{ background: 'radial-gradient(circle at 20px 20px, #e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                  {/* Start Node */}
                  <div className="flow-node-demo absolute" style={{ left: '8%', top: '25%' }}>
                    <div className="bg-white rounded-xl border-2 border-emerald-300 shadow-lg shadow-emerald-100/50 px-4 py-3 min-w-[140px]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center">
                          <Zap className="w-3 h-3 text-emerald-600" />
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700">START</span>
                      </div>
                      <p className="text-[10px] text-slate-500">hi, hello, hey</p>
                    </div>
                  </div>
                  {/* Connection Line 1 */}
                  <svg className="absolute" style={{ left: '22%', top: '38%', width: '120px', height: '60px' }} viewBox="0 0 120 60">
                    <path d="M 0 5 C 60 5, 60 55, 120 55" stroke="#818cf8" strokeWidth="2" fill="none" strokeDasharray="4 3" className="flow-line-anim" />
                    <circle cx="120" cy="55" r="3" fill="#818cf8" />
                  </svg>
                  {/* Buttons Node */}
                  <div className="flow-node-demo absolute" style={{ left: '38%', top: '50%', animationDelay: '0.5s' }}>
                    <div className="bg-white rounded-xl border-2 border-amber-300 shadow-lg shadow-amber-100/50 px-4 py-3 min-w-[150px]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center">
                          <List className="w-3 h-3 text-amber-600" />
                        </div>
                        <span className="text-[11px] font-bold text-amber-700">BUTTONS</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-1.5">Choose your city 🏙️</p>
                      <div className="flex gap-1">
                        <span className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">Pune</span>
                        <span className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">Mumbai</span>
                      </div>
                    </div>
                  </div>
                  {/* Connection Line 2 */}
                  <svg className="absolute" style={{ left: '58%', top: '30%', width: '100px', height: '40px' }} viewBox="0 0 100 40">
                    <path d="M 0 35 C 50 35, 50 5, 100 5" stroke="#818cf8" strokeWidth="2" fill="none" strokeDasharray="4 3" className="flow-line-anim" style={{ animationDelay: '1s' }} />
                    <circle cx="100" cy="5" r="3" fill="#818cf8" />
                  </svg>
                  {/* Dynamic List Node */}
                  <div className="flow-node-demo absolute" style={{ left: '65%', top: '12%', animationDelay: '1s' }}>
                    <div className="bg-white rounded-xl border-2 border-cyan-300 shadow-lg shadow-cyan-100/50 px-4 py-3 min-w-[150px]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-md bg-cyan-100 flex items-center justify-center">
                          <BarChart3 className="w-3 h-3 text-cyan-600" />
                        </div>
                        <span className="text-[11px] font-bold text-cyan-700">DYNAMIC LIST</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Source: Live Treks</p>
                      <span className="text-[8px] bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">from DB</span>
                    </div>
                  </div>
                  {/* Connection Line 3 */}
                  <svg className="absolute" style={{ left: '72%', top: '40%', width: '80px', height: '50px' }} viewBox="0 0 80 50">
                    <path d="M 0 0 C 40 0, 40 50, 80 50" stroke="#818cf8" strokeWidth="2" fill="none" strokeDasharray="4 3" className="flow-line-anim" style={{ animationDelay: '1.5s' }} />
                    <circle cx="80" cy="50" r="3" fill="#818cf8" />
                  </svg>
                  {/* End Node */}
                  <div className="flow-node-demo absolute" style={{ left: '78%', top: '65%', animationDelay: '1.5s' }}>
                    <div className="bg-white rounded-xl border-2 border-rose-300 shadow-lg shadow-rose-100/50 px-4 py-3 min-w-[130px]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-md bg-rose-100 flex items-center justify-center">
                          <Check className="w-3 h-3 text-rose-600" />
                        </div>
                        <span className="text-[11px] font-bold text-rose-700">BOOKING</span>
                      </div>
                      <p className="text-[10px] text-slate-500">✅ Payment link sent</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Feature Highlights */}
            <div className="flex-1 max-w-lg">
              <div className="space-y-5">
                {[
                  { icon: GitBranch, title: 'Drag & Drop Nodes', desc: 'Build complex conversation flows visually — Start, Text, Buttons, Lists, Dynamic Data, and more.', color: 'bg-indigo-100 text-indigo-600' },
                  { icon: BarChart3, title: 'Live Data from Your Database', desc: 'Pull cities, treks, departures, and dates directly from your TrekOps data — always up to date.', color: 'bg-cyan-100 text-cyan-600' },
                  { icon: Sparkles, title: 'Instant WhatsApp Preview', desc: 'Watch your flow come alive in a real-time WhatsApp chat simulator before going live.', color: 'bg-violet-100 text-violet-600' },
                  { icon: Shield, title: 'One-Click Deploy', desc: 'Save your flow and it instantly goes live on your WhatsApp Business number. Zero downtime.', color: 'bg-emerald-100 text-emerald-600' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/80 transition-colors">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/login')}
                className="mt-8 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-500 rounded-xl hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 inline-flex items-center gap-2 group"
              >
                Try Flow Builder
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── WhatsApp Integration Highlight ── */}
      <section id="whatsapp" className="py-20 sm:py-28 bg-gradient-to-b from-green-50/60 via-emerald-50/30 to-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-emerald-100/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left — Phone mockup */}
            <div className="flex-shrink-0 order-2 lg:order-1">
              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-to-br from-green-200/30 to-emerald-200/20 rounded-full blur-2xl" />
                <div className="relative">
                  <IPhoneMockup />
                </div>
              </div>
            </div>

            {/* Right — Text content */}
            <div className="flex-1 order-1 lg:order-2 max-w-xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 border border-green-200 rounded-full text-sm font-semibold text-green-700 mb-6">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-green-600">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.12 1.522 5.857L0 24l6.335-1.652A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.97 0-3.867-.53-5.52-1.53l-.396-.236-3.763.982.999-3.648-.26-.412A9.803 9.803 0 012.18 12C2.18 6.58 6.58 2.18 12 2.18S21.82 6.58 21.82 12 17.42 21.82 12 21.82z" />
                </svg>
                WhatsApp Integration
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Automate Bookings on{' '}
                <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">WhatsApp</span>
              </h2>
              <p className="mt-5 text-lg text-slate-600 leading-relaxed">
                Your customers already live on WhatsApp. Meet them there — with instant replies, booking confirmations, and payment reminders, all automated.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: Zap, title: 'Instant Auto-Replies', desc: 'Respond to inquiries in seconds, 24/7, with smart chatbot flows.' },
                  { icon: CheckCheck, title: 'Booking Confirmations', desc: 'Automatic booking IDs, payment links, and itinerary details.' },
                  { icon: Bell, title: 'Payment & Trek Reminders', desc: 'Gentle nudges for payments, packing lists, and meetup times.' },
                  { icon: MessageSquare, title: 'Unified Inbox', desc: 'Every customer conversation — one dashboard. No message missed.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/login')}
                className="mt-10 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 inline-flex items-center gap-2 group"
              >
                Try WhatsApp Integration
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
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
              { step: '03', title: 'Start Receiving Bookings', desc: 'Share your booking link. Manage everything from your TrekOps dashboard.' },
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
          <div className="bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Ready to take bookings on WhatsApp?
              </h2>
              <p className="mt-4 text-lg text-emerald-100/80 max-w-xl mx-auto">
                Start your free trial today — no credit card required. Your customers are already on WhatsApp. Meet them there.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-8 px-10 py-4 bg-white text-green-700 font-bold text-base rounded-xl hover:bg-green-50 transition-colors shadow-lg shadow-green-800/20 inline-flex items-center gap-2 group"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact Section ── */}
      <ContactSection />

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-emerald-400 rounded-lg flex items-center justify-center">
                  <Mountain className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold">TrekOps</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">The complete ERP for trekking operators. Built in India 🇮🇳<br/><span className="text-slate-500">trekops.in</span></p>
              <div className="mt-3 space-y-1">
                <a href="mailto:contact@trekops.in" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> contact@trekops.in</a>
                <a href="tel:+918464892914" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +91 84648 92914</a>
                <a href="tel:+919226001143" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +91 92260 01143</a>
              </div>
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
            <p className="text-sm text-slate-500">© 2026 TrekOps (trekops.in). All rights reserved.</p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Globe className="w-3.5 h-3.5" /> Made with ❤️ in India
            </div>
          </div>
        </div>
      </footer>

      {/* Float animation CSS */}
      <style>{`
        .iphone-float {
          animation: iphoneFloat 4s ease-in-out infinite;
        }
        @keyframes iphoneFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        /* WhatsApp message animations */
        .wa-msg-slide-left {
          animation: waMsgSlideLeft 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .wa-msg-slide-right {
          animation: waMsgSlideRight 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .wa-msg-enter {
          animation: waMsgFadeIn 0.25s ease-out forwards;
        }
        @keyframes waMsgSlideLeft {
          from { opacity: 0; transform: translateX(-16px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes waMsgSlideRight {
          from { opacity: 0; transform: translateX(16px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes waMsgFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Typing dots */
        .wa-typing-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #8696a0;
          animation: waTypingBounce 1.2s ease-in-out infinite;
        }
        @keyframes waTypingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%           { transform: translateY(-5px); opacity: 1; }
        }

        /* Flow builder node animation */
        .flow-node-demo {
          animation: flowNodeAppear 0.6s ease-out forwards;
          opacity: 0;
        }
        @keyframes flowNodeAppear {
          from { opacity: 0; transform: translateY(12px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .flow-line-anim {
          stroke-dashoffset: 80;
          animation: flowLineDash 2s linear infinite;
        }
        @keyframes flowLineDash {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
