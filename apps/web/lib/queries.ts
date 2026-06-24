'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './clientApi';
import { track } from './analytics';
import type {
  Area,
  AuthSession,
  CartResponse,
  Category,
  CatalogSearchResult,
  Rfq,
  Suggestion,
  User,
} from './types';

const qs = (p: Record<string, string | number | undefined>) => {
  const parts = Object.entries(p)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

export function useRequestOtp() {
  return useMutation({
    mutationFn: (email: string) =>
      api('/auth/otp/request', { method: 'POST', body: JSON.stringify({ email }) }),
  });
}
export function useVerifyOtp() {
  return useMutation({
    mutationFn: (v: { email: string; code: string }) =>
      api<AuthSession>('/auth/otp/verify', { method: 'POST', body: JSON.stringify(v) }),
  });
}
export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { fullName?: string; primaryPincode?: string; isSupplier?: boolean }) =>
      api<User>('/users/me', { method: 'PATCH', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}
export function useUpdateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pincode: string) =>
      api<User>('/users/me/area', { method: 'PATCH', body: JSON.stringify({ pincode }) }),
    onSuccess: () => qc.invalidateQueries(),
  });
}
export function useActiveAreas() {
  return useQuery({ queryKey: ['areas'], queryFn: () => api<Area[]>('/areas/active') });
}
/** Check a (possibly non-serviceable) pincode — backend records area_interests + area.unserved. */
export function useCheckArea() {
  return useMutation({
    mutationFn: (v: { pincode: string; anonymousId?: string }) =>
      api<{ servicable: boolean; city: string | null; state: string | null }>(
        `/areas/check${qs({ pincode: v.pincode, anonymousId: v.anonymousId })}`,
      ),
  });
}
export interface UnitOption {
  id: string;
  name: string;
  shortCode: string;
  sortOrder: number;
}
export function useUnits(locale: string) {
  return useQuery({
    queryKey: ['units', locale],
    queryFn: () => api<UnitOption[]>(`/units${qs({ locale })}`),
  });
}
export function useRequestUnit() {
  return useMutation({
    mutationFn: (v: { rawText: string; context?: string }) =>
      api('/unit-requests', { method: 'POST', body: JSON.stringify(v) }),
  });
}
export function useCategories(locale: string) {
  return useQuery({
    queryKey: ['categories', locale],
    queryFn: () => api<Category[]>(`/categories${qs({ locale })}`),
  });
}
export function useSuggest(q: string, pincode: string, locale: string) {
  return useQuery({
    queryKey: ['suggest', q, pincode, locale],
    queryFn: () =>
      api<{ suggestions: Suggestion[] }>(`/search/suggest${qs({ q, pincode, locale })}`),
    enabled: Boolean(pincode),
  });
}
export function useCatalog(category: string | undefined, pincode: string, q?: string) {
  return useQuery({
    queryKey: ['catalog', category, pincode, q],
    queryFn: () => api<CatalogSearchResult>(`/catalog${qs({ category, pincode, q })}`),
    enabled: Boolean(pincode),
  });
}
export function useCart() {
  return useQuery({ queryKey: ['cart'], queryFn: () => api<CartResponse>('/cart') });
}
export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { catalogItemId: string; quantity: number }) =>
      api('/cart', { method: 'POST', body: JSON.stringify(v) }),
    onSuccess: (_data, v) => {
      track('cart.item_added', {
        catalogItemId: v.catalogItemId,
        properties: { quantity: v.quantity },
      });
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { itemId: string; quantity: number }) =>
      api(`/cart/${v.itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity: v.quantity }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}
export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => api(`/cart/${itemId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}
export function useCreateRfq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      categoryId: string;
      pincode?: string;
      description: string;
      quantity: number;
      unitId: string;
    }) => api<Rfq>('/rfqs', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rfqs'] }),
  });
}
export function useMyRfqs() {
  return useQuery({ queryKey: ['rfqs'], queryFn: () => api<Rfq[]>('/rfqs') });
}

export interface OrderRow {
  id: string;
  status: string;
  totalAmount: string | number;
  placedAt: string;
  supplier?: { id: string; businessName: string } | null;
  buyer?: { fullName: string | null; phone: string | null } | null;
  deliveryAddress?: { label: string; pincode: string } | null;
}
export function useOrders(role: 'buyer' | 'supplier') {
  return useQuery({
    queryKey: ['orders', role],
    queryFn: () => api<OrderRow[]>(`/orders${qs({ role })}`),
  });
}

export interface OrderStatusEventRow {
  id: string;
  status: string;
  occurredAt: string;
  note: string | null;
}
export interface OrderTimeline {
  orderId: string;
  status: string;
  totalAmount: string | number;
  supplierName: string;
  supplierPhone: string | null;
  isSupplier: boolean;
  events: OrderStatusEventRow[];
}
export function useOrderTimeline(orderId: string) {
  return useQuery({
    queryKey: ['order-timeline', orderId],
    queryFn: () => api<OrderTimeline>(`/orders/${orderId}/timeline`),
    enabled: Boolean(orderId),
  });
}
export function useAdvanceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { orderId: string; status: string; note?: string }) =>
      api(`/orders/${v.orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: v.status, note: v.note }),
      }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['order-timeline', v.orderId] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
export function useRaiseDispute() {
  return useMutation({
    mutationFn: (v: { orderId: string; reason: string; description?: string }) =>
      api(`/orders/${v.orderId}/dispute`, {
        method: 'POST',
        body: JSON.stringify({ reason: v.reason, description: v.description }),
      }),
  });
}
export function useRfq(id: string) {
  return useQuery({
    queryKey: ['rfq', id],
    queryFn: () => api<Rfq>(`/rfqs/${id}`),
    enabled: Boolean(id),
  });
}

// ── Notifications (PRD-01 §18, PRD-03 §4.10) ───────────────────────────
// Polling stands in for the WebSocket channel (flagged in PENDING-REVIEW):
// the list/badge refetch on an interval so updates appear without a refresh.
export interface NotificationRow {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}
export interface NotificationPage {
  items: NotificationRow[];
  nextCursor: string | null;
}
export function useNotifications(cursor?: string) {
  return useQuery({
    queryKey: ['notifications', cursor ?? 'first'],
    queryFn: () => api<NotificationPage>(`/notifications${qs({ cursor, limit: 20 })}`),
    refetchInterval: 20000,
  });
}
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api<{ count: number }>('/notifications/unread-count'),
    refetchInterval: 15000,
  });
}
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// ── Request a Callback (PRD-01 §16.2, PRD-03 §4.6–4.7) ─────────────────
export interface CallbackRequestResult {
  id: string;
  status: string;
  preferredPhone: string;
}
export function useRequestCallback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { preferredPhone: string; note?: string }) =>
      api<CallbackRequestResult>('/callbacks', {
        method: 'POST',
        body: JSON.stringify(v),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
export interface PaymentLinkInfo {
  id: string;
  url: string;
  amount: string | number;
  status: string;
}
export function usePaymentLink(id: string) {
  return useQuery({
    queryKey: ['payment-link', id],
    queryFn: () => api<PaymentLinkInfo>(`/payment-links/${id}`),
    enabled: Boolean(id),
  });
}
