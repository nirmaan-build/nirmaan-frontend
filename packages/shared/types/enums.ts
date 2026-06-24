/**
 * Domain enums — duplicated from the backend Prisma schema.
 *
 * SOURCE OF TRUTH: apps/backend/prisma/schema.prisma (nirmaan-backend repo)
 *
 * These are manually kept in sync. When you change an enum in the Prisma
 * schema, update this file in the same PR / push.
 *
 * Enums NOT duplicated here (backend-only, no UI relevance):
 *   - AuthProvider      (handled by backend auth flow)
 *   - AnalyticsSource   (server-emitted, never shown in UI)
 */

// ─── Auth & Users ────────────────────────────────────────────────────────────

export enum SupplierStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  SUSPENDED = 'SUSPENDED',
}

// ─── RFQ Lifecycle ───────────────────────────────────────────────────────────

export enum RfqStatus {
  OPEN = 'OPEN',
  MATCHED = 'MATCHED',
  UNMATCHED = 'UNMATCHED',
  QUOTED = 'QUOTED',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED',
}

export enum LeadStatus {
  PENDING = 'PENDING',
  VIEWED = 'VIEWED',
  QUOTED = 'QUOTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

export enum QuoteStatus {
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

// ─── Orders & Payments ───────────────────────────────────────────────────────

export enum OrderStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

// ─── Callback & Payment Links (admin) ────────────────────────────────────────

export enum CallbackRequestStatus {
  PENDING = 'PENDING',
  CONTACTED = 'CONTACTED',
  CART_UPDATED = 'CART_UPDATED',
  LINK_SENT = 'LINK_SENT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentLinkStatus {
  CREATED = 'CREATED',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

// ─── Messaging ───────────────────────────────────────────────────────────────

export enum MessageType {
  TEXT = 'TEXT',
  CALL_REQUEST = 'CALL_REQUEST',
  SYSTEM = 'SYSTEM',
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OPS = 'OPS',
  SUPPORT = 'SUPPORT',
  VIEWER = 'VIEWER',
}

export enum UnitRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum BroadcastSegment {
  ALL = 'ALL',
  BUYERS = 'BUYERS',
  SUPPLIERS = 'SUPPLIERS',
}
