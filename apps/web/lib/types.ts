export interface User {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  primaryPincode: string | null;
  preferredLocale: string;
  isBuyer: boolean;
  isSupplier: boolean;
  profileComplete: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
  isNewUser: boolean;
}

export interface Area {
  pincode: string;
  city: string;
  state: string;
  isActive?: boolean;
}

export interface Category {
  id: string;
  name: string;
  iconUrl: string | null;
  sortOrder: number;
  parentId: string | null;
}

export interface Suggestion {
  type: 'category' | 'item';
  id: string;
  label: string;
  icon?: string | null;
  supplierCount?: number;
}

export interface CatalogItem {
  id: string;
  title: string;
  unit: string;
  priceEstimate: string | number | null;
  imageUrls: string[];
  supplier?: { id: string; businessName: string };
}

export interface CatalogSearchResult {
  items: CatalogItem[];
  page: number;
  limit: number;
  total: number;
}

export interface CartItem {
  id: string;
  quantity: string | number;
  catalogItem: {
    id: string;
    title: string;
    unit: { id: string; name: string; shortCode: string };
    priceEstimate: string | number | null;
    supplier?: { businessName: string };
  };
}

export interface CartResponse {
  items: CartItem[];
  total_item_count: number;
  total_estimated_value: number;
}

export interface Lead {
  id: string;
  status: string;
  supplierId: string;
}

export interface Rfq {
  id: string;
  categoryId: string;
  pincode: string;
  description: string;
  quantity: string | number;
  unit: string;
  status: string;
  createdAt: string;
  leads?: Lead[];
  _count?: { leads: number };
}
