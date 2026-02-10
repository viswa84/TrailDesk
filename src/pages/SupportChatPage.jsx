import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Send, Paperclip, MoreVertical, Phone, Check, CheckCheck, ArrowLeft, MessageCircle, FileText, CreditCard, SmilePlus } from 'lucide-react';

// ─── Dummy Chat Data ────────────────────────────────
const chatContacts = [
  {
    id: 1, name: 'Sarah Jenkins', phone: '+91 99887 76655', avatar: 'SJ',
    status: 'online', lastSeen: 'Active on Website',
    bookingRef: 'BK-1002', unread: 2,
    messages: [
      { id: 1, text: 'Hi, I have a booking for EBC next month.', sender: 'customer', time: '10:00 AM', date: 'Today, Oct 28' },
      { id: 2, text: 'Hello Sarah! Yes, I see your booking ID BK-1002. How can I help?', sender: 'agent', time: '10:05 AM' },
      { id: 3, text: 'I was wondering about the gear. Is the sleeping bag rated for -10C? I tend to get very cold.', sender: 'customer', time: '10:10 AM' },
      { id: 4, text: 'Great question! We provide sleeping bags rated for -15°C, so you\'ll be well covered. We also have fleece liners available as an add-on for extra warmth.', sender: 'agent', time: '10:12 AM' },
      { id: 5, text: 'That sounds perfect! Can I also get the packing list?', sender: 'customer', time: '10:15 AM' },
      { id: 6, text: 'Is the sleeping bag rated for -10C?', sender: 'customer', time: '10:18 AM' },
    ]
  },
  {
    id: 2, name: 'Rahul Verma', phone: '+91 88776 65544', avatar: 'RV',
    status: 'offline', lastSeen: '2h ago',
    bookingRef: 'BK-2615', unread: 0,
    messages: [
      { id: 1, text: 'Hi, I wanted to confirm my Kedarkantha trek booking.', sender: 'customer', time: '8:30 AM', date: 'Today' },
      { id: 2, text: 'Hi Rahul! Your booking BK-2615 is confirmed. The trek starts Feb 15 from Dehradun Station.', sender: 'agent', time: '8:35 AM' },
      { id: 3, text: 'Thanks for the packing list!', sender: 'customer', time: '9:00 AM' },
    ]
  },
  {
    id: 3, name: 'New Lead (+91 77...)', phone: '+91 77665 54433', avatar: 'NL',
    status: 'offline', lastSeen: '1d ago',
    bookingRef: null, unread: 0,
    messages: [
      { id: 1, text: 'Do you have group discounts?', sender: 'customer', time: '2:00 PM', date: 'Yesterday' },
      { id: 2, text: 'Yes! We offer 10% off for groups of 5+ and 15% for groups of 10+. Would you like to book a group trek?', sender: 'agent', time: '2:15 PM' },
    ]
  },
  {
    id: 4, name: 'Aarav Mehta', phone: '+91 99887 76655', avatar: 'AM',
    status: 'online', lastSeen: 'Active now',
    bookingRef: 'BK-2601', unread: 1,
    messages: [
      { id: 1, text: 'What should I pack for Kedarkantha? First time trekking!', sender: 'customer', time: '11:00 AM', date: 'Today' },
      { id: 2, text: 'Welcome aboard Aarav! Here\'s what you need:\n\n🎒 Backpack (50-60L)\n🧥 Down jacket\n🧤 Gloves & woolen cap\n👟 Trekking shoes (waterproof)\n🧣 Thermal innerwear\n💊 Personal medicines\n\nI\'ll also send you the detailed PDF!', sender: 'agent', time: '11:05 AM' },
      { id: 3, text: 'Thanks! Also, is the trail difficulty really "Easy"? I\'m a bit nervous.', sender: 'customer', time: '11:10 AM' },
    ]
  },
  {
    id: 5, name: 'Priya Deshmukh', phone: '+91 66554 43322', avatar: 'PD',
    status: 'offline', lastSeen: '3h ago',
    bookingRef: 'BK-2604', unread: 0,
    messages: [
      { id: 1, text: 'The Chadar trek was AMAZING! Thank you team! 🏔️❄️', sender: 'customer', time: '4:00 PM', date: 'Jan 30' },
      { id: 2, text: 'So glad you loved it Priya! Would you like to leave a review? We\'d also love to have you on our next expedition to Stok Kangri! 🙌', sender: 'agent', time: '4:10 PM' },
      { id: 3, text: 'Absolutely! Send me the review link. And yes, count me in for Stok Kangri!', sender: 'customer', time: '4:20 PM' },
    ]
  },
  {
    id: 6, name: 'Vikram Singh', phone: '+91 55443 32211', avatar: 'VS',
    status: 'offline', lastSeen: '5h ago',
    bookingRef: 'BK-2605', unread: 0,
    messages: [
      { id: 1, text: 'I need to cancel my Sandakphu booking. Something came up.', sender: 'customer', time: '3:00 PM', date: 'Feb 8' },
      { id: 2, text: 'Sorry to hear that Vikram. As per our cancellation policy, you\'re eligible for a 75% refund since the trek is more than 30 days away. Shall I proceed?', sender: 'agent', time: '3:10 PM' },
      { id: 3, text: 'Yes please, go ahead with the refund.', sender: 'customer', time: '3:15 PM' },
      { id: 4, text: 'Done! Refund of ₹8,250 will be credited to your account in 5-7 business days. We hope to see you on a trek soon! 🏔️', sender: 'agent', time: '3:20 PM' },
    ]
  },
];

