export type CategorySlug = 'laptops' | 'tablets' | 'headphones' | 'speakers' | 'mice';

export interface Category {
  id: string;
  slug: CategorySlug;
  name: string;
  description: string;
  image: string;
  productCount?: number;
}

export interface ProductVariant {
  id: string;
  colour: string;
  colourHex: string;
  stock: number;
  images: string[];
}

export interface ProductSpecification {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  manufacturer: string;
  categoryId: string;
  category: CategorySlug;
  categoryName: string;
  shortDescription: string;
  description: string;
  pricePaise: number;
  originalPricePaise: number | null;
  rating: number;
  reviewCount: number;
  stock: number;
  featured: boolean;
  popular: boolean;
  keywords: string[];
  images: string[];
  variants: ProductVariant[];
  specifications: ProductSpecification[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  product: Product;
  variant: ProductVariant;
}

export interface CartTotals {
  subtotalPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totals: CartTotals;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  marketingOptIn: boolean;
}

export interface Address {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface OrderSummary {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalPaise: number;
  createdAt: string;
  deliveryDate?: string | null;
  deliveryTimeSlot?: string | null;
  items: Array<{
    id: string;
    productName: string;
    productSlug: string;
    variantColour: string;
    quantity: number;
    unitPricePaise: number;
    image: string;
  }>;
}

export type OrderStatus = 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered';

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'refunded';
  totalPaise: number;
  itemCount: number;
  orderDate: string;
  channel: 'web' | 'mobile' | 'support';
  priority: 'normal' | 'priority';
}

export interface ProductReview {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  title: string;
  message: string;
  helpfulCount: number;
  helpfulByMe: boolean;
  isOwn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  average: number;
  total: number;
  byRating: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface TrackingEvent {
  id: string;
  sequence: number;
  status: OrderStatus;
  label: string;
  occurredAt: string;
}

export interface ApiSuccess<T> {
  data: T;
  meta: { requestId: string; [key: string]: unknown };
}

export interface ApiFailure {
  error: { code: string; message: string; fieldErrors?: Record<string, string> };
  meta: { requestId: string };
}
