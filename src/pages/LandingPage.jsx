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
  List, Ban, AlertTriangle, Instagram, Facebook, Youtube, Languages,
  Brain, Target, IndianRupee, Headphones, Lock, Award, Rocket
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   Static content — features / plans / testimonials / faqs
   ═══════════════════════════════════════════════════════════════════════ */

const features = [
  { icon: BookOpen,     title: 'Booking Management',  desc: 'End-to-end booking lifecycle — from inquiry to payment confirmation, all in one dashboard.' },
  { icon: Mountain,     title: 'Trek Catalog',         desc: 'Create, publish, and manage trek packages with live inventory, itineraries, and instant go-live.' },
  { icon: Users,        title: 'Customer CRM',         desc: 'Track every trekker — booking history, LTV, tags, preferences. Turn first-timers into repeat customers.' },
  { icon: CalendarRange,title: 'Departure Batches',    desc: 'Schedule batches, assign guides, track seat availability, and manage capacity across all departures.' },
  { icon: CreditCard,   title: 'Finance & Invoicing',  desc: 'Razorpay & UPI payments, GST-compliant invoices (CGST/SGST/IGST), refunds and reconciliation.' },
  { icon: Megaphone,    title: 'Campaign Analytics',   desc: 'Track marketing spend, leads, conversions, and ROAS across Google Ads, Instagram, YouTube, and more.' },
  { icon: MessageSquare,title: 'WhatsApp Business API',desc: 'Verified green-tick number. Unlimited messages. AI replies. No bans — ever.' },
  { icon: Bell,         title: 'Smart Notifications',  desc: 'Instant alerts for new bookings, payments, low seats, and cancellations. Fully customizable.' },
  { icon: BarChart3,    title: 'Real-Time Dashboard',  desc: 'KPIs, revenue charts, booking trends, and regional breakdowns — all computed live from your data.' },
];

