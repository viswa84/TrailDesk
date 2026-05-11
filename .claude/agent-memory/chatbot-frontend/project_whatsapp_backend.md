---
name: Backend WhatsApp Integration
description: How WhatsApp messages are received, processed, and stored — webhook, handlers, AI, payments, Socket.IO emissions
type: project
---

# Backend WhatsApp Integration

## Webhook Flow (src/routes/webhook.js)
1. POST `/api/webhook` receives Meta Graph API events
2. **Delivery status updates** → update ChatMessage.deliveryStatus + emit `messageStatusUpdate` via Socket.IO
3. **Inbound messages** → save to ChatMessage (direction: inbound) → emit `newMessage` via Socket.IO
4. Load greeting keywords from FlowConfig (cached 5 min)
5. If greeting → try `startFlowEngine()` (visual flow) → fallback to `startFlow()` (hardcoded)
6. If non-greeting → try `handleFlowMessage()` → fallback to participant input → people count → `handleUnknownText()`

## WhatsApp State Machine (UserSession.step)
Steps in order:
```
SELECT_CITY → SELECT_BROWSE_TYPE → SELECT_TREK / SELECT_DATE →
SELECT_DEPARTURE → ASK_EXACT_COUNT → AWAITING_PAYMENT →
COLLECT_PARTICIPANTS → COMPLETE
```

## Two Execution Paths
1. **Visual Flow Engine** (`flowEngine.js`): Node-based flows from `FlowDefinition` MongoDB document. Supports node types: start, text, buttons, list, dynamic_list, collect_input, end.
2. **Hardcoded Handlers** (`handlers.js`): Direct business logic for city→trek→date→booking flow. Always tried as fallback.

## AI Handler (src/whatsapp/aiHandler.js)
- **Model:** Groq Llama 3.3 70B (free tier), env var `groq_api`
- **Triggered when:** None of the structured handlers match (unknown free text)
- **Context injected:** Live DB departures, city list, user session, conversation history (last 6 turns)
- **Tools:** weather via wttr.in (free), web search via DuckDuckGo (free)
- **Action tags:** AI can emit `<action>{"type":"SELECT_CITY",...}</action>` to trigger handler functions
- **Multi-language:** Configured for English-only replies regardless of input language

## sendMessage.js
- All sends go to `https://graph.facebook.com/{version}/{phoneId}/messages`
- **Auto-saves outbound** to ChatMessage collection
- **Auto-emits** `newMessage` Socket.IO event after saving
- Functions: `sendMessage()`, `sendDocument()`, `sendMedia()`, `sendMediaLink()`, `sendTemplateMessage()`

## Payment Flow
1. User selects departure + group size → `initiatePayUPaymentLink()` creates Booking record
2. Payment URL = `{BASE_URL}/payment/redirect/{txnid}` (auto-submit form page)
3. PayU posts IPN to `{BASE_URL}/payment/success` → updates Booking.status to "paid"
4. Participant token link sent via WhatsApp
5. WhatsApp group invite sent
6. Payment reminder: runs every 5 min via setInterval, sends to pending bookings 30-90 min old

## ChatMessage Model
```js
{ tenantId, phone, direction ("inbound"|"outbound"), message, raw (Object),
  waMessageId (sparse index), deliveryStatus ("sent"|"delivered"|"read"|"failed"),
  deliveryFailureReason, timestamps }
```

## Socket.IO Events Emitted
- `newMessage` — on inbound message received OR outbound message sent
- `messageStatusUpdate` — on delivery status webhook from Meta

## Multi-tenant Note
Current webhook handler sets `tenantId = null` (single-tenant mode). Multi-tenancy hooks are in place but inactive.
