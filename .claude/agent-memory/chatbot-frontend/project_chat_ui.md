---
name: Chat UI Implementation Details
description: SupportChatPage.jsx — all implementation details: state, Socket.IO, GraphQL, rendering, file uploads, delivery status
type: project
---

# SupportChatPage.jsx — Chat UI

**File:** `C:\Users\Lalam\OneDrive\Desktop\TrailDesk\src\pages\SupportChatPage.jsx`

## Layout
Two-column: left panel (contact list) + right panel (chat area). Fully mobile-responsive with `showMobileChat` toggle to switch panels on small screens.

## State
```js
activePhone         // currently selected contact phone number
message             // text input value
searchTerm          // contact list filter
showMobileChat      // mobile panel toggle
liveMessages        // real-time messages from Socket.IO
statusUpdates       // Map of waMessageId → { deliveryStatus, deliveryFailureReason }
attachedFiles       // File[] for media sending
sendingFiles        // loading state for file upload
showNewMsg          // "New Message" modal visibility
newPhone / newText  // new message modal fields
```

## Data Sources (merged)
- **GraphQL `GET_CHATS`** — initial contact list (phone, name, lastMessage, source, step)
- **GraphQL `GET_MESSAGES`** — historical messages for selected phone
- **Socket.IO `newMessage`** — real-time messages appended to `liveMessages`
- Messages from DB and socket are **deduped by `_id`** and merged into a single sorted array

## Socket.IO Events
- `newMessage` → append to liveMessages, refetchChats for sidebar
- `messageStatusUpdate` → update `statusUpdates` map + patch liveMessages in-place
- Socket connects to `VITE_SOCKET_URL` env var (defaults to `VITE_GRAPHQL_URL` with `/graphql` removed)

## Sending Messages
1. **Text:** `SEND_MESSAGE` GraphQL mutation (`sendMessage(phone, text)`)
2. **Files:** Direct `POST /api/chat/{phone}/send-files` with FormData (not via GraphQL)
3. **New conversation:** Modal → `SEND_MESSAGE` mutation → refetch contacts → open chat

## Message Rendering
- **Direction:** `isOutbound = msg.direction === 'outbound'` → right-aligned green bubbles vs left-aligned white
- **WhatsApp formatting:** `parseWhatsAppText()` handles `*bold*` and clickable URLs
- **Interactive messages (outbound):** `InteractiveButtons` component renders button grids and list previews from `msg.raw.interactive`
- **Interactive replies (inbound):** Shows button_reply/list_reply chips with ↩ or ☰ prefix
- **Media messages:** `MediaMessage` component shows type-appropriate icon + filename (image, document, video, audio)
- **Date separators:** Between messages when date changes (Today/Yesterday/date)
- **Delivery ticks:** `DeliveryTick` component — Check/CheckCheck/AlertCircle per status
- **Failed messages:** Retry button appears below failed outbound messages

## Quick Replies
Static shortcuts pre-fill the input: "Packing List PDF", "Payment Link", "Trek Itinerary"

## Scroll Behavior
`messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })` runs on every `messages` change — always scrolls to bottom (no unread scroll guard implemented yet).

## Contact List
- Sorted by `lastMessageTime` descending
- Search filters by phone number only (not name)
- Active chat highlighted with left border (`border-l-primary-600`)
- Shows `source` indicator — green dot for active chat sessions

## Known Gaps
- Auto-scroll always fires, no "scroll to bottom" button when user has scrolled up
- Search only on phone number, not contact name
- No message pagination / virtual scroll for large histories
- No unread count badge per contact in real-time (only shown if `contact.messageCount > 0`)
- No emoji picker
- No Shift+Enter for multiline (Enter always sends)
