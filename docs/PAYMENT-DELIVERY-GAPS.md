# Gap Analysis — from "today" to Payment & Delivery

You asked to seed a complete flow "till payment" and find the gaps to payment +
delivery. The headline finding first, then the detail.

## TL;DR

**Nirmaan v1 is a lead-generation marketplace, not a transactional store.** The
implemented flow ends at:

```
browse catalog → add to "My Truck" → post RFQ → matching creates Leads
→ supplier sends Quote → buyer ACCEPTS quote → (tap-to-call / contact offline)
```

There is **no Order, no Payment, and no Delivery** in the schema or the code —
payments/escrow/checkout were explicitly **out of scope for v1** (PRD-00 §6). So a
flow "till payment" can't be tested today because those tables and endpoints don't
exist. The seed (`apps/backend/prisma/seed.ts`) populates everything that *does*
exist so you can run the full implemented flow end-to-end. The closest signal to an
"order" is **quote acceptance**, which now fires an internal alert so you can close
the deal manually (your optional ask — done).

## What the seed gives you

Run `cd apps/backend && npx prisma db seed` (idempotent). It creates:
- 2 active areas (Dehradun 248001, Haridwar 249401)
- 8 high-margin categories (Tiles, Bath & Sanitaryware, Paints, Plywood & Laminates,
  Electricals, Lighting, Adhesives & Waterproofing, Modular Kitchen) — each with a
  Hindi name and 4 catalog items (32 items total, realistic INR prices/units)
- 3 verified suppliers serving both pincodes, linked to their categories
- 1 test buyer

That exercises: catalog browse/search, suggestions, add-to-truck, RFQ + matching
(leads get created because suppliers serve the area+category), quote submit/accept,
and the new internal alert.

## The flow today vs. what "payment + delivery" needs

| Step | Today | Needed for payment/delivery |
|---|---|---|
| Discover product | ✅ catalog + search | — |
| Express intent | ✅ RFQ or accept a quote | A real **Order** (chosen items, qty, price, address) |
| Agree price | ✅ Quote (negotiated) | Lock quote → order line items + totals |
| **Place order** | ❌ none | `Order` + `OrderItem` entities + "place order" endpoint |
| **Pay** | ❌ none | Payment gateway (Razorpay/UPI), `Payment`, webhooks, refunds |
| **Address** | ❌ only a pincode on the user | `Address` entity (line, city, pincode, geo, contact) |
| **Fulfil / deliver** | ❌ none | Order status lifecycle + delivery/shipment + delivery fee |
| Invoice / tax | ❌ none (suppliers have GST no.) | GST invoice generation |
| After-sale | ❌ none | Ratings/reviews, returns |

## Concrete gaps (what to build for a transactional v2)

**1. Schema (new models)**
- `Address` (userId, line1/2, city, pincode, lat/lng, contactPhone)
- `Order` (buyerId, supplierId, addressId, status, subtotal, deliveryFee, total, placedAt) + `OrderStatus` enum (`PLACED → CONFIRMED → PACKED → SHIPPED → DELIVERED → CANCELLED`)
- `OrderItem` (orderId, catalogItemId, titleSnapshot, unit, unitPrice, quantity, lineTotal)
- `Payment` (orderId, provider, providerOrderId, providerPaymentId, amount, status, method, rawWebhook) + `PaymentStatus` enum (`CREATED → AUTHORIZED → PAID → FAILED → REFUNDED`)
- optional `Shipment`/`Delivery` (orderId, partner, trackingId, status, eta)
- Migration runs on your Mac (the established Stage-0 constraint).

**2. Backend modules**
- **Orders** — create order (from an accepted quote or from the cart), list/detail, cancel; supplier-side order management.
- **Payments** — create a gateway order (Razorpay recommended for India: UPI/cards/netbanking), verify signature, handle webhooks, mark `Payment`/`Order` paid; refunds. Needs API keys + a public webhook URL.
- **Delivery/fulfilment** — order status transitions; optional logistics integration; delivery-fee rules (e.g., by pincode/weight).
- Convert "My Truck" `Send as Requirement` (currently → RFQ) into an optional `→ place order` path for fixed-price items.

**3. Clients (mobile + web)**
- Checkout flow: address capture, order summary, pay button (gateway SDK), order confirmation, order history + tracking. (Web has no item-detail/checkout route yet either.)

**4. Admin**
- Orders & payments dashboard, refunds, fulfilment status, reconciliation.

**5. Ops / external**
- Razorpay (or equivalent) merchant account + KYC; webhook endpoint (HTTPS); GST invoicing; refund policy; settlement to suppliers (marketplace payout — a bigger compliance topic).

## The interim bridge (built now — your optional ask)

Until orders/payments exist, the manual path is live: when a buyer **accepts a
quote**, `QuoteService.accept` calls `NotificationsService.notifyInternalTeam('order_intent', …)`,
which:
- logs an `[INTERNAL ALERT] order_intent: {…}` line on the server, and
- writes a `notifications` row for every `ADMIN_EMAILS` admin that has a user account.

The payload carries everything needed to close the deal by phone: buyer name +
phone + email, the category/description/quantity, the supplier, and the accepted
price. So today you *can* "get notified and contact them personally" — it just keys
off quote-acceptance rather than a paid order. When FCM/email is wired (currently a
stub) these alerts also push/email automatically.

## Recommended sequence to reach payments

1. Add `Address` + `Order` + `OrderItem` + `Payment` to `schema.prisma`, migrate.
2. Orders module (place from accepted quote first — simplest, reuses negotiated price).
3. Razorpay integration + webhook → mark paid.
4. Checkout UI (mobile + web) + order history.
5. Delivery status lifecycle + admin order management.
6. Invoicing, refunds, supplier payouts.

Until step 1 ships, "till payment" testing isn't possible — by design, not by bug.
