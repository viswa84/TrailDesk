import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_CHATS, GET_MESSAGES } from '../graphql/queries';
import { SEND_MESSAGE } from '../graphql/mutations';
import { io } from 'socket.io-client';
import { Search, Send, Paperclip, MoreVertical, Phone as PhoneIcon, Check, CheckCheck, ArrowLeft, MessageCircle, FileText, CreditCard, SmilePlus, Loader2, RefreshCw, List, ChevronRight, PenSquare, X, Image, Film, Music, File, AlertCircle } from 'lucide-react';

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

// Parse WhatsApp-style bold (*text*) and render as <strong>
function parseWhatsAppText(text) {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={i}>{part.slice(1, -1)}</strong>;
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

export default function SupportChatPage() {
  const [activePhone, setActivePhone] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [liveMessages, setLiveMessages] = useState([]);
  const [statusUpdates, setStatusUpdates] = useState({}); // waMessageId → deliveryStatus
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [sendingFiles, setSendingFiles] = useState(false);

  // ─── New Message Modal ─────────────────────────────
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [newPhone, setNewPhone] = useState('91');
  const [newText, setNewText] = useState('');
  const [newMsgError, setNewMsgError] = useState('');

  // ─── GraphQL: Contacts (initial load only) ─────────
  const { data: chatsData, loading: chatsLoading, refetch: refetchChats } = useQuery(GET_CHATS);

  // ─── GraphQL: Messages for active phone (initial load) ─
  const { data: messagesData, loading: messagesLoading, refetch: refetchMessages } = useQuery(GET_MESSAGES, {
    variables: { phone: activePhone },
    skip: !activePhone,
  });

  // ─── GraphQL: Send message ─────────────────────────
  const [sendMessageMutation, { loading: sending }] = useMutation(SEND_MESSAGE);

  // ─── Socket.IO for real-time updates ───────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
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
    });

    socket.on('messageStatusUpdate', ({ waMessageId, deliveryStatus, deliveryFailureReason }) => {
      if (!waMessageId) return;
      setStatusUpdates(prev => ({ ...prev, [waMessageId]: { deliveryStatus, deliveryFailureReason } }));
      // Also patch liveMessages if the message is there
      setLiveMessages(prev => prev.map(m =>
        m.waMessageId === waMessageId ? { ...m, deliveryStatus, deliveryFailureReason } : m
      ));
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [refetchChats]);

  // Reset live messages and attachments when switching chats
  useEffect(() => {
    setLiveMessages([]);
    setAttachedFiles([]);
    setMessage('');
  }, [activePhone]);

  const contacts = useMemo(() => {
    return chatsData?.getChats || [];
  }, [chatsData]);

  // Merge DB messages with live socket messages for the active phone
  const messages = useMemo(() => {
    const dbMessages = messagesData?.getMessages || [];
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

  const filteredContacts = useMemo(() =>
    contacts.filter(c =>
      (c.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [contacts, searchTerm]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ──────── RIGHT: Chat Area ──────── */}
        <div className={`flex-1 flex flex-col min-w-0 ${showMobileChat ? 'flex' : 'hidden sm:flex'}`}>
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
                  <button onClick={() => refetchMessages()} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer" title="Refresh">
                    <RefreshCw className={`w-4 h-4 text-slate-400 ${messagesLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"><PhoneIcon className="w-4 h-4 text-slate-400" /></button>
                  <button className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"><MoreVertical className="w-4 h-4 text-slate-400" /></button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 bg-linear-to-b from-slate-50 to-white">
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
    </div>
  );
}
