import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';
import { GET_CHATS, GET_MESSAGES, GET_CONVERSATION_LOGS, GET_STAFF_USERS, ASSIGN_GUIDE, UNASSIGN_GUIDE, TOGGLE_AI } from '../graphql/queries';
import { SEND_MESSAGE } from '../graphql/mutations';
import { io } from 'socket.io-client';
import { Search, Send, Paperclip, MoreVertical, Phone as PhoneIcon, PhoneOff, PhoneIncoming, Mic, MicOff, Check, CheckCheck, ArrowLeft, MessageCircle, FileText, CreditCard, SmilePlus, Loader2, RefreshCw, List, ChevronRight, PenSquare, X, Image, Film, Music, File, AlertCircle, Bot, BotOff, UserPlus, UserMinus, UserCheck, Info } from 'lucide-react';
import { useWhatsAppCall } from '../hooks/useWhatsAppCall';

function DeliveryTick({ status, failureReason }) {
  if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-300" title="Read" />;
  if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5" title="Delivered" />;
  if (status === 'sent') return <Check className="w-3.5 h-3.5 opacity-70" title="Sent" />;
  if (status === 'failed') return <AlertCircle className="w-3.5 h-3.5 text-red-400" title={failureReason || 'Failed to deliver'} />;
  return <Check className="w-3.5 h-3.5 opacity-40" title="Sending…" />;
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/').replace(/\/$/, '');

function fileIcon(file) {
  if (!file) return File;
  const t = file.type || '';
  if (t.startsWith('image/')) return Image;
  if (t.startsWith('video/')) return Film;
  if (t.startsWith('audio/')) return Music;
  return FileText;
}

function MediaMessage({ raw, message, isOutbound }) {
  const type = raw?.type;
  if (type === 'image') {
    const caption = raw.image?.caption || message || '';
    return (
      <div>
        <div className={`flex items-center gap-2 px-1 py-2 rounded-lg ${isOutbound ? 'bg-white/10' : 'bg-slate-50'}`}>
          <Image className="w-8 h-8 shrink-0 text-current opacity-70" />
          <span className="text-xs opacity-80">Photo</span>
        </div>
        {caption && <p className="text-xs mt-1 opacity-90">{caption}</p>}
      </div>
    );
  }
  if (type === 'document') {
    const name = raw.document?.filename || raw.document?.caption || message || 'Document';
    return (
      <div className={`flex items-center gap-2 px-2 py-2 rounded-lg ${isOutbound ? 'bg-white/10' : 'bg-slate-50'}`}>
        <FileText className="w-7 h-7 shrink-0 opacity-70" />
        <span className="text-xs font-medium truncate max-w-[160px]">{name}</span>
      </div>
    );
  }
  if (type === 'video') {
    return (
      <div className={`flex items-center gap-2 px-2 py-2 rounded-lg ${isOutbound ? 'bg-white/10' : 'bg-slate-50'}`}>
        <Film className="w-7 h-7 shrink-0 opacity-70" />
        <span className="text-xs opacity-80">Video</span>
      </div>
    );
  }
  if (type === 'audio') {
    return (
      <div className={`flex items-center gap-2 px-2 py-2 rounded-lg ${isOutbound ? 'bg-white/10' : 'bg-slate-50'}`}>
        <Music className="w-7 h-7 shrink-0 opacity-70" />
        <span className="text-xs opacity-80">Audio</span>
      </div>
    );
  }
  return null;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_GRAPHQL_URL?.replace('/graphql', '') || 'http://localhost:8080';

const quickReplies = [
  { label: 'Packing List PDF', icon: FileText },
  { label: 'Payment Link', icon: CreditCard },
  { label: 'Trek Itinerary', icon: FileText },
];

// Parse WhatsApp-style bold (*text*) and URLs, render as <strong> / <a>
function parseWhatsAppText(text) {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+\*|https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={i}>{part.slice(1, -1)}</strong>;
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          className="underline break-all"
          onClick={e => e.stopPropagation()}
        >{part}</a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// Render interactive buttons from raw payload
function InteractiveButtons({ raw, isOutbound }) {
  if (!raw?.interactive) return null;
  const { type, action } = raw.interactive;

  if (type === 'button' && action?.buttons) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {action.buttons.map((btn) => (
          <span
            key={btn.reply.id}
            className={`inline-block px-3 py-1.5 rounded-lg text-xs font-medium border
              ${isOutbound
                ? 'border-white/30 text-white/90'
                : 'border-slate-200 text-primary-600 bg-white'
              }`}
          >
            {btn.reply.title}
          </span>
        ))}
      </div>
    );
  }

  if (type === 'list' && action?.sections) {
    return (
      <div className="mt-2 space-y-1">
        <div className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${isOutbound ? 'text-white/70' : 'text-slate-400'}`}>
          <List className="w-3 h-3" />
          {action.button || 'View Options'}
        </div>
        {action.sections.map((section, si) => (
          <div key={si}>
            {section.rows?.map((row) => (
              <div
                key={row.id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs mb-0.5
                  ${isOutbound ? 'bg-white/10' : 'bg-slate-50 border border-slate-100'}`}
              >
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className={`font-medium truncate ${isOutbound ? 'text-white' : 'text-slate-700'}`}>{row.title}</div>
                  {row.description && (
                    <div className={`text-[10px] mt-0.5 truncate ${isOutbound ? 'text-white/60' : 'text-slate-400'}`}>{row.description}</div>
                  )}
                </div>
                <ChevronRight className={`w-3 h-3 shrink-0 ml-1 ${isOutbound ? 'text-white/40' : 'text-slate-300'}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return null;
}

const PAGE_SIZE = 30;

export default function SupportChatPage() {
  const [activePhone, setActivePhone] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [liveMessages, setLiveMessages] = useState([]);
  const [statusUpdates, setStatusUpdates] = useState({}); // waMessageId → deliveryStatus
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null); // scroll container for messages area
  const socketRef = useRef(null);
  // socketInstance is kept in state so hook re-renders when the socket connects
  const [socketInstance, setSocketInstance] = useState(null);
  const fileInputRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [sendingFiles, setSendingFiles] = useState(false);

  // ─── Pagination state ──────────────────────────────
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  // Saved scroll offset used to restore position after prepending older messages
  const savedScrollOffset = useRef(null);
  // Whether user is near bottom — controls auto-scroll vs "new messages" pill
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showNewMsgPill, setShowNewMsgPill] = useState(false);
  const apolloClient = useApolloClient();

  // ─── WhatsApp Call ─────────────────────────────────
  const {
    callState,
    incomingCall,
    permissionPhone,
    muted,
    error: callError,
    audioRef,
    startCall,
    answerCall,
    rejectCall,
    terminateCall,
    toggleMute,
    requestCallPermission,
  } = useWhatsAppCall({ socket: socketInstance });

  // ─── Active call: elapsed seconds timer ───────────
  const [callSeconds, setCallSeconds] = useState(0);
  useEffect(() => {
    if (callState !== 'in-call') { setCallSeconds(0); return; }
    const id = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [callState]);

  const handleCallClick = useCallback(() => {
    if (!activePhone) return;
    if (callState === 'idle') {
      startCall(activePhone);
    } else if (callState === 'needs-permission') {
      requestCallPermission(activePhone);
    } else if (callState !== 'ringing-in' && callState !== 'needs-permission' && callState !== 'permission-requested') {
      terminateCall();
    }
  }, [activePhone, callState, startCall, terminateCall, requestCallPermission]);

  const formatCallDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── Guide Oversight State ─────────────────────────
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState('');

  // ─── New Message Modal ─────────────────────────────
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [newPhone, setNewPhone] = useState('91');
  const [newText, setNewText] = useState('');
  const [newMsgError, setNewMsgError] = useState('');

  // ─── GraphQL: Contacts (initial load only) ─────────
  const { data: chatsData, loading: chatsLoading, refetch: refetchChats } = useQuery(GET_CHATS);

  // ─── GraphQL: Messages for active phone (initial load, paginated) ─
  const { data: messagesData, loading: messagesLoading, refetch: refetchMessages, fetchMore } = useQuery(GET_MESSAGES, {
    variables: { phone: activePhone, limit: PAGE_SIZE },
    skip: !activePhone,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      setHasMore(data?.getMessages?.hasMore ?? false);
    },
  });

  // ─── GraphQL: Conversation logs for active phone ───
  const { data: logsData, refetch: refetchLogs } = useQuery(GET_CONVERSATION_LOGS, {
    variables: { phone: activePhone },
    skip: !activePhone,
    fetchPolicy: 'cache-and-network',
  });

  // ─── GraphQL: Staff users for guide assignment ─────
  const { data: staffData } = useQuery(GET_STAFF_USERS, { fetchPolicy: 'cache-first' });

  // ─── GraphQL: Send message ─────────────────────────
  const [sendMessageMutation, { loading: sending }] = useMutation(SEND_MESSAGE);

  // ─── GraphQL: Guide oversight mutations ───────────
  const [assignGuide, { loading: assigning }] = useMutation(ASSIGN_GUIDE);
  const [unassignGuide, { loading: unassigning }] = useMutation(UNASSIGN_GUIDE);
  const [toggleAIMutation, { loading: toggling }] = useMutation(TOGGLE_AI);

  // ─── Socket.IO for real-time updates ───────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    // Expose to state so useWhatsAppCall can subscribe once connected
    setSocketInstance(socket);

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('newMessage', (msg) => {
      // Append to live messages
      setLiveMessages(prev => {
        // Deduplicate by _id
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Refresh contact list to update last message / counts
      refetchChats();
      // The scroll auto-scroll / pill logic runs in the messages useEffect
    });

    socket.on('messageStatusUpdate', ({ waMessageId, deliveryStatus, deliveryFailureReason }) => {
      if (!waMessageId) return;
      setStatusUpdates(prev => ({ ...prev, [waMessageId]: { deliveryStatus, deliveryFailureReason } }));
      // Also patch liveMessages if the message is there
      setLiveMessages(prev => prev.map(m =>
        m.waMessageId === waMessageId ? { ...m, deliveryStatus, deliveryFailureReason } : m
      ));
    });

    socket.on('conversationAssigned', () => { refetchChats(); });
    socket.on('aiToggled', () => { refetchChats(); });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
    };
  }, [refetchChats]);

  // Reset live messages, attachments, pagination state, and panel state when switching chats
  useEffect(() => {
    setLiveMessages([]);
    setAttachedFiles([]);
    setMessage('');
    setShowInfoPanel(false);
    setSelectedGuideId('');
    setHasMore(false);
    setLoadingOlder(false);
    setIsNearBottom(true);
    setShowNewMsgPill(false);
    savedScrollOffset.current = null;
    // Evict cached messages for the previous phone so the next chat starts fresh
    // (the keyArgs policy means each phone has its own cache entry)
    if (activePhone) {
      apolloClient.cache.evict({
        fieldName: 'getMessages',
        args: { phone: activePhone },
      });
      apolloClient.cache.gc();
    }
  }, [activePhone]); // eslint-disable-line react-hooks/exhaustive-deps

  const contacts = useMemo(() => {
    return chatsData?.getChats || [];
  }, [chatsData]);

  // Merge paginated DB messages with live socket messages for the active phone
  const messages = useMemo(() => {
    const dbMessages = messagesData?.getMessages?.messages || [];
    const phoneMessages = liveMessages.filter(m => m.phone === activePhone);
    // Merge and deduplicate
    const allMap = new Map();
    dbMessages.forEach(m => allMap.set(m._id, m));
    phoneMessages.forEach(m => allMap.set(m._id, m));
    return Array.from(allMap.values()).sort(
      (a, b) => new Date(Number(a.createdAt) || a.createdAt) - new Date(Number(b.createdAt) || b.createdAt)
    );
  }, [messagesData, liveMessages, activePhone]);

  const activeContact = useMemo(() => {
    return contacts.find(c => c.phone === activePhone) || null;
  }, [contacts, activePhone]);

  // Caller name for incoming call modal
  const incomingCallerName = useMemo(() => {
    if (!incomingCall?.phone) return null;
    const contact = contacts.find(c => c.phone === incomingCall.phone);
    return contact?.name || null;
  }, [incomingCall, contacts]);

  const filteredContacts = useMemo(() =>
    contacts.filter(c =>
      (c.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [contacts, searchTerm]
  );

  // ─── Derive guide oversight values from active contact ─
  const logs = logsData?.getConversationLogs || [];
  const staffUsers = staffData?.getStaffUsers || [];
  const aiEnabled = activeContact?.aiEnabled !== false; // default true if not set
  const assignedGuideId = activeContact?.assignedGuideId || null;
  const assignedGuideName = activeContact?.assignedGuideName || null;

  // After older messages are prepended: restore scroll position so the user stays on the
  // same message they were reading (no visible jump). Must be synchronous (useLayoutEffect).
  useLayoutEffect(() => {
    if (savedScrollOffset.current !== null && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight - savedScrollOffset.current;
      savedScrollOffset.current = null;
    }
  }, [messages]);

  // Scroll to bottom when the chat first loads (initial render with messages)
  const prevActivePhoneRef = useRef(null);
  useEffect(() => {
    if (activePhone !== prevActivePhoneRef.current) {
      prevActivePhoneRef.current = activePhone;
      // Chat switched — scroll to bottom after first paint
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
      return;
    }
    // Existing chat: only auto-scroll if user is near the bottom
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowNewMsgPill(false);
    } else {
      // User is reading old messages — show the pill for new arrivals
      setShowNewMsgPill(true);
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Helper: format relative time for activity log ─
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // ─── Guide oversight handlers ──────────────────────
  const handleToggleAI = useCallback(async () => {
    const newEnabled = !aiEnabled;
    if (!newEnabled) {
      const ok = window.confirm('Turn off AI? The bot will stop responding. You must reply manually.');
      if (!ok) return;
    }
    try {
      await toggleAIMutation({ variables: { phone: activePhone, enabled: newEnabled } });
      await refetchChats();
      refetchLogs();
    } catch (e) { console.error(e); }
  }, [aiEnabled, activePhone, toggleAIMutation, refetchChats, refetchLogs]);

  const handleAssignGuide = useCallback(async () => {
    if (!selectedGuideId || !activePhone) return;
    try {
      await assignGuide({ variables: { phone: activePhone, guideId: selectedGuideId } });
      setSelectedGuideId('');
      await refetchChats();
      refetchLogs();
    } catch (e) { console.error(e); }
  }, [selectedGuideId, activePhone, assignGuide, refetchChats, refetchLogs]);

  const handleUnassignGuide = useCallback(async () => {
    if (!activePhone) return;
    try {
      await unassignGuide({ variables: { phone: activePhone } });
      await refetchChats();
      refetchLogs();
    } catch (e) { console.error(e); }
  }, [activePhone, unassignGuide, refetchChats, refetchLogs]);

  const handleSend = useCallback(async () => {
    if (!message.trim() || !activePhone) return;
    const text = message.trim();
    setMessage('');
    try {
      await sendMessageMutation({ variables: { phone: activePhone, text } });
      // Socket will handle the update via newMessage event
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessage(text);
    }
  }, [message, activePhone, sendMessageMutation]);

  const handleRetry = useCallback(async (msg) => {
    const text = msg.message;
    if (!text || !activePhone) return;
    try {
      await sendMessageMutation({ variables: { phone: activePhone, text } });
    } catch (err) {
      console.error('Retry failed:', err);
    }
  }, [activePhone, sendMessageMutation]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 10);
    setAttachedFiles(prev => [...prev, ...files].slice(0, 10));
    e.target.value = '';
  };

  const removeAttachment = (idx) => setAttachedFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSendFiles = useCallback(async () => {
    if (!activePhone || (attachedFiles.length === 0 && !message.trim())) return;
    setSendingFiles(true);
    try {
      const form = new FormData();
      attachedFiles.forEach(f => form.append('files', f));
      if (message.trim()) form.append('text', message.trim());
      await fetch(`${API_URL}/api/chat/${activePhone}/send-files`, { method: 'POST', body: form });
      setAttachedFiles([]);
      setMessage('');
    } catch (err) {
      console.error('Failed to send files:', err);
    } finally {
      setSendingFiles(false);
    }
  }, [activePhone, attachedFiles, message]);

  // ─── Load older messages (scroll-up pagination) ────
  const loadOlderMessages = useCallback(async () => {
    if (!hasMore || loadingOlder || !activePhone || messages.length === 0) return;
    const oldest = messages[0];
    if (!oldest?.createdAt) return;

    // Save scroll offset BEFORE the fetch so useLayoutEffect can restore it
    if (messagesContainerRef.current) {
      savedScrollOffset.current =
        messagesContainerRef.current.scrollHeight - messagesContainerRef.current.scrollTop;
    }

    setLoadingOlder(true);
    try {
      const result = await fetchMore({
        variables: {
          phone: activePhone,
          limit: PAGE_SIZE,
          before: String(oldest.createdAt),
        },
      });
      setHasMore(result?.data?.getMessages?.hasMore ?? false);
    } catch (err) {
      console.error('Failed to load older messages:', err);
      savedScrollOffset.current = null; // clear on error so layout effect is a no-op
    } finally {
      setLoadingOlder(false);
    }
  }, [hasMore, loadingOlder, activePhone, messages, fetchMore]);

  // ─── Scroll event handler ───────────────────────────
  const handleMessagesScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < 100;
    setIsNearBottom(nearBottom);
    if (nearBottom) setShowNewMsgPill(false);

    // Trigger older message load when scrolled near the top
    if (container.scrollTop < 100 && hasMore && !loadingOlder) {
      loadOlderMessages();
    }
  }, [hasMore, loadingOlder, loadOlderMessages]);

  const handleSelectChat = (contact) => {
    setActivePhone(contact.phone);
    setShowMobileChat(true);
  };

  const handleSendNew = useCallback(async () => {
    const phone = newPhone.replace(/\D/g, '');
    const text = newText.trim();
    if (!phone || phone.length < 7) { setNewMsgError('Enter a valid phone number with country code'); return; }
    if (!text) { setNewMsgError('Message cannot be empty'); return; }
    setNewMsgError('');
    try {
      await sendMessageMutation({ variables: { phone, text } });
      await refetchChats();
      setShowNewMsg(false);
      setNewPhone('91');
      setNewText('');
      setActivePhone(phone);
      setShowMobileChat(true);
    } catch (err) {
      setNewMsgError(err.message || 'Failed to send message');
    }
  }, [newPhone, newText, sendMessageMutation, refetchChats]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(Number(dateStr) || dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(Number(dateStr) || dateStr);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) return 'Today';
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  const getAvatar = (phone, name) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (!phone) return '?';
    const digits = phone.replace(/\D/g, '');
    return digits.slice(-2);
  };

  return (
    <div className="animate-fade-in -m-4 lg:-m-6 h-[calc(100vh-64px)] overflow-x-hidden">
      <div className="flex h-full bg-white rounded-none sm:rounded-xl border-0 sm:border border-slate-200/80 shadow-sm overflow-hidden mx-0 sm:mx-4 sm:mt-4 lg:mx-6 lg:mt-6">

        {/* ──────── LEFT: Contact List ──────── */}
        <div className={`w-full sm:w-[340px] lg:w-[360px] border-r border-slate-100 flex flex-col shrink-0 bg-white ${showMobileChat ? 'hidden sm:flex' : 'flex'}`}>
          <div className="px-4 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Support Chat</h1>
                <p className="text-xs text-slate-500">{contacts.length} conversation{contacts.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => refetchChats()} className="w-9 h-9 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-colors cursor-pointer" title="Refresh">
                  <RefreshCw className={`w-4 h-4 text-slate-500 ${chatsLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => { setShowNewMsg(true); setNewMsgError(''); }}
                  className="w-9 h-9 bg-primary-600 hover:bg-primary-700 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                  title="New Message"
                >
                  <PenSquare className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by phone..." className="input-field pl-9 !py-2 text-sm" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chatsLoading && contacts.length === 0 ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-slate-300 animate-spin" /></div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No conversations yet</p>
              </div>
            ) : (
              filteredContacts.map(contact => (
                <div
                  key={contact.phone}
                  onClick={() => handleSelectChat(contact)}
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 border-l-[3px]
                    ${activePhone === contact.phone ? 'bg-primary-50/60 border-l-primary-600' : 'border-l-transparent hover:bg-slate-50'}
                  `}
                >
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold">{getAvatar(contact.phone, contact.name)}</div>
                    {contact.source === 'chat' && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">{contact.name || contact.phone}</h4>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">{formatTime(contact.lastMessageTime)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-slate-500 truncate">{contact.lastMessage || (contact.source === 'session' ? `Bot step: ${contact.step}` : 'No messages')}</p>
                      {contact.messageCount > 0 && <span className="ml-2 shrink-0 text-[10px] text-slate-400">{contact.messageCount}</span>}
                    </div>
                    {/* AI status badge + assigned guide chip */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {contact.aiEnabled === false ? (
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                          Manual
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                          AI
                        </span>
                      )}
                      {contact.assignedGuideName && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full truncate max-w-[90px]">
                          {contact.assignedGuideName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ──────── RIGHT: Chat Area + Info Panel ──────── */}
        <div className={`flex-1 flex min-w-0 ${showMobileChat ? 'flex' : 'hidden sm:flex'}`}>

          {/* Chat column */}
          <div className="flex-1 flex flex-col min-w-0">
            {activePhone ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white shrink-0">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowMobileChat(false)} className="sm:hidden p-1.5 hover:bg-slate-100 rounded-lg mr-1 cursor-pointer">
                      <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold">{getAvatar(activePhone, activeContact?.name)}</div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{activeContact?.name || activePhone}</h3>
                      <p className="text-[11px] text-slate-500">
                        {activeContact?.name ? activePhone : (activeContact?.source === 'chat' ? `${activeContact.messageCount} messages` : activeContact?.step ? `Bot step: ${activeContact.step}` : 'WhatsApp')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* AI status badge */}
                    {aiEnabled ? (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
                        <Bot className="w-3.5 h-3.5" /> AI Active
                      </span>
                    ) : (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium">
                        <UserCheck className="w-3.5 h-3.5" /> Manual
                      </span>
                    )}
                    {/* Info panel toggle */}
                    <button
                      onClick={() => setShowInfoPanel(p => !p)}
                      className={`p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors ${showInfoPanel ? 'bg-slate-100 text-primary-600' : 'text-slate-400'}`}
                      title="Conversation info"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button onClick={() => refetchMessages()} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer" title="Refresh">
                      <RefreshCw className={`w-4 h-4 text-slate-400 ${messagesLoading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Call button area — adapts to permission state */}
                    {(callState === 'idle' || callState === 'ringing-in') && (
                      <button
                        onClick={handleCallClick}
                        disabled={callState === 'ringing-in'}
                        className={`p-2 rounded-lg cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600`}
                        title={`Call ${activePhone}`}
                      >
                        <PhoneIcon className="w-4 h-4" />
                      </button>
                    )}
                    {callState === 'needs-permission' && (
                      <button
                        onClick={() => requestCallPermission(activePhone)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium border border-amber-200"
                        title="User has not granted call permission — click to send a permission request via WhatsApp"
                      >
                        <PhoneIcon className="w-3.5 h-3.5" />
                        Request Call Permission
                      </button>
                    )}
                    {callState === 'permission-requested' && (
                      <span
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-amber-600 text-xs font-medium bg-amber-50 border border-amber-200 cursor-default"
                        title="Waiting for customer to tap Allow in WhatsApp"
                      >
                        <PhoneIcon className="w-3.5 h-3.5" />
                        Permission Sent…
                      </span>
                    )}

                    <button className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"><MoreVertical className="w-4 h-4 text-slate-400" /></button>
                  </div>
                </div>

                {/* Active Call Bar — shown when a call is in progress */}
                {(callState === 'in-call' || callState === 'dialing') && (
                  <div className="shrink-0 flex items-center justify-between px-5 py-2.5 bg-emerald-600 text-white text-sm">
                    <div className="flex items-center gap-2.5">
                      <PhoneIcon className="w-4 h-4 animate-pulse" />
                      <span className="font-medium">
                        {callState === 'dialing' ? 'Connecting…' : `In call · ${formatCallDuration(callSeconds)}`}
                      </span>
                      <span className="text-emerald-200 text-xs">{activePhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleMute}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${muted ? 'bg-white/20 text-white' : 'hover:bg-emerald-700 text-emerald-100'}`}
                        title={muted ? 'Unmute' : 'Mute'}
                      >
                        {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={terminateCall}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="End call"
                      >
                        <PhoneOff className="w-3.5 h-3.5" /> End Call
                      </button>
                    </div>
                  </div>
                )}

                {/* Permission-requested info banner */}
                {callState === 'permission-requested' && (
                  <div className="shrink-0 flex items-center gap-2.5 px-5 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
                    <PhoneIcon className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span>
                      Waiting for <strong>{activePhone}</strong> to approve the call permission in WhatsApp. Once they tap <em>Allow</em>, try calling again.
                    </span>
                  </div>
                )}

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 bg-linear-to-b from-slate-50 to-white relative"
                >
                  {/* Older-messages loading spinner — shown at top while fetching */}
                  {loadingOlder && (
                    <div className="flex justify-center py-3">
                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    </div>
                  )}

                  {/* "No more history" indicator */}
                  {!hasMore && !messagesLoading && messages.length > 0 && (
                    <div className="flex justify-center py-2">
                      <span className="text-[10px] text-slate-300 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">Beginning of conversation</span>
                    </div>
                  )}

                  <div className="max-w-2xl mx-auto space-y-1">
                    {messagesLoading && messages.length === 0 ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-slate-300 animate-spin" /></div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12"><p className="text-sm text-slate-400">No messages yet. Send a message to start the conversation.</p></div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isOutbound = msg.direction === 'outbound';
                        const msgDate = formatDate(msg.createdAt);
                        const prevDate = idx > 0 ? formatDate(messages[idx - 1].createdAt) : null;
                        const showDate = msgDate && msgDate !== prevDate;

                        // Detect interactive type from raw payload
                        const interactiveType = msg.raw?.interactive?.type;
                        const isButtonReply = interactiveType === 'button_reply';
                        const isListReply = interactiveType === 'list_reply';

                        const live = msg.waMessageId ? statusUpdates[msg.waMessageId] : null;
                        const resolvedStatus = live?.deliveryStatus || msg.deliveryStatus;
                        const resolvedReason = live?.deliveryFailureReason || msg.deliveryFailureReason;
                        const isFailed = isOutbound && resolvedStatus === 'failed';

                        return (
                          <div key={msg._id || idx}>
                            {showDate && (
                              <div className="flex items-center justify-center my-4">
                                <span className="px-3 py-1 bg-white rounded-full text-[11px] font-medium text-slate-500 shadow-sm border border-slate-100">{msgDate}</span>
                              </div>
                            )}
                            <div className={`flex mb-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] overflow-hidden rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm
                                ${isOutbound
                                  ? 'bg-primary-600 text-white rounded-br-md'
                                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-md'
                                }`}
                              >
                                {/* Media messages */}
                                {['image','document','video','audio'].includes(msg.raw?.type) ? (
                                  <MediaMessage raw={msg.raw} message={msg.message} isOutbound={isOutbound} />
                                ) : (
                                  <div style={{ whiteSpace: 'pre-line' }}>
                                    {parseWhatsAppText(msg.message)}
                                  </div>
                                )}

                                {/* If inbound is a button/list reply, show what they selected */}
                                {isButtonReply && msg.raw.interactive.button_reply && (
                                  <div className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium
                                    ${isOutbound ? 'bg-white/15 text-white/80' : 'bg-primary-50 text-primary-600'}`}>
                                    ↩ {msg.raw.interactive.button_reply.title}
                                  </div>
                                )}
                                {isListReply && msg.raw.interactive.list_reply && (
                                  <div className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium
                                    ${isOutbound ? 'bg-white/15 text-white/80' : 'bg-primary-50 text-primary-600'}`}>
                                    ☰ {msg.raw.interactive.list_reply.title}
                                    {msg.raw.interactive.list_reply.description && (
                                      <span className="opacity-60 ml-1">· {msg.raw.interactive.list_reply.description}</span>
                                    )}
                                  </div>
                                )}

                                {/* For outbound interactive messages: show buttons or list */}
                                {isOutbound && <InteractiveButtons raw={msg.raw} isOutbound={isOutbound} />}

                                {/* Timestamp + delivery status tick */}
                                <div className={`flex items-center justify-end gap-1 mt-1.5 ${isOutbound ? 'text-primary-200' : 'text-slate-400'}`}>
                                  <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                                  {isOutbound && <DeliveryTick status={resolvedStatus} failureReason={resolvedReason} />}
                                </div>
                              </div>
                            </div>

                            {/* Retry row — shown below failed outbound messages */}
                            {isFailed && (
                              <div className="flex justify-end mb-2 pr-1">
                                <div className="flex items-center gap-2">
                                  {resolvedReason && (
                                    <span className="text-[10px] text-red-400 max-w-[200px] truncate" title={resolvedReason}>{resolvedReason}</span>
                                  )}
                                  <button
                                    onClick={() => handleRetry(msg)}
                                    className="flex items-center gap-1 text-[11px] font-medium text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full transition-colors"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    Retry
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* "New messages" pill — shown when the user has scrolled up and new messages arrive */}
                  {showNewMsgPill && (
                    <div className="sticky bottom-4 flex justify-center pointer-events-none">
                      <button
                        className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-full shadow-lg transition-colors cursor-pointer"
                        onClick={() => {
                          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                          setShowNewMsgPill(false);
                          setIsNearBottom(true);
                        }}
                      >
                        New messages {'↓'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Replies */}
                <div className="px-3 sm:px-5 py-2 border-t border-slate-100 bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:block text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Quick:</span>
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
                      {quickReplies.map(qr => (
                        <button key={qr.label} onClick={() => setMessage(qr.label)} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer">
                          <qr.icon className="w-3 h-3" /> {qr.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* File Attachments Preview */}
                {attachedFiles.length > 0 && (
                  <div className="px-3 sm:px-5 pt-2.5 pb-1 bg-white border-t border-slate-100">
                    <div className="flex flex-wrap gap-2">
                      {attachedFiles.map((f, i) => {
                        const Icon = fileIcon(f);
                        const isImg = f.type?.startsWith('image/');
                        return (
                          <div key={i} className="relative group flex items-center gap-1.5 bg-slate-100 rounded-xl px-2.5 py-1.5 pr-7 max-w-[160px]">
                            {isImg ? (
                              <img src={URL.createObjectURL(f)} alt={f.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                            ) : (
                              <Icon className="w-5 h-5 text-slate-500 shrink-0" />
                            )}
                            <span className="text-xs text-slate-700 truncate">{f.name}</span>
                            <button
                              onClick={() => removeAttachment(i)}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full bg-slate-300 hover:bg-red-400 hover:text-white transition-colors cursor-pointer"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-slate-100 bg-white shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0 ${attachedFiles.length > 0 ? 'text-primary-600' : 'text-slate-400'}`}
                      title="Attach files"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          attachedFiles.length > 0 ? handleSendFiles() : handleSend();
                        }
                      }}
                      placeholder={attachedFiles.length > 0 ? 'Add a caption (optional)…' : 'Type a message…'}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      disabled={sending || sendingFiles}
                    />
                    <button
                      onClick={attachedFiles.length > 0 ? handleSendFiles : handleSend}
                      disabled={(!message.trim() && attachedFiles.length === 0) || sending || sendingFiles}
                      className={`p-2.5 rounded-xl transition-all duration-200 shrink-0 cursor-pointer ${(message.trim() || attachedFiles.length > 0) && !sending && !sendingFiles ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md' : 'bg-slate-100 text-slate-300'}`}
                    >
                      {(sending || sendingFiles) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-400">Select a conversation</h3>
                  <p className="text-sm text-slate-400 mt-1">Choose a contact to start chatting</p>
                </div>
              </div>
            )}
          </div>

          {/* ──────── Info Panel (collapsible, desktop only) ──────── */}
          {activePhone && showInfoPanel && (
            <div className="w-64 shrink-0 border-l border-slate-100 bg-white flex-col overflow-y-auto hidden sm:flex">

              {/* Assigned Guide section */}
              <div className="p-4 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Assigned Guide</p>
                {assignedGuideId ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                        {assignedGuideName?.[0] || '?'}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{assignedGuideName}</span>
                    </div>
                    <button
                      onClick={handleUnassignGuide}
                      disabled={unassigning}
                      className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50 font-medium transition-colors"
                    >
                      {unassigning ? 'Removing…' : 'Remove Assignment'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">No guide assigned</p>
                    <select
                      value={selectedGuideId}
                      onChange={e => setSelectedGuideId(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                      <option value="">Select guide...</option>
                      {staffUsers.map(u => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignGuide}
                      disabled={!selectedGuideId || assigning}
                      className="w-full text-xs bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-1.5 font-semibold transition-colors"
                    >
                      {assigning ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                )}
              </div>

              {/* AI Control section */}
              <div className="p-4 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">AI Agent</p>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Bot Responses</p>
                    <p className={`text-xs font-medium ${aiEnabled ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {aiEnabled ? 'Active' : 'Disabled'}
                    </p>
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={handleToggleAI}
                    disabled={toggling}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 cursor-pointer ${aiEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${aiEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {!aiEnabled && (
                  <p className="text-[11px] text-amber-600">Bot is silent. Reply manually using the chat input below.</p>
                )}
              </div>

              {/* Activity Log section */}
              <div className="p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Activity</p>
                {logs.length === 0 ? (
                  <p className="text-xs text-slate-400">No activity yet</p>
                ) : (
                  <div className="space-y-2.5">
                    {logs.slice(0, 6).map(log => (
                      <div key={log.id} className="flex items-start gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          log.action === 'assigned' ? 'bg-blue-100' :
                          log.action === 'unassigned' ? 'bg-red-100' :
                          log.action === 'ai_enabled' ? 'bg-emerald-100' :
                          log.action === 'ai_disabled' ? 'bg-amber-100' : 'bg-slate-100'
                        }`}>
                          {log.action === 'assigned' && <UserPlus className="w-2.5 h-2.5 text-blue-600" />}
                          {log.action === 'unassigned' && <UserMinus className="w-2.5 h-2.5 text-red-500" />}
                          {log.action === 'ai_enabled' && <Bot className="w-2.5 h-2.5 text-emerald-600" />}
                          {log.action === 'ai_disabled' && <BotOff className="w-2.5 h-2.5 text-amber-600" />}
                          {log.action === 'guide_message' && <UserCheck className="w-2.5 h-2.5 text-slate-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-slate-700 leading-tight">
                            {log.action === 'assigned' && `Guide assigned${log.guideName ? `: ${log.guideName}` : ''}`}
                            {log.action === 'unassigned' && 'Guide removed'}
                            {log.action === 'ai_enabled' && 'AI turned on'}
                            {log.action === 'ai_disabled' && 'AI turned off'}
                            {log.action === 'guide_message' && 'Guide sent message'}
                          </p>
                          {log.performedByName && (
                            <p className="text-[10px] text-slate-400">by {log.performedByName}</p>
                          )}
                          <p className="text-[10px] text-slate-300">{formatTimeAgo(log.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ──────── New Message Modal ──────── */}
      {showNewMsg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewMsg(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                  <PenSquare className="w-4 h-4 text-primary-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">New Message</h2>
              </div>
              <button
                onClick={() => setShowNewMsg(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => { setNewPhone(e.target.value); setNewMsgError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && document.getElementById('new-msg-text')?.focus()}
                  placeholder="e.g. 919182748724"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">Include country code, no + or spaces (e.g. 91 for India)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Message
                </label>
                <textarea
                  id="new-msg-text"
                  value={newText}
                  onChange={(e) => { setNewText(e.target.value); setNewMsgError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendNew(); }}
                  placeholder="Type your message…"
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Press Ctrl+Enter to send</p>
              </div>

              {newMsgError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                  <span className="text-red-500 text-xs font-medium">{newMsgError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => { setShowNewMsg(false); setNewPhone('91'); setNewText(''); setNewMsgError(''); }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNew}
                disabled={sending || !newPhone.trim() || !newText.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio sink for remote call audio */}
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      {/* ──────── Incoming Call Modal ──────── */}
      {callState === 'ringing-in' && incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            {/* Animated ring header */}
            <div className="bg-emerald-600 px-6 py-6 flex flex-col items-center text-white">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                  <PhoneIncoming className="w-9 h-9" />
                </div>
              </div>
              <p className="text-sm font-medium text-emerald-100 mb-1">Incoming WhatsApp Call</p>
              <h2 className="text-xl font-bold">
                {incomingCallerName || incomingCall.phone}
              </h2>
              {incomingCallerName && (
                <p className="text-sm text-emerald-200 mt-0.5">{incomingCall.phone}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex divide-x divide-slate-100">
              <button
                onClick={rejectCall}
                className="flex-1 flex flex-col items-center gap-2 py-5 hover:bg-red-50 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-12 bg-red-100 group-hover:bg-red-200 rounded-full flex items-center justify-center transition-colors">
                  <PhoneOff className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-sm font-semibold text-red-600">Decline</span>
              </button>
              <button
                onClick={answerCall}
                className="flex-1 flex flex-col items-center gap-2 py-5 hover:bg-emerald-50 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-12 bg-emerald-100 group-hover:bg-emerald-200 rounded-full flex items-center justify-center transition-colors">
                  <PhoneIncoming className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-emerald-700">Answer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Non-blocking call error toast */}
      {callError && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-red-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          <PhoneOff className="w-4 h-4 shrink-0" />
          <span>Call failed: {callError}</span>
        </div>
      )}
    </div>
  );
}
