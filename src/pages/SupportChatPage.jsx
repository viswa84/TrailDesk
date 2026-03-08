import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_CHATS, GET_MESSAGES } from '../graphql/queries';
import { SEND_MESSAGE } from '../graphql/mutations';
import { io } from 'socket.io-client';
import { Search, Send, Paperclip, MoreVertical, Phone as PhoneIcon, CheckCheck, ArrowLeft, MessageCircle, FileText, CreditCard, SmilePlus, Loader2, RefreshCw, List, ChevronRight } from 'lucide-react';

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
                <div>
                  <div className={`font-medium ${isOutbound ? 'text-white' : 'text-slate-700'}`}>{row.title}</div>
                  {row.description && (
                    <div className={`text-[10px] mt-0.5 ${isOutbound ? 'text-white/60' : 'text-slate-400'}`}>{row.description}</div>
                  )}
                </div>
                <ChevronRight className={`w-3 h-3 shrink-0 ${isOutbound ? 'text-white/40' : 'text-slate-300'}`} />
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
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

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

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [refetchChats]);

  // Reset live messages when switching chats and refetch from DB
  useEffect(() => {
    setLiveMessages([]);
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

  const handleSelectChat = (contact) => {
    setActivePhone(contact.phone);
    setShowMobileChat(true);
  };

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

  const getAvatar = (phone) => {
    if (!phone) return '?';
    const digits = phone.replace(/\D/g, '');
    return digits.slice(-2);
  };

  return (
    <div className="animate-fade-in -m-6 h-[calc(100vh-64px)]">
      <div className="flex h-full bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mx-6 mt-6">

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
                <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-4.5 h-4.5 text-primary-600" />
                </div>
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
                    <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold">{getAvatar(contact.phone)}</div>
                    {contact.source === 'chat' && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">{contact.phone}</h4>
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
        <div className={`flex-1 flex flex-col ${showMobileChat ? 'flex' : 'hidden sm:flex'}`}>
          {activePhone ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowMobileChat(false)} className="sm:hidden p-1.5 hover:bg-slate-100 rounded-lg mr-1 cursor-pointer">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold">{getAvatar(activePhone)}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{activePhone}</h3>
                    <p className="text-[11px] text-slate-500">
                      {activeContact?.source === 'chat' ? `${activeContact.messageCount} messages` : activeContact?.step ? `Bot step: ${activeContact.step}` : 'WhatsApp'}
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
              <div className="flex-1 overflow-y-auto px-5 py-4 bg-gradient-to-b from-slate-50 to-white">
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

                      return (
                        <div key={msg._id || idx}>
                          {showDate && (
                            <div className="flex items-center justify-center my-4">
                              <span className="px-3 py-1 bg-white rounded-full text-[11px] font-medium text-slate-500 shadow-sm border border-slate-100">{msgDate}</span>
                            </div>
                          )}
                          <div className={`flex mb-2 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm
                                ${isOutbound
                                  ? 'bg-primary-600 text-white rounded-br-md'
                                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-md'
                                }
                              `}
                            >
                              {/* Message text with WhatsApp bold parsing */}
                              <div style={{ whiteSpace: 'pre-line' }}>
                                {parseWhatsAppText(msg.message)}
                              </div>

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

                              {/* Timestamp + checkmarks */}
                              <div className={`flex items-center justify-end gap-1 mt-1.5 ${isOutbound ? 'text-primary-200' : 'text-slate-400'}`}>
                                <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                                {isOutbound && <CheckCheck className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Quick Replies */}
              <div className="px-5 py-2 border-t border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Quick:</span>
                  <div className="flex gap-1.5 overflow-x-auto">
                    {quickReplies.map(qr => (
                      <button key={qr.label} onClick={() => setMessage(qr.label)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer">
                        <qr.icon className="w-3 h-3" /> {qr.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message Input */}
              <div className="px-5 py-3 border-t border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"><Paperclip className="w-5 h-5 text-slate-400" /></button>
                  <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"><SmilePlus className="w-5 h-5 text-slate-400" /></button>
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    disabled={sending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || sending}
                    className={`p-2.5 rounded-xl transition-all duration-200 shrink-0 cursor-pointer ${message.trim() && !sending ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md' : 'bg-slate-100 text-slate-300'}`}
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
    </div>
  );
}
