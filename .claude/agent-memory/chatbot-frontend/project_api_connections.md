---
name: API Connection Points
description: All endpoints, GraphQL operations, env vars, and production URLs connecting TrailDesk frontend to the backend
type: project
---

# API Connection Points

## Production URLs
- **Backend API:** `https://api.trekops.in`
- **GraphQL:** `https://api.trekops.in/graphql`
- **Socket.IO:** `https://api.trekops.in` (same server)

## Frontend Env Vars (TrailDesk .env)
```
VITE_GRAPHQL_URL=https://api.trekops.in/graphql
VITE_GRAPHQL_ENABLED=true
VITE_API_URL=https://api.trekops.in
VITE_API_BASE_URL=https://api.trekops.in/api/admin
```

## Socket.IO Connection
```js
// SupportChatPage.jsx line 69
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
  || import.meta.env.VITE_GRAPHQL_URL?.replace('/graphql', '')
  || 'http://localhost:8080';
```

## Apollo Client
- JWT attached via `setContext` — reads from `localStorage.getItem('trekops_token')`
- Cache policy: `cache-and-network` for all watched queries
- Type policies: `merge: false` on list fields (getTreks, getBookings, etc.)

## Chat-Specific GraphQL Operations

### Queries
```graphql
GET_CHATS → getChats: [ChatContact]
  # Returns: phone, name, lastMessage, lastMessageTime, messageCount, source, step

GET_MESSAGES(phone: String!) → getMessages: [ChatMessage]
  # Returns: _id, phone, direction, message, raw (JSON), waMessageId,
  #          deliveryStatus, deliveryFailureReason, createdAt, updatedAt
```

### Mutations
```graphql
SEND_MESSAGE(phone: String!, text: String!) → { status: String }
  # Calls sendMessage() in backend which also auto-saves to ChatMessage
```

## Chat-Specific REST Endpoints (used directly by SupportChatPage)
```
POST /api/chat/{phone}/send-files   multipart/form-data
  fields: files[] (up to 10), text (optional caption)
  # Sends files + optional text via WhatsApp, auto-saves to ChatMessage
```

## All Other REST Endpoints Used by Frontend
```
POST /api/upload?folder=<name>    # R2 file upload (logos, images, documents)
DELETE /api/upload                # Delete from R2
POST /api/company                 # Company profile image upload
GET  /api/booking-pdf/:bookingId  # Download booking PDF
```

## GraphQL Auth
All resolvers call `requireAuth(context)` which validates `context.user` populated from JWT by `authMiddleware` in app.js. Chat queries (`getChats`, `getMessages`, `sendMessage`) all require auth.

## Backend MongoDB URI (production)
```
mongodb://Emtpl:Emtpl@103.120.178.175:27018/madhu?replicaSet=rs0&directConnection=true&authSource=admin
```