const plans = [
  {
    name: 'Starter',
    price: '₹0',
    period: 'Forever free',
    desc: 'Perfect for getting started',
    features: ['Up to 50 bookings/month', '1 admin user', 'Basic dashboard', 'Email support', 'WhatsApp chat (shared number)'],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Professional',
    price: '₹2,999',
    period: '/month + GST',
    desc: 'For growing trekking companies',
    features: ['Unlimited bookings', '5 team members', 'Own WhatsApp Business API number', 'AI chatbot replies', 'Campaign tracking', 'Priority support', 'Custom branding'],
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
  { name: 'Rajesh Sharma',  role: 'CEO, Himalaya Treks',           quote: 'TrekOps transformed how we manage 200+ departures per year. The dashboard alone saved us 10 hours a week.', rating: 5 },
  { name: 'Priya Negi',     role: 'Founder, Sahyadri Adventures',  quote: 'After 2 of our personal numbers got banned, TrekOps moved us to the official Business API. Our reply time dropped 5×, conversions doubled.', rating: 5 },
  { name: 'Vikram Singh',   role: 'Operations Head, Peak Expeditions', quote: 'From bookings to refunds, everything is automated. We\'ve scaled from 3 treks to 25 without adding ops staff.', rating: 5 },
];

const faqs = [
  { q: 'Will my WhatsApp number get banned if I run ads to it?',
    a: 'Not on TrekOps. Personal WhatsApp numbers get banned because Meta caps daily messages and flags marketing-style traffic. We move you to the official WhatsApp Business Cloud API — verified green tick, unlimited messages, zero ban risk.' },
  { q: 'How does the click-to-WhatsApp ad flow work?',
    a: 'You create an ad on Instagram, Facebook or Google. We give you a wa.me link tied to your TrekOps Business API number. The moment a customer clicks, our AI bot greets them, qualifies the lead, shares trek options, and can even confirm bookings + payment links — 24×7.' },
  { q: 'Does the AI bot speak Hindi and other Indian languages?',
    a: 'Yes — English, Hindi and Marathi out of the box, with Tamil, Telugu and Kannada in beta. The bot detects the language the customer types in and replies in the same language.' },
  { q: 'How long is the free trial?',
    a: 'Professional plan comes with a 30-day free trial. No credit card required. Starter plan is free forever.' },
  { q: 'Can I import my existing data?',
    a: 'Yes — CSV imports for treks, customers, and bookings. Our team will help you migrate for free.' },
  { q: 'How are payments handled in India?',
    a: 'We integrate with Razorpay — supports UPI, cards, net-banking, and wallets. GST is computed automatically (CGST/SGST for intra-state, IGST for inter-state) and added to every invoice.' },
  { q: 'Is my data secure & DPDP-compliant?',
    a: 'All data is encrypted in transit and at rest, hosted on AWS Mumbai (ap-south-1). We follow the Digital Personal Data Protection Act, 2023 — every tenant\'s data is fully isolated.' },
  { q: 'Can I customize the branding?',
    a: 'Pro and Enterprise plans include custom branding — your logo, colors, and domain on customer-facing pages and invoices.' },
];

/* ── WhatsApp Chat Messages — for the live demo iPhone ── */
const chatMessages = [
  { from: 'bot',  text: 'Hi! 👋 Welcome to TrekOps.\nHow can I help you today?',                                                                                                                            time: '10:30 AM', typingDelay: 1200 },
  { from: 'user', text: 'Hey! What treks do you have this weekend?',                                                                                                                                       time: '10:31 AM', typingDelay: 900 },
  { from: 'bot',  text: 'We have 3 amazing options! 🏔️\n\n1️⃣ Kalsubai Sunrise Trek\n2️⃣ Rajmachi Fort Night Trek\n3️⃣ Lohagad Monsoon Trek\n\nWhich one interests you?',                                  time: '10:31 AM', typingDelay: 1800 },
  { from: 'user', text: 'Kalsubai sounds great! Details please 🙏',                                                                                                                                        time: '10:32 AM', typingDelay: 800 },
  { from: 'bot',  text: 'Here you go! ⛰️\n\n📅 March 22–23, 2026\n⏰ Depart: Sat 10PM\n👥 8 seats left (20 total)\n💰 ₹2,800 per person\n📍 Pickup: Kasara Station\n\nIncludes transport, meals, camping gear & guide! 🎒', time: '10:32 AM', typingDelay: 2000 },
  { from: 'user', text: 'Book 3 seats! 💪',                                                                                                                                                                time: '10:33 AM', typingDelay: 700 },
  { from: 'bot',  text: '✅ Done! 3 seats confirmed.\n\n🎫 Booking ID: #TO-4291\n💳 Payment link sent to your number\n💲 Total: ₹8,400\n\nYou\'ll receive a packing list 24hrs before. See you at the summit! 🥾',         time: '10:33 AM', typingDelay: 1800 },
  { from: 'user', text: 'Amazing! Can\'t wait 🎉',                                                                                                                                                          time: '10:34 AM', typingDelay: 600 },
  { from: 'bot',  text: 'Happy trekking! 🌄\nReply anytime if you need help.',                                                                                                                              time: '10:34 AM', typingDelay: 1000 },
];

/* ═══════════════════════════════════════════════════════════════════════
   Small reusable hooks
   ═══════════════════════════════════════════════════════════════════════ */

/** Reveal-on-scroll: adds .is-visible to any element with .reveal */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** Animated count-up that triggers when in view */
function CountUp({ end, prefix = '', suffix = '', duration = 1600, decimals = 0 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const startTs = performance.now();
          const tick = (now) => {
            const t = Math.min(1, (now - startTs) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setVal(end * eased);
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [end, duration]);

  const formatted = decimals
    ? val.toFixed(decimals)
    : Math.round(val).toLocaleString('en-IN');

  return <span ref={ref} className="tabular-nums">{prefix}{formatted}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════
   Typing indicator + iPhone WhatsApp mockup (preserved from original)
   ═══════════════════════════════════════════════════════════════════════ */

function TypingIndicator() {
  return (
    <div className="wa-msg-enter" style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '4px' }}>
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
    let currentDelay = 800;

    const playConversation = () => {
      clearAllTimeouts();
      setVisibleMessages([]);
      setIsTyping(false);
      currentDelay = 800;

      chatMessages.forEach((msg, idx) => {
        addTimeout(() => setIsTyping(true), currentDelay);
        currentDelay += msg.typingDelay;
        const capturedIdx = idx;
        addTimeout(() => {
          setIsTyping(false);
          setVisibleMessages(prev => [...prev, capturedIdx]);
        }, currentDelay);
        currentDelay += 500;
      });

      addTimeout(() => playConversation(), currentDelay + 3000);
    };

    playConversation();
    return () => clearAllTimeouts();
  }, [addTimeout, clearAllTimeouts]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [visibleMessages, isTyping]);

  return (
    <div className="iphone-float" style={{ perspective: '1200px' }}>
      <div style={{
        position: 'relative', width: '290px', height: '600px',
        background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0d0d0d 100%)',
        borderRadius: '48px', padding: '10px',
        boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 25px 60px -12px rgba(0,0,0,0.5), 0 12px 28px -8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}>
        <div style={{ position: 'absolute', inset: '0', borderRadius: '48px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)',
          pointerEvents: 'none', zIndex: 5 }} />
        <div style={{ position: 'absolute', left: '-2.5px', top: '100px', width: '3px', height: '28px', background: '#2a2a2a', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: '-2.5px', top: '155px', width: '3px', height: '50px', background: '#2a2a2a', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: '-2.5px', top: '215px', width: '3px', height: '50px', background: '#2a2a2a', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', right: '-2.5px', top: '175px', width: '3px', height: '60px', background: '#2a2a2a', borderRadius: '0 2px 2px 0' }} />

        <div style={{
          position: 'relative', width: '100%', height: '100%',
          borderRadius: '40px', overflow: 'hidden', background: '#ECE5DD',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
            width: '90px', height: '28px', background: '#000', borderRadius: '20px', zIndex: 30 }}>
            <div style={{ position: 'absolute', right: '22px', top: '50%', transform: 'translateY(-50%)',
              width: '8px', height: '8px', borderRadius: '50%', background: '#1a1a2e' }} />
          </div>

          <div style={{
            position: 'relative', zIndex: 20, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 22px 0', height: '48px', background: '#075E54',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>9:41</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1px', alignItems: 'flex-end' }}>
                {[6,8,10,12].map((h,i) => <div key={i} style={{ width: '3px', height: `${h}px`, background: 'white', borderRadius: '1px' }} />)}
              </div>
              <span style={{ fontSize: '11px', color: 'white', fontWeight: 600, marginLeft: '2px' }}>5G</span>
              <div style={{ marginLeft: '4px', width: '22px', height: '10px', border: '1px solid white', borderRadius: '2px', position: 'relative', display: 'flex', alignItems: 'center', padding: '1px' }}>
                <div style={{ width: '70%', height: '100%', background: 'white', borderRadius: '1px' }} />
                <div style={{ position: 'absolute', right: '-4px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '5px', background: 'white' }} />
              </div>
            </div>
          </div>

          <div style={{
            position: 'relative', zIndex: 20, flexShrink: 0,
            background: '#075E54', padding: '6px 10px 10px',
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
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '4px' }}>
                TrekOps
                {/* Verified green tick badge */}
                <svg viewBox="0 0 24 24" width="12" height="12" fill="#25D366" stroke="white" strokeWidth="1.5">
                  <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" fill="#25D366" stroke="white" />
                </svg>
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.3 }}>
                {isTyping ? 'typing...' : 'online · AI replies'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
              <Video style={{ width: '17px', height: '17px', color: 'white' }} />
              <Phone style={{ width: '15px', height: '15px', color: 'white' }} />
              <MoreVertical style={{ width: '17px', height: '17px', color: 'white' }} />
            </div>
          </div>

          <div ref={chatRef} style={{
            flex: 1, overflowY: 'auto', padding: '10px 10px 6px',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M30 5c1 0 2 1 2 2s-1 2-2 2-2-1-2-2 1-2 2-2zM15 20c.5 0 1 .5 1 1s-.5 1-1 1-1-.5-1-1 .5-1 1-1zM45 35c.5 0 1 .5 1 1s-.5 1-1 1-1-.5-1-1 .5-1 1-1zM10 50c.5 0 1 .5 1 1s-.5 1-1 1-1-.5-1-1 .5-1 1-1z' fill='%23d5cfc6' fill-opacity='.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='60' height='60' fill='url(%23p)'/%3E%3C/svg%3E")`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', color: '#667781', background: '#e2ddd5', padding: '3px 10px', borderRadius: '6px', fontWeight: 500 }}>TODAY</span>
            </div>

            {visibleMessages.map((msgIdx) => {
              const msg = chatMessages[msgIdx];
              const isUser = msg.from === 'user';
              return (
                <div key={msgIdx} className={isUser ? 'wa-msg-slide-right' : 'wa-msg-slide-left'}
                  style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
                  <div style={{
                    maxWidth: '82%',
                    background: isUser ? '#D9FDD3' : 'white',
                    borderRadius: isUser ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                    padding: '5px 8px 3px', position: 'relative',
                    boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
                  }}>
                    <div style={{ fontSize: '11.5px', color: '#111B21', lineHeight: 1.4, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                      {msg.text}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                      <span style={{ fontSize: '9px', color: '#667781' }}>{msg.time}</span>
                      {isUser && <CheckCheck style={{ width: '13px', height: '13px', color: '#53BDEB' }} />}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && <TypingIndicator />}
          </div>

          <div style={{
            flexShrink: 0, zIndex: 20, padding: '5px 6px 22px',
            background: '#ECE5DD', display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              background: 'white', borderRadius: '20px', padding: '6px 10px', gap: '6px',
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

/* ═══════════════════════════════════════════════════════════════════════
   Social-Ad → WhatsApp funnel illustration
   ═══════════════════════════════════════════════════════════════════════ */

function AdToWhatsAppFunnel() {
  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Step 1 — Ad sources */}
        <div className="reveal bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative">
          <div className="absolute -top-3 left-5 px-2.5 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-full tracking-wider">STEP 1</div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 mt-1">Customer clicks your ad</p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-100">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center"><Instagram className="w-4 h-4 text-white" /></div>
              <span className="text-sm font-semibold text-slate-700">Instagram Ad</span>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-blue-50 border border-blue-100">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><Facebook className="w-4 h-4 text-white" /></div>
              <span className="text-sm font-semibold text-slate-700">Facebook Ad</span>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-red-50 border border-red-100">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center"><Youtube className="w-4 h-4 text-white" /></div>
              <span className="text-sm font-semibold text-slate-700">YouTube / Google</span>
            </div>
          </div>
        </div>

        {/* Step 2 — Funnel arrow */}
        <div className="reveal reveal-delay-1 hidden md:flex flex-col items-center justify-center relative">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Routes to</div>
          <svg viewBox="0 0 200 60" className="w-full h-12">
            <defs>
              <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"  stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <path d="M 0 30 L 180 30" stroke="url(#arrowGrad)" strokeWidth="3" strokeLinecap="round" />
            <path d="M 175 22 L 195 30 L 175 38 Z" fill="#059669" />
            <circle r="4" fill="#10b981" className="funnel-flow"><animateMotion dur="1.8s" repeatCount="indefinite" path="M 0 30 L 195 30" /></circle>
          </svg>
          <div className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Click to chat
          </div>
        </div>
        <div className="md:hidden flex items-center justify-center">
          <ArrowRight className="w-6 h-6 text-emerald-500 rotate-90" />
        </div>

        {/* Step 3 — TrekOps Business API */}
        <div className="reveal reveal-delay-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-2xl shadow-emerald-200 p-5 text-white relative overflow-hidden">
          <div className="absolute -top-3 left-5 px-2.5 py-0.5 bg-white text-emerald-700 text-[10px] font-bold rounded-full tracking-wider">STEP 2</div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-90 mb-3 mt-1">Lands on TrekOps</p>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1">
                Business API
                <svg viewBox="0 0 24 24" width="12" height="12" fill="white">
                  <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                </svg>
              </div>
              <div className="text-[10px] opacity-80">Verified · Green tick</div>
            </div>
          </div>
          <ul className="space-y-1.5 text-xs">
            <li className="flex items-center gap-1.5"><Check className="w-3 h-3 flex-shrink-0" /> AI auto-reply in &lt;1s</li>
            <li className="flex items-center gap-1.5"><Check className="w-3 h-3 flex-shrink-0" /> Unlimited messages</li>
            <li className="flex items-center gap-1.5"><Check className="w-3 h-3 flex-shrink-0" /> Zero ban risk</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   "Banned vs Verified" comparison
   ═══════════════════════════════════════════════════════════════════════ */

function BanVsBusinessAPI() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal WhatsApp — banned */}
      <div className="reveal bg-white rounded-3xl border-2 border-red-200 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-red-100/40 rounded-full blur-3xl" />
        <div className="flex items-center gap-3 mb-5 relative">
          <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
            <Ban className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Personal WhatsApp</h3>
            <p className="text-xs text-red-600 font-semibold uppercase tracking-wider">High ban risk</p>
          </div>
        </div>
        {/* Mock banned chat preview */}
        <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-slate-300" />
            <div className="text-xs font-semibold text-slate-600">+91 98xxx xxxxx (your number)</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 shake-x">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="text-xs font-bold text-red-700">Account banned</span>
            </div>
            <p className="text-[11px] text-red-700 leading-snug">
              Your phone number is banned from using WhatsApp. Tap to learn more.
            </p>
          </div>
        </div>
        <ul className="space-y-2.5 text-sm text-slate-600">
          <li className="flex items-start gap-2"><X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /> Banned after 50–100 ad replies</li>
          <li className="flex items-start gap-2"><X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /> No automation allowed</li>
          <li className="flex items-start gap-2"><X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /> Manual replies — slow, missed leads</li>
          <li className="flex items-start gap-2"><X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /> No team inbox or assignment</li>
          <li className="flex items-start gap-2"><X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /> No analytics</li>
        </ul>
      </div>

      {/* TrekOps Business API */}
      <div className="reveal reveal-delay-1 bg-gradient-to-br from-emerald-50 via-white to-green-50 rounded-3xl border-2 border-emerald-200 p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-emerald-100/50">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-100/50 rounded-full blur-3xl" />
        <div className="flex items-center gap-3 mb-5 relative">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center glow-pulse">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              TrekOps Business API
              <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full">SAFE</span>
            </h3>
            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Verified by Meta</p>
          </div>
        </div>
        {/* Mock verified chat preview */}
        <div className="bg-white rounded-2xl p-4 mb-5 border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
              <Mountain className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              YourBrand
              <svg viewBox="0 0 24 24" width="12" height="12" fill="#10b981" className="tick-bounce">
                <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
              <span className="text-[10px] text-slate-400 ml-1">Business Account</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-[11px] text-slate-700 leading-snug mb-2">
              <span className="font-bold">Hi Priya 👋</span> Welcome to YourBrand! Looking for a weekend trek?
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[9px] bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-medium">🏔️ Kalsubai</span>
              <span className="text-[9px] bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-medium">🌄 Rajmachi</span>
              <span className="text-[9px] bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-medium">⛰️ Lohagad</span>
            </div>
          </div>
        </div>
        <ul className="space-y-2.5 text-sm text-slate-700">
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /><span><b>Zero ban risk</b> — official Meta Cloud API</span></li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /><span><b>Unlimited messages</b> — scale your ads freely</span></li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /><span><b>AI replies in &lt;1s</b> — even at 3 AM</span></li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /><span><b>Team inbox</b> — assign chats, internal notes</span></li>
          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /><span><b>Verified green tick</b> — instant trust</span></li>
        </ul>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   AI Chatbot showcase
   ═══════════════════════════════════════════════════════════════════════ */

function AIChatbotShowcase() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* Left — chat sample showing AI intelligence */}
      <div className="reveal relative">
        <div className="absolute -inset-6 bg-gradient-to-br from-violet-200/40 to-fuchsia-200/30 rounded-3xl blur-3xl" />
        <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-violet-100/50 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white sparkle-spin" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1">TrekOps AI <Sparkles className="w-3 h-3 text-amber-500" /></div>
                <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online · 0.4s avg reply
                </div>
              </div>
            </div>
            <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 px-2 py-1 rounded-full font-semibold">GPT-4 powered</span>
          </div>

          {/* Bubbles */}
          <div className="space-y-3 text-sm">
            {/* user — Hindi */}
            <div className="flex justify-end">
              <div className="max-w-[80%] bg-emerald-100 text-slate-900 rounded-2xl rounded-br-sm px-3.5 py-2">
                <p className="text-[13px]">Bhai mujhe kal ka trek chahiye, 4 log hain, budget 3000 ka 🙏</p>
                <span className="text-[9px] text-slate-500 mt-0.5 block">10:42 AM</span>
              </div>
            </div>
            {/* AI — replies in Hindi, qualifies, books */}
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm">
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-violet-500" />
                  <span className="text-[10px] font-semibold text-violet-600">AI · detected: Hindi · intent: book trek</span>
                </div>
                <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">{`Namaste 🙏 Kal ke liye 3 options hain ₹3,000 ke andar:

1️⃣ Lohagad — ₹2,500/person (4 seats available)
2️⃣ Rajmachi — ₹2,800/person (full)
3️⃣ Kalsubai — ₹2,800/person (8 seats)

4 logon ke liye Lohagad perfect hai! Confirm karu? 🏔️`}</p>
                <span className="text-[9px] text-slate-400 mt-1 block">10:42 AM · ✓✓</span>
              </div>
            </div>
            {/* user */}
            <div className="flex justify-end">
              <div className="max-w-[80%] bg-emerald-100 text-slate-900 rounded-2xl rounded-br-sm px-3.5 py-2">
                <p className="text-[13px]">Haan confirm karo</p>
                <span className="text-[9px] text-slate-500 mt-0.5 block">10:43 AM</span>
              </div>
            </div>
            {/* AI booking confirmation */}
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm">
                <div className="flex items-center gap-1 mb-1">
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-semibold text-emerald-600">AI · created booking + payment link</span>
                </div>
                <p className="text-[13px] text-slate-700 leading-relaxed">✅ Booking confirmed!<br/>🎫 #TO-4438 · 4 seats · Lohagad<br/>💳 <u className="text-blue-600">razorpay.me/ton/10000</u></p>
                <span className="text-[9px] text-slate-400 mt-1 block">10:43 AM · ✓✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — capability list */}
      <div className="reveal reveal-delay-1 max-w-lg">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-50 border border-violet-200 rounded-full text-sm font-semibold text-violet-700 mb-6">
          <Brain className="w-3.5 h-3.5" /> Intelligent AI Chatbot
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Replies that feel{' '}
          <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent gradient-shift">human</span>
          {' '}— at machine speed
        </h2>
        <p className="mt-5 text-lg text-slate-600 leading-relaxed">
          Our AI bot doesn't just send canned messages. It understands intent, detects language, qualifies leads, suggests treks based on budget & dates, and creates the booking + payment link — all in seconds.
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Languages, title: 'Multilingual', desc: 'English, Hindi, Marathi out of the box. Replies in the same language the customer types.' },
            { icon: Target,    title: 'Lead qualifier', desc: 'Asks budget, dates, group size — pre-fills your CRM.' },
            { icon: IndianRupee, title: 'Books + bills',  desc: 'Creates the booking, sends Razorpay/UPI link, follows up.' },
            { icon: Clock,     title: '24×7 response',  desc: 'Answers at 3 AM with the same patience as 3 PM.' },
            { icon: Reply,     title: 'Human handoff',  desc: 'Detects when a query needs a real person — pings your team.' },
            { icon: Headphones,title: 'Trained on you', desc: 'Learns your treks, FAQs, refund policy. You stay in control.' },
          ].map((it, i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-slate-100 hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/50 transition-all">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center mb-3">
                <it.icon className="w-4 h-4 text-violet-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">{it.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Comparison table
   ═══════════════════════════════════════════════════════════════════════ */

function CompareTable() {
  const rows = [
    { label: 'Verified green tick',         personal: false, generic: 'Some',  trekops: true },
    { label: 'Unlimited daily messages',    personal: false, generic: true,    trekops: true },
    { label: 'Zero risk of WhatsApp ban',   personal: false, generic: true,    trekops: true },
    { label: 'AI replies (Hindi + English)',personal: false, generic: 'Add-on',trekops: true },
    { label: 'Auto booking + payment link', personal: false, generic: false,   trekops: true },
    { label: 'Trek catalog & inventory',    personal: false, generic: false,   trekops: true },
    { label: 'GST-compliant invoicing',     personal: false, generic: false,   trekops: true },
    { label: 'Team inbox + assignment',     personal: false, generic: true,    trekops: true },
    { label: 'India hosting & DPDP-ready',  personal: false, generic: 'Maybe', trekops: true },
  ];
  const Cell = ({ v }) => {
    if (v === true)  return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-600"><Check className="w-4 h-4" /></span>;
    if (v === false) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-50 text-red-500"><X className="w-4 h-4" /></span>;
    return <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200">{v}</span>;
  };
  return (
    <div className="reveal max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
      <div className="grid grid-cols-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <div className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Feature</div>
        <div className="px-3 py-4 text-center text-xs font-bold uppercase tracking-wider text-red-600">Personal WA</div>
        <div className="px-3 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-600">Generic Tools</div>
        <div className="px-3 py-4 text-center text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border-l border-r border-emerald-200">TrekOps</div>
      </div>
      {rows.map((row, i) => (
        <div key={i} className={`grid grid-cols-4 items-center ${i % 2 ? 'bg-slate-50/40' : 'bg-white'} border-b border-slate-100 last:border-b-0`}>
          <div className="px-5 py-4 text-sm font-medium text-slate-700">{row.label}</div>
          <div className="px-3 py-3 flex justify-center"><Cell v={row.personal} /></div>
          <div className="px-3 py-3 flex justify-center"><Cell v={row.generic} /></div>
          <div className="px-3 py-3 flex justify-center bg-emerald-50/40 border-l border-r border-emerald-100"><Cell v={row.trekops} /></div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Logo / stats marquee strip
   ═══════════════════════════════════════════════════════════════════════ */

function StatsMarquee() {
  const items = [
    { icon: Users,        label: '2,500+ trekkers booked' },
    { icon: Mountain,     label: '150+ active treks' },
    { icon: IndianRupee,  label: '₹45L+ revenue tracked' },
    { icon: MessageSquare,label: '50K+ AI replies sent' },
    { icon: Star,         label: '4.9★ operator rating' },
    { icon: Globe,        label: 'Operators across 12 states' },
    { icon: Shield,       label: '0 banned numbers' },
  ];
  // double the list for seamless marquee
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden py-6 border-y border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      <div className="marquee gap-12 px-6">
        {doubled.map((it, i) => (
          <div key={i} className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <it.icon className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Contact section (preserved)
   ═══════════════════════════════════════════════════════════════════════ */

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
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-sm font-semibold text-primary-700 mb-6">
            <Mail className="w-3.5 h-3.5" /> Get in Touch
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Talk to a trek-tech specialist</h2>
          <p className="mt-4 text-lg text-slate-500">
            Have questions about WhatsApp Business API onboarding, GST setup, or AI training on your treks? We respond in under 4 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="space-y-6 reveal">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Contact Information</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Email</p>
                    <a href="mailto:contact@trekops.in" className="text-sm text-primary-600 hover:text-primary-700">contact@trekops.in</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Phone</p>
                    <a href="tel:+918464892914" className="text-sm text-slate-600 hover:text-slate-900 block">+91 84648 92914</a>
                    <a href="tel:+919226001143" className="text-sm text-slate-600 hover:text-slate-900 block">+91 92260 01143</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Location</p>
                    <p className="text-sm text-slate-600">India 🇮🇳 · Hosted on AWS Mumbai</p>
                  </div>
                </div>
              </div>
            </div>

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

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 reveal reveal-delay-1">
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

/* ═══════════════════════════════════════════════════════════════════════
   MAIN — LandingPage
   ═══════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [rotatingPhrase, setRotatingPhrase] = useState(0);

  useScrollReveal();

  // Rotate hero highlight phrase
  const phrases = ['WhatsApp Ads', 'Instagram Reels', 'Facebook Campaigns', 'Google Search'];
  useEffect(() => {
    const id = setInterval(() => setRotatingPhrase(p => (p + 1) % phrases.length), 2200);
    return () => clearInterval(id);
  }, [phrases.length]);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Top announcement strip ── */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 text-white text-xs sm:text-sm py-2 px-4 text-center font-medium relative overflow-hidden">
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <span className="relative inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span><b>New:</b> AI-powered WhatsApp bot now in beta — replies in Hindi, English & Marathi</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>

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
            <div className="hidden md:flex items-center gap-7">
              <a href="#problem"   className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Why us</a>
              <a href="#features"  className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#ai-bot"    className="text-sm text-slate-600 hover:text-slate-900 transition-colors">AI Bot</a>
              <a href="#flow-builder" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Flow Builder</a>
              <a href="#pricing"   className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
              <a href="#contact"   className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Contact</a>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                Sign In
              </button>
              <button onClick={() => navigate('/login')} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-emerald-500 rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all">
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
            <a href="#problem"   className="block text-sm text-slate-600 py-2">Why us</a>
            <a href="#features"  className="block text-sm text-slate-600 py-2">Features</a>
            <a href="#ai-bot"    className="block text-sm text-slate-600 py-2">AI Bot</a>
            <a href="#pricing"   className="block text-sm text-slate-600 py-2">Pricing</a>
            <a href="#contact"   className="block text-sm text-slate-600 py-2">Contact</a>
            <button onClick={() => navigate('/login')} className="w-full mt-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-emerald-500 rounded-xl">Start Free Trial</button>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-emerald-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 blob-morph" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-100/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 blob-morph" style={{ animationDelay: '3s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 sm:pt-20 sm:pb-28">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 text-center lg:text-left max-w-xl reveal">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 border border-green-200 rounded-full text-sm font-medium text-green-700 mb-7">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                Official WhatsApp Business API · Built for India 🇮🇳
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-slate-900 leading-[1.05] tracking-tight">
                Turn{' '}
                <span key={rotatingPhrase} className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 bg-clip-text text-transparent gradient-shift inline-block animate-fade-in">
                  {phrases[rotatingPhrase]}
                </span>
                <br className="hidden sm:block" /> into bookings on{' '}
                <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">WhatsApp</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed">
                The complete CRM for Indian trek operators. Automate replies, confirm bookings and accept UPI payments — all on the official WhatsApp Business API. <b className="text-slate-900">No bans. No limits.</b>
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button onClick={() => navigate('/login')}
                  className="px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 flex items-center justify-center gap-2 group glow-pulse">
                  Start Free — 30 Days
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <a href="#ai-bot"
                  className="px-8 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  <Bot className="w-4 h-4" /> See AI Bot Demo
                </a>
              </div>

              {/* Live stats row */}
              <div className="mt-10 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900"><CountUp end={2500} suffix="+" /></div>
                  <div className="text-xs text-slate-500 mt-0.5">Trekkers booked</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">₹<CountUp end={45} suffix="L+" /></div>
                  <div className="text-xs text-slate-500 mt-0.5">Revenue tracked</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900"><CountUp end={4.9} decimals={1} suffix="★" /></div>
                  <div className="text-xs text-slate-500 mt-0.5">Operator rating</div>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 relative reveal reveal-delay-1">
              <div className="absolute -inset-10 bg-gradient-to-br from-green-200/40 via-emerald-100/20 to-teal-200/30 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-400/10 rounded-full blur-2xl" />
              {/* Floating side cards */}
              <div className="hidden lg:block absolute -left-16 top-10 bg-white rounded-2xl shadow-xl shadow-emerald-200/40 border border-slate-100 p-3 z-10 soft-float" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><Bell className="w-4 h-4 text-emerald-600" /></div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-900">New booking · ₹8,400</div>
                    <div className="text-[10px] text-slate-500">Kalsubai · 3 seats</div>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block absolute -right-12 bottom-12 bg-white rounded-2xl shadow-xl shadow-violet-200/40 border border-slate-100 p-3 z-10 soft-float" style={{ animationDelay: '1.6s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"><Brain className="w-4 h-4 text-white" /></div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-900">AI replied in 0.4s</div>
                    <div className="text-[10px] text-slate-500">Hindi · auto-detected</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <IPhoneMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats marquee strip ── */}
      <StatsMarquee />

      {/* ── PROBLEM section ── */}
      <section id="problem" className="py-20 sm:py-24 bg-white relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-red-100/30 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 border border-red-200 rounded-full text-sm font-semibold text-red-700 mb-5">
              <AlertTriangle className="w-3.5 h-3.5" /> The Problem
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Running ads to your <span className="text-red-600">personal WhatsApp</span>?
            </h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Every day, dozens of trek operators get their numbers banned the moment a campaign goes live. Meta flags personal numbers receiving high-volume ad traffic — your inbox dies, your money is wasted, and customers can't reach you.
            </p>
          </div>

          <AdToWhatsAppFunnel />

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Ban,           title: 'Bans after 50–100 ad replies',  desc: 'WhatsApp\'s anti-spam catches "marketing" patterns and shuts you down.' },
              { icon: Clock,         title: 'Hours wasted typing replies',     desc: 'You\'re manually answering "What\'s the price?" 100 times a day.' },
              { icon: TrendingUp,    title: 'Lost leads at 3 AM',              desc: 'Customers chat after work — by morning they\'ve booked with someone else.' },
            ].map((it, i) => (
              <div key={i} className={`reveal reveal-delay-${i+1} bg-white rounded-2xl border border-slate-100 p-5`}>
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-3">
                  <it.icon className="w-5 h-5 text-red-600" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1.5">{it.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{it.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION section — Banned vs Verified ── */}
      <section className="py-20 sm:py-24 bg-gradient-to-b from-slate-50 via-emerald-50/30 to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-sm font-semibold text-emerald-700 mb-5">
              <Shield className="w-3.5 h-3.5" /> The TrekOps Way
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Move to the <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">official WhatsApp Business API</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              We onboard your number to Meta's Cloud API in under 48 hours. Verified green tick, unlimited messages, AI replies — all wired into your TrekOps dashboard.
            </p>
          </div>

          <BanVsBusinessAPI />
        </div>
      </section>

      {/* ── AI Chatbot section ── */}
      <section id="ai-bot" className="py-20 sm:py-28 bg-white relative overflow-hidden">
        <div className="absolute top-20 right-10 w-96 h-96 bg-violet-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-fuchsia-100/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AIChatbotShowcase />
        </div>
      </section>

      {/* ── Live demo iPhone (re-using mockup) ── */}
      <section id="whatsapp" className="py-20 sm:py-28 bg-gradient-to-b from-green-50/60 via-emerald-50/30 to-white relative overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-emerald-100/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-shrink-0 order-2 lg:order-1 reveal">
              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-to-br from-green-200/30 to-emerald-200/20 rounded-full blur-2xl" />
                <div className="relative">
                  <IPhoneMockup />
                </div>
              </div>
            </div>

            <div className="flex-1 order-1 lg:order-2 max-w-xl text-center lg:text-left reveal reveal-delay-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 border border-green-200 rounded-full text-sm font-semibold text-green-700 mb-6">
                <MessageSquare className="w-4 h-4" /> Live Demo
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Watch a booking happen in{' '}
                <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">real-time</span>
              </h2>
              <p className="mt-5 text-lg text-slate-600 leading-relaxed">
                This is what your customer sees the moment they click your Instagram or Google ad. The AI greets them, suggests treks, locks the seats, and sends a Razorpay payment link — without you lifting a finger.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: Zap,        title: 'Instant Auto-Replies',     desc: 'Respond in &lt;1s, 24/7, with smart AI conversation flows.' },
                  { icon: CheckCheck, title: 'Booking Confirmations',    desc: 'Booking IDs, payment links, and itinerary auto-sent.' },
                  { icon: Bell,       title: 'Payment & Trek Reminders', desc: 'Gentle nudges for payments, packing lists, and meet-up times.' },
                  { icon: MessageSquare, title: 'Unified Inbox',          desc: 'Every conversation, one dashboard. No message missed.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-sm text-slate-500 mt-0.5" dangerouslySetInnerHTML={{ __html: item.desc }} />
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => navigate('/login')}
                className="mt-10 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 inline-flex items-center gap-2 group">
                Try WhatsApp Integration
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-sm font-medium text-emerald-700 mb-4">
              <Settings className="w-3.5 h-3.5" /> Everything you need
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">One platform. Every feature.</h2>
            <p className="mt-4 text-lg text-slate-500">Stop juggling spreadsheets, WhatsApp groups, and accounting software. TrekOps handles it all.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className={`reveal reveal-delay-${(i % 4) + 1} group p-6 rounded-2xl border border-slate-100 hover:border-primary-200 bg-white hover:bg-gradient-to-br hover:from-primary-50/50 hover:to-emerald-50/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary-100/50 hover:-translate-y-1`}>
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

      {/* ── Flow Builder ── */}
      <section id="flow-builder" className="py-20 sm:py-28 bg-gradient-to-b from-slate-50 via-indigo-50/30 to-white relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-100/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 reveal">
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
            <div className="flex-1 relative reveal">
              <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-indigo-200/30 overflow-hidden">
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
                <div className="p-6 min-h-[340px] relative" style={{ background: 'radial-gradient(circle at 20px 20px, #e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                  <div className="flow-node-demo absolute" style={{ left: '8%', top: '25%' }}>
                    <div className="bg-white rounded-xl border-2 border-emerald-300 shadow-lg shadow-emerald-100/50 px-4 py-3 min-w-[140px]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center"><Zap className="w-3 h-3 text-emerald-600" /></div>
                        <span className="text-[11px] font-bold text-emerald-700">START</span>
                      </div>
                      <p className="text-[10px] text-slate-500">hi, hello, hey</p>
                    </div>
                  </div>
                  <svg className="absolute" style={{ left: '22%', top: '38%', width: '120px', height: '60px' }} viewBox="0 0 120 60">
                    <path d="M 0 5 C 60 5, 60 55, 120 55" stroke="#818cf8" strokeWidth="2" fill="none" strokeDasharray="4 3" className="flow-line-anim" />
                    <circle cx="120" cy="55" r="3" fill="#818cf8" />
                  </svg>
                  <div className="flow-node-demo absolute" style={{ left: '38%', top: '50%', animationDelay: '0.5s' }}>
                    <div className="bg-white rounded-xl border-2 border-amber-300 shadow-lg shadow-amber-100/50 px-4 py-3 min-w-[150px]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center"><List className="w-3 h-3 text-amber-600" /></div>
                        <span className="text-[11px] font-bold text-amber-700">BUTTONS</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-1.5">Choose your city 🏙️</p>
                      <div className="flex gap-1">
                        <span className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">Pune</span>
                        <span className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">Mumbai</span>
                      </div>
                    </div>
                  </div>
                  <svg className="absolute" style={{ left: '58%', top: '30%', width: '100px', height: '40px' }} viewBox="0 0 100 40">
                    <path d="M 0 35 C 50 35, 50 5, 100 5" stroke="#818cf8" strokeWidth="2" fill="none" strokeDasharray="4 3" className="flow-line-anim" style={{ animationDelay: '1s' }} />
                    <circle cx="100" cy="5" r="3" fill="#818cf8" />
                  </svg>
                  <div className="flow-node-demo absolute" style={{ left: '65%', top: '12%', animationDelay: '1s' }}>
                    <div className="bg-white rounded-xl border-2 border-cyan-300 shadow-lg shadow-cyan-100/50 px-4 py-3 min-w-[150px]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-md bg-cyan-100 flex items-center justify-center"><BarChart3 className="w-3 h-3 text-cyan-600" /></div>
                        <span className="text-[11px] font-bold text-cyan-700">DYNAMIC LIST</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Source: Live Treks</p>
                      <span className="text-[8px] bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">from DB</span>
                    </div>
                  </div>
                  <svg className="absolute" style={{ left: '72%', top: '40%', width: '80px', height: '50px' }} viewBox="0 0 80 50">
                    <path d="M 0 0 C 40 0, 40 50, 80 50" stroke="#818cf8" strokeWidth="2" fill="none" strokeDasharray="4 3" className="flow-line-anim" style={{ animationDelay: '1.5s' }} />
                    <circle cx="80" cy="50" r="3" fill="#818cf8" />
                  </svg>
                  <div className="flow-node-demo absolute" style={{ left: '78%', top: '65%', animationDelay: '1.5s' }}>
                    <div className="bg-white rounded-xl border-2 border-rose-300 shadow-lg shadow-rose-100/50 px-4 py-3 min-w-[130px]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-md bg-rose-100 flex items-center justify-center"><Check className="w-3 h-3 text-rose-600" /></div>
                        <span className="text-[11px] font-bold text-rose-700">BOOKING</span>
                      </div>
                      <p className="text-[10px] text-slate-500">✅ Payment link sent</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 max-w-lg reveal reveal-delay-1">
              <div className="space-y-5">
                {[
                  { icon: GitBranch,  title: 'Drag & Drop Nodes',                  desc: 'Build complex conversation flows visually — Start, Text, Buttons, Lists, Dynamic Data, and more.', color: 'bg-indigo-100 text-indigo-600' },
                  { icon: BarChart3,  title: 'Live Data from Your Database',       desc: 'Pull cities, treks, departures, and dates directly from your TrekOps data — always up to date.', color: 'bg-cyan-100 text-cyan-600' },
                  { icon: Sparkles,   title: 'Instant WhatsApp Preview',           desc: 'Watch your flow come alive in a real-time WhatsApp chat simulator before going live.',          color: 'bg-violet-100 text-violet-600' },
                  { icon: Shield,     title: 'One-Click Deploy',                   desc: 'Save your flow and it instantly goes live on your WhatsApp Business number. Zero downtime.',     color: 'bg-emerald-100 text-emerald-600' },
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
              <button onClick={() => navigate('/login')}
                className="mt-8 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-500 rounded-xl hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 inline-flex items-center gap-2 group">
                Try Flow Builder
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Get started in 3 steps</h2>
            <p className="mt-4 text-lg text-slate-500">Go from zero to fully operational in under 10 minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: '01', icon: Rocket,        title: 'Sign up & connect',        desc: 'Create your TrekOps account, link your WhatsApp Business number — we onboard you to Meta\'s Cloud API.' },
              { step: '02', icon: Mountain,      title: 'Add your treks & flows',   desc: 'Import treks, set departures and pricing. Train the AI bot on your refund policy and FAQs.' },
              { step: '03', icon: TrendingUp,    title: 'Run ads & take bookings',  desc: 'Point your Instagram, Facebook & Google ads to your TrekOps WhatsApp link — bookings flow in 24/7.' },
            ].map((s, i) => (
              <div key={i} className={`reveal reveal-delay-${i+1} text-center relative`}>
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-500/30 mb-5 relative">
                  <s.icon className="w-7 h-7" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-[11px] font-extrabold text-primary-700 shadow-md border border-primary-100">{s.step}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="py-20 sm:py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-sm font-medium text-amber-700 mb-4">
              <Award className="w-3.5 h-3.5" /> Side by side
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">How TrekOps stacks up</h2>
            <p className="mt-4 text-lg text-slate-500">Personal WhatsApp vs generic chatbots vs the platform built for trek operators in India.</p>
          </div>
          <CompareTable />
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 border border-primary-100 rounded-full text-sm font-medium text-primary-700 mb-4">
              <CreditCard className="w-3.5 h-3.5" /> Simple pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Plans for every stage</h2>
            <p className="mt-3 text-lg text-slate-500">Start free. Upgrade when you grow. All prices in INR. <span className="text-slate-400">GST extra at 18%.</span></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p, i) => (
              <div key={i} className={`reveal reveal-delay-${i+1} relative rounded-2xl p-8 flex flex-col ${
                  p.popular
                    ? 'bg-gradient-to-br from-primary-600 to-emerald-500 text-white shadow-2xl shadow-primary-500/30 scale-[1.03] z-10'
                    : 'bg-white border border-slate-200 hover:border-primary-200 hover:shadow-lg transition-all'
                }`}>
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full shadow-sm">MOST POPULAR</div>
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
                <button onClick={() => navigate('/login')}
                  className={`mt-8 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    p.popular ? 'bg-white text-primary-700 hover:bg-primary-50 shadow-sm'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center text-sm text-slate-500 flex items-center justify-center gap-6 flex-wrap">
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Secure UPI / Razorpay</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> DPDP Act compliant</span>
            <span className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" /> GST invoice provided</span>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Loved by operators across India</h2>
            <p className="mt-3 text-lg text-slate-500">From the Sahyadris to the Himalayas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className={`reveal reveal-delay-${i+1} bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all`}>
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
          <div className="text-center mb-12 reveal">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="mt-3 text-base text-slate-500">Quick answers about WhatsApp Business API, pricing, and onboarding.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="reveal border border-slate-100 rounded-xl overflow-hidden hover:border-primary-200 transition-colors bg-white">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-semibold text-slate-900">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-slate-500 leading-relaxed animate-fade-in">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden reveal">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute inset-0 shimmer pointer-events-none opacity-30" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur rounded-full text-xs font-semibold text-white/90 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" /> Limited beta · 50 spots/month
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Stop losing leads on WhatsApp.</h2>
              <p className="mt-4 text-lg text-emerald-100/80 max-w-xl mx-auto">
                Join Indian trek operators who run ads to WhatsApp Business API + AI bot — and never miss a booking again.
              </p>
              <button onClick={() => navigate('/login')}
                className="mt-8 px-10 py-4 bg-white text-green-700 font-bold text-base rounded-xl hover:bg-green-50 transition-colors shadow-lg shadow-green-800/20 inline-flex items-center gap-2 group">
                Get Started Free — 30 Days
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="mt-4 text-xs text-white/70">No credit card required · Cancel anytime · GST invoice provided</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
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
              <p className="text-sm text-slate-400 leading-relaxed">The complete CRM for trekking operators. Built in India 🇮🇳<br /><span className="text-slate-500">trekops.in</span></p>
              <div className="mt-3 space-y-1">
                <a href="mailto:contact@trekops.in" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> contact@trekops.in</a>
                <a href="tel:+918464892914"        className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +91 84648 92914</a>
                <a href="tel:+919226001143"        className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +91 92260 01143</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><a href="#features"     className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#ai-bot"       className="hover:text-white transition-colors">AI WhatsApp Bot</a></li>
                <li><a href="#flow-builder" className="hover:text-white transition-colors">Flow Builder</a></li>
                <li><a href="#pricing"      className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Refund Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">DPDP Notice</a></li>
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

      {/* iPhone + flow-builder animation styles (kept inline to avoid global pollution) */}
      <style>{`
        .iphone-float { animation: iphoneFloat 4s ease-in-out infinite; }
        @keyframes iphoneFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }

        .wa-msg-slide-left  { animation: waMsgSlideLeft  0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .wa-msg-slide-right { animation: waMsgSlideRight 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .wa-msg-enter       { animation: waMsgFadeIn     0.25s ease-out forwards; }
        @keyframes waMsgSlideLeft  { from { opacity: 0; transform: translateX(-16px) scale(0.95); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes waMsgSlideRight { from { opacity: 0; transform: translateX( 16px) scale(0.95); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes waMsgFadeIn     { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

        .wa-typing-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #8696a0; animation: waTypingBounce 1.2s ease-in-out infinite; }
        @keyframes waTypingBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-5px); opacity: 1; } }

        .flow-node-demo { animation: flowNodeAppear 0.6s ease-out forwards; opacity: 0; }
        @keyframes flowNodeAppear { from { opacity: 0; transform: translateY(12px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .flow-line-anim { stroke-dashoffset: 80; animation: flowLineDash 2s linear infinite; }
        @keyframes flowLineDash { to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}
