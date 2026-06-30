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

/**
 * Coerce a list response into an array. Tolerates endpoints that return a bare
 * array or wrap it in a pagination envelope (`{ data | items | results: [] }`).
 */
function asArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>;
    for (const key of ['data', 'items', 'results', 'rfqs']) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

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
export interface UnitRequestRow {
  id: string;
  rawText: string;
  context: string | null;
  status: string;
  resolvedUnit: { id: string; name: string; shortCode: string } | null;
  createdAt: string;
}
export function useMyUnitRequests() {
  return useQuery({
    queryKey: ['unit-requests'],
    queryFn: () => api<UnitRequestRow[]>('/unit-requests'),
  });
}
export function useCategories(locale: string) {
  return useQuery({
    queryKey: ['categories', locale],
    queryFn: () => api<Category[]>(`/categories${qs({ locale })}`),
    // Always treat cached categories as stale so any admin hide/unhide reflects
    // on the very next page visit without the user needing to clear cache.
    staleTime: 0,
    gcTime: 60_000, // keep in memory for 1 min after last subscriber unmounts
  });
}
export function useSuggest(q: string, pincode: string, locale: string) {
  return useQuery({
    queryKey: ['suggest', q, pincode, locale],
    queryFn: () =>
      api<{ suggestions: Suggestion[] }>(`/search/suggest${qs({ q, pincode, locale })}`),
    // Don't fire until user has typed ≥2 chars AND has a pincode set.
    enabled: Boolean(pincode) && q.length >= 2,
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
export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // No bulk-delete endpoint — remove all items in parallel.
      const cart = qc.getQueryData<CartResponse>(['cart']);
      if (!cart?.items?.length) return;
      await Promise.all(cart.items.map((it) => api(`/cart/${it.id}`, { method: 'DELETE' })));
    },
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
  return useQuery({ queryKey: ['rfqs'], queryFn: () => api<unknown>('/rfqs').then(asArray<Rfq>) });
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
    // Refetch every 60s. React Query deduplicates — both Topbar and MobileHeader
    // NotificationBell share this subscription, so exactly one HTTP request fires
    // per interval regardless of how many components subscribe.
    refetchInterval: 60000,
    staleTime: 60000,
    refetchOnWindowFocus: false,
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
// ── Supplier dashboard (PRD-01 §6) ──────────────────────────────────────
export interface SupplierCatalogItem {
  id: string;
  title: string;
  unit: string;
  priceEstimate: string | number | null;
  isActive: boolean;
  imageUrls: string[];
  category: { id: string; name: string };
}
export function useSupplierCatalog() {
  return useQuery({
    queryKey: ['supplier-catalog'],
    queryFn: () => api<SupplierCatalogItem[]>('/supplier/catalog'),
  });
}
export function useCreateCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { categoryId: string; title: string; unitId: string; priceEstimate?: number; imageUrls?: string[] }) =>
      api<SupplierCatalogItem>('/supplier/catalog', { method: 'POST', body: JSON.stringify(v) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplier-catalog'] }),
  });
}
export function useUpdateCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; title?: string; priceEstimate?: number | null; isActive?: boolean; imageUrls?: string[] }) => {
      const { id, ...body } = v;
      return api<SupplierCatalogItem>(`/supplier/catalog/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplier-catalog'] }),
  });
}
export function useDeleteCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/supplier/catalog/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplier-catalog'] }),
  });
}

export function usePaymentLink(id: string) {
  return useQuery({
    queryKey: ['payment-link', id],
    queryFn: () => api<PaymentLinkInfo>(`/payment-links/${id}`),
    enabled: Boolean(id),
  });
}