const quickReplies = [
  { label: 'Packing List PDF', icon: FileText },
  { label: 'Payment Link', icon: CreditCard },
  { label: 'Trek Itinerary', icon: FileText },
];

export default function SupportChatPage() {
  const [contacts, setContacts] = useState(chatContacts);
  const [activeChat, setActiveChat] = useState(chatContacts[0]);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef(null);

  const filteredContacts = useMemo(() =>
    contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [contacts, searchTerm]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    const newMsg = { id: Date.now(), text: message, sender: 'agent', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setContacts(prev => prev.map(c =>
      c.id === activeChat.id ? { ...c, messages: [...c.messages, newMsg] } : c
    ));
    setActiveChat(prev => ({ ...prev, messages: [...prev.messages, newMsg] }));
    setMessage('');
  };

  const handleSelectChat = (contact) => {
    // Mark as read
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c));
    setActiveChat({ ...contact, unread: 0 });
    setShowMobileChat(true);
  };

  const totalUnread = contacts.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="animate-fade-in -m-6 h-[calc(100vh-64px)]">
      <div className="flex h-full bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mx-6 mt-6">

        {/* ──────── LEFT: Contact List ──────── */}
        <div className={`w-full sm:w-[340px] lg:w-[360px] border-r border-slate-100 flex flex-col shrink-0 bg-white ${showMobileChat ? 'hidden sm:flex' : 'flex'}`}>
          {/* Header */}
          <div className="px-4 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Support Chat</h1>
                <p className="text-xs text-slate-500">{totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'All caught up'}</p>
              </div>
              <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-4.5 h-4.5 text-primary-600" />
              </div>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search chats..."
                className="input-field pl-9 !py-2 text-sm"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.map(contact => (
              <div
                key={contact.id}
                onClick={() => handleSelectChat(contact)}
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 border-l-[3px]
                  ${activeChat?.id === contact.id
                    ? 'bg-primary-50/60 border-l-primary-600'
                    : 'border-l-transparent hover:bg-slate-50'
                  }
                `}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold
                    ${contact.status === 'online' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}
                  `}>
                    {contact.avatar}
                  </div>
                  {contact.status === 'online' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">{contact.name}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {contact.messages[contact.messages.length - 1]?.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-slate-500 truncate">{contact.messages[contact.messages.length - 1]?.text}</p>
                    {contact.unread > 0 && (
                      <span className="ml-2 shrink-0 w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">{contact.unread}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ──────── RIGHT: Chat Area ──────── */}
        <div className={`flex-1 flex flex-col ${showMobileChat ? 'flex' : 'hidden sm:flex'}`}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-3">
                  {/* Back button on mobile */}
                  <button onClick={() => setShowMobileChat(false)} className="sm:hidden p-1.5 hover:bg-slate-100 rounded-lg mr-1 cursor-pointer">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                      ${activeChat.status === 'online' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}
                    `}>
                      {activeChat.avatar}
                    </div>
                    {activeChat.status === 'online' && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{activeChat.name}</h3>
                    <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                      {activeChat.status === 'online' ? '● Active on Website' : `Last seen ${activeChat.lastSeen}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {activeChat.bookingRef && (
                    <button className="btn-secondary !py-1.5 !px-3 text-xs hidden sm:flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> View Booking {activeChat.bookingRef}
                    </button>
                  )}
                  <button className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"><Phone className="w-4 h-4 text-slate-400" /></button>
                  <button className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"><MoreVertical className="w-4 h-4 text-slate-400" /></button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 bg-gradient-to-b from-slate-50 to-white">
                <div className="max-w-2xl mx-auto space-y-1">
                  {activeChat.messages.map((msg, idx) => {
                    const isAgent = msg.sender === 'agent';
                    const showDate = msg.date && (idx === 0 || activeChat.messages[idx - 1]?.date !== msg.date);

                    return (
                      <div key={msg.id}>
                        {/* Date separator */}
                        {showDate && (
                          <div className="flex items-center justify-center my-4">
                            <span className="px-3 py-1 bg-white rounded-full text-[11px] font-medium text-slate-500 shadow-sm border border-slate-100">{msg.date}</span>
                          </div>
                        )}

                        {/* Message bubble */}
                        <div className={`flex mb-2 ${isAgent ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm
                              ${isAgent
                                ? 'bg-primary-600 text-white rounded-br-md'
                                : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-md'
                              }
                            `}
                            style={{ whiteSpace: 'pre-line' }}
                          >
                            <p>{msg.text}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isAgent ? 'text-primary-200' : 'text-slate-400'}`}>
                              <span className="text-[10px]">{msg.time}</span>
                              {isAgent && <CheckCheck className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Quick Replies */}
              <div className="px-5 py-2 border-t border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Quick Replies:</span>
                  <div className="flex gap-1.5 overflow-x-auto">
                    {quickReplies.map(qr => (
                      <button
                        key={qr.label}
                        onClick={() => setMessage(qr.label)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer"
                      >
                        <qr.icon className="w-3 h-3" /> {qr.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message Input */}
              <div className="px-5 py-3 border-t border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0">
                    <Paperclip className="w-5 h-5 text-slate-400" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0">
                    <SmilePlus className="w-5 h-5 text-slate-400" />
                  </button>
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className={`p-2.5 rounded-xl transition-all duration-200 shrink-0 cursor-pointer
                      ${message.trim()
                        ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md'
                        : 'bg-slate-100 text-slate-300'
                      }
                    `}
                  >
                    <Send className="w-5 h-5" />
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
