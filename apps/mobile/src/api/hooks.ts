import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from './client';
import { track } from '../lib/analytics';
import {
  Area,
  AuthSession,
  CartResponse,
  Category,
  CatalogItem,
  CatalogSearchResult,
  Rfq,
  Suggestion,
  User,
} from './types';

const qs = (params: Record<string, string | number | undefined>) => {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

// ── Auth ──────────────────────────────────────────────────────────────
export function useRequestOtp() {
  return useMutation({
    mutationFn: (email: string) =>
      api<{ success: boolean; expiresInSec: number }>('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (vars: { email: string; code: string }) =>
      api<AuthSession>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify(vars),
      }),
  });
}

// ── Users ─────────────────────────────────────────────────────────────
export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      fullName?: string;
      primaryPincode?: string;
      isSupplier?: boolean;
    }) => api<User>('/users/me', { method: 'PATCH', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useUpdateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pincode: string) =>
      api<User>('/users/me/area', {
        method: 'PATCH',
        body: JSON.stringify({ pincode }),
      }),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

// ── Areas ─────────────────────────────────────────────────────────────
export function useActiveAreas() {
  return useQuery({
    queryKey: ['areas'],
    queryFn: () => api<Area[]>('/areas/active'),
  });
}

/**
 * Check a (possibly non-serviceable) pincode. The backend records an
 * area_interests row + emits area.unserved when it's not serviceable
 * (PRD-00 §3.12.2) — so this is a capture point, not just a yes/no.
 */
export function useCheckArea() {
  return useMutation({
    mutationFn: (vars: { pincode: string; anonymousId?: string }) =>
      api<{ servicable: boolean; city: string | null; state: string | null }>(
        `/areas/check${qs({ pincode: vars.pincode, anonymousId: vars.anonymousId })}`,
      ),
  });
}

// ── Units (predefined; request-new-unit never blocks) ──────────────────
export interface UnitOption {
  id: string;
  name: string; // locale-resolved
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
    mutationFn: (vars: { rawText: string; context?: string }) =>
      api('/unit-requests', { method: 'POST', body: JSON.stringify(vars) }),
  });
}

// ── Catalog / search ──────────────────────────────────────────────────
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
      api<{ suggestions: Suggestion[] }>(
        `/search/suggest${qs({ q, pincode, locale })}`,
      ),
    enabled: Boolean(pincode),
  });
}

export function useCatalog(category: string | undefined, pincode: string, q?: string) {
  return useQuery({
    queryKey: ['catalog', category, pincode, q],
    queryFn: () =>
      api<CatalogSearchResult>(`/catalog${qs({ category, pincode, q })}`),
    enabled: Boolean(pincode),
  });
}

export function useCatalogItem(id: string) {
  return useQuery({
    queryKey: ['catalog', id],
    queryFn: () => api<CatalogItem & { category: { id: string; name: string } }>(
      `/catalog/${id}`,
    ),
    enabled: Boolean(id),
  });
}

// ── Cart (My Truck) ───────────────────────────────────────────────────
export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => api<CartResponse>('/cart'),
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { catalogItemId: string; quantity: number }) =>
      api('/cart', { method: 'POST', body: JSON.stringify(vars) }),
    onSuccess: (_data, vars) => {
      // cart.item_added (PRD-01 §20.2) — the cart POST has no server-side emit,
      // so the client owns this one. Pseudonymous only; no PII.
      track('cart.item_added', {
        catalogItemId: vars.catalogItemId,
        properties: { quantity: vars.quantity },
      });
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { itemId: string; quantity: number }) =>
      api(`/cart/${vars.itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: vars.quantity }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      api(`/cart/${itemId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

// ── RFQ ───────────────────────────────────────────────────────────────
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
  return useQuery({
    queryKey: ['rfqs'],
    queryFn: () => api<Rfq[]>('/rfqs'),
  });
}

// ── Orders (PRD-02 §3.11) ──────────────────────────────────────────────
export interface OrderListItem {
  id: string;
  status: string;
  totalAmount: string;
  placedAt: string;
  supplier?: { id: string; businessName: string } | null;
  buyer?: { fullName: string | null; phone: string | null } | null;
}
export function useMyOrders(role: 'buyer' | 'supplier') {
  return useQuery({
    queryKey: ['orders', role],
    queryFn: () => api<OrderListItem[]>(`/orders${qs({ role })}`),
  });
}

// ── Payment (PRD-01 §14, PRD-02 §4) ────────────────────────────────────
export interface InitiatePaymentResult {
  razorpayOrderId: string;
  amount: number; // paise
  currency: string;
  key: string;
  paymentId: string;
}
export function useInitiatePayment() {
  return useMutation({
    mutationFn: (orderId: string) =>
      api<InitiatePaymentResult>(`/orders/${orderId}/payment/initiate`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
  });
}
export function usePaymentStatus(orderId: string, enabled = true) {
  return useQuery({
    queryKey: ['payment-status', orderId],
    queryFn: () =>
      api<{ orderStatus: string; paymentStatus: string | null }>(
        `/orders/${orderId}/payment/status`,
      ),
    enabled: enabled && Boolean(orderId),
  });
}

// ── Order tracking (PRD-01 §13, PRD-02 §3.12) ──────────────────────────
export interface OrderStatusEventRow {
  id: string;
  status: string;
  occurredAt: string;
  note: string | null;
}
export interface OrderTimeline {
  orderId: string;
  status: string;
  totalAmount: string;
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
    mutationFn: (vars: { orderId: string; status: string; note?: string }) =>
      api(`/orders/${vars.orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: vars.status, note: vars.note }),
      }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['order-timeline', vars.orderId] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
export function useRaiseDispute() {
  return useMutation({
    mutationFn: (vars: { orderId: string; reason: string; description?: string }) =>
      api(`/orders/${vars.orderId}/dispute`, {
        method: 'POST',
        body: JSON.stringify({ reason: vars.reason, description: vars.description }),
      }),
  });
}

// ── Notifications (PRD-01 §18, PRD-02 §3.13) ───────────────────────────
// Real-time while-open is approximated with polling (refetchInterval); a true
// WebSocket channel + FCM background push are flagged in PENDING-REVIEW (need
// @nestjs/websockets/socket.io + Firebase admin SDK, not installable here).
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
    queryFn: () =>
      api<NotificationPage>(`/notifications${qs({ cursor, limit: 20 })}`),
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
    mutationFn: (id: string) =>
      api(`/notifications/${id}/read`, { method: 'PATCH' }),
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

// ── Request a Callback (PRD-01 §16.2, PRD-02 §3.9–3.10) ────────────────
// "Talk to us first" — snapshots the current cart server-side into a
// CallbackRequest the team works from. Never a broken-checkout fallback.
export interface CallbackRequestResult {
  id: string;
  status: string;
  preferredPhone: string;
}
export function useRequestCallback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { preferredPhone: string; note?: string }) =>
      api<CallbackRequestResult>('/callbacks', {
        method: 'POST',
        body: JSON.stringify(vars),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export interface PaymentLinkInfo {
  id: string;
  url: string;
  amount: string;
  status: string;
}
export function usePaymentLink(id: string) {
  return useQuery({
    queryKey: ['payment-link', id],
    queryFn: () => api<PaymentLinkInfo>(`/payment-links/${id}`),
    enabled: Boolean(id),
  });
}
