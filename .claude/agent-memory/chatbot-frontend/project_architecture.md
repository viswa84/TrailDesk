---
name: Full Stack Architecture Overview
description: Complete architecture of TrailDesk (frontend) + WhatsApp_ChatBot_Trek (backend) — stack, structure, and how they connect
type: project
---

# Full Stack: TrekOps / TrailDesk

## Frontend — TrailDesk
- **Framework:** React 19 + Vite 7, Tailwind CSS v4, React Router v7
- **State:** No global store — Apollo Client cache + local useState
- **API:** Apollo Client 4 connecting to GraphQL at `VITE_GRAPHQL_URL`
- **Real-time:** socket.io-client connecting to `VITE_SOCKET_URL`
- **Auth:** JWT stored in localStorage as `trekops_token` and `trekops_user`
- **Production URL (frontend build):** Deployed via Vercel (`vercel` in deps)
- **Production API:** `https://api.trekops.in`

## Backend — WhatsApp_ChatBot_Trek
- **Runtime:** Node.js (CommonJS), Express 5.x
- **Database:** MongoDB + Mongoose 9, replica set required
- **API:** GraphQL via `graphql-http` + `ruru` playground
- **Real-time:** Socket.IO 4 (singleton in `src/socket.js`)
- **Auth:** JWT (7-day expiry), bcryptjs
- **File storage:** Cloudflare R2 (S3-compatible), local `uploads/` for buffer only
- **Payment:** PayU WebSDK (form + payment links)
- **AI:** Groq (Llama 3.3 70B, free tier) via `groq_api` env var

## Key Pages (Frontend)
| Route | Page | Purpose |
|---|---|---|
| /dashboard | DashboardPage | Analytics KPIs, charts |
| /support-chat | SupportChatPage | **Main chat UI** — WhatsApp inbox |
| /whatsapp-flow | WhatsAppFlowPage | Flow config (greeting keywords, messages) |
| /flow-builder | FlowBuilderPage | Visual node-based flow editor (ReactFlow) |
| /departures/:id | BatchDetailPage | Trek departure management |
| /bookings | BookingsPage | All bookings |
| /settings | SettingsPage | Profile, org, notification prefs |
| /superadmin | SuperAdminPage | Multi-tenant management |

## Multi-tenancy
- Every Mongoose model has optional `tenantId: ObjectId ref Tenant`
- JWT payload includes `tenantId` and `role`
- `tenantScope` middleware applies automatic filtering
- Single deployment serves multiple trek companies

**Why:** Designed as a SaaS platform for trek operators.
**How to apply:** Always include `tenantId` in new GraphQL resolvers and Mongoose queries.
