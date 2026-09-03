export type Locale = 'th' | 'en'
export type ThemePreference = 'system' | 'light' | 'dark' | 'contrast'
export type ProductType = 'READY' | 'PREORDER'
export type UserRole = 'CUSTOMER' | 'ADMIN' | 'OWNER'
export type Route = 'home' | 'favorites' | 'cart' | 'orders' | 'profile' | 'product' | 'announcement' | 'payment' | 'preorder' | 'order-detail' | 'admin'

export interface ShopSettings {
  storeNameTh: string
  storeNameEn: string
  logoUrl?: string
  primaryColor: string
  defaultTheme: ThemePreference
  allowUserTheme: boolean
  pointsEnabled: boolean
  reviewsEnabled: boolean
  favoritesEnabled: boolean
  reservationMinutes: number
  currency: 'THB'
  shippingFee: number
  shippingMode: 'CART' | 'ITEM'
  cartShippingFee: number
  pointsPerBaht: number
  minimumRedeemPoints: number
  maxRedeemPercent: number
  loaderKickerTh: string
  loaderKickerEn: string
  loaderTitleTh: string
  loaderTitleEn: string
  loaderMessageTh: string
  loaderMessageEn: string
  loaderLogoUrl?: string
  shippingTermsTh: string
  shippingTermsEn: string
  shippingTermsVersion: number
  remoteAreaTermsTh: string
  remoteAreaTermsEn: string
  lowStockThreshold: number
}

export interface Category { id: string; nameTh: string; nameEn: string; active: boolean; sortOrder: number }
export interface RichBlock { id:string; type:'p'|'h1'|'h2'|'h3'|'image'; textTh?:string;textEn?:string;imageRef?:string;align:'left'|'center'|'right' }
export interface Announcement { id: string; headerTh: string; headerEn: string; bodyTh: string; bodyEn: string; imageUrl?: string; kind: 'GENERAL' | 'NEW_PRODUCT' | 'PREORDER'; active: boolean;contentEnabled?:boolean;content?:RichBlock[];productIds?:string[] }
export interface Product {
  id: string
  type: ProductType
  titleTh: string
  titleEn: string
  descriptionTh: string
  descriptionEn: string
  price: number
  shippingFee: number
  shippingCalculation: 'FLAT' | 'PER_UNIT'
  deposit: number
  stockOnHand: number
  reservedQuantity: number
  purchaseLimit: number
  points: number
  active: boolean
  reviewEnabled: boolean
  imageUrls: string[]
  categoryId: string
  preorderCampaignId?: string
  contentEnabled?: boolean
  content?: RichBlock[]
  version?: number
}
export interface PreorderTerms { id: string; version: number; titleTh: string; titleEn: string; bodyTh: string; bodyEn: string }
export interface PreorderCampaign {
  id: string
  nameTh: string
  nameEn: string
  openAt: string
  closeAt: string
  expectedArrival: string
  capacity: number
  reservedQuantity: number
  purchaseLimit: number
  deposit: number
  finalPaymentTrigger: string
  status: 'DRAFT' | 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED'
  terms: PreorderTerms
}
export interface PaymentAccount { id: string; bankName: string; accountName: string; accountNumberMasked: string; active: boolean }
export interface StorefrontData {
  settings: ShopSettings
  categories: Category[]
  announcements: Announcement[]
  products: Product[]
  campaigns: PreorderCampaign[]
  paymentAccounts: PaymentAccount[]
  serverTime: string
}
export interface SessionInfo { token: string; expiresAt: string; user: UserProfile }
export interface UserProfile { id: string; email: string; displayName: string; role: UserRole; locale: Locale; pointsBalance: number; xAccount?: string }
export interface AdminAccount { id: string; email: string; displayName: string; role: UserRole; status: string }
export interface AdminConfiguration { settings: ShopSettings; admins: AdminAccount[] }
export interface AdminDashboard { pendingPayments:number;ordersToday:number;lowStock:number;lowStockThreshold:number;lowStockProducts:Array<{id:string;titleTh:string;titleEn:string;available:number}>;failedJobs:number;totalTransferred:number;totalOrders:number;totalItems:number;daily:Array<{date:string;revenue:number;orders:number;items:number}>;productSales:Array<{productId:string;nameTh:string;nameEn:string;quantity:number;revenue:number}> }
export interface OrderStatusOption { id: string; th: string; en: string }
export interface AdminPayment { id: string; orderId: string; amount: number; status: string; slipFileId?: string; reviewNote?: string }
export interface AdminOrder extends OrderSummary { userEmail: string; userXAccount?:string; shippingFee: number; shippingBaseFee?:number; shippingAdjustment?:number; shippingAdjustmentNote?:string; payment: AdminPayment | null }
export interface AdminWorkspace {
  products: Product[]
  categories: Array<Category & { version?: number }>
  announcements: Array<Announcement & { sortOrder?: number; version?: number }>
  campaigns: Array<PreorderCampaign & { version?: number }>
  paymentAccounts: Array<PaymentAccount & { accountNumber?: string; sortOrder?: number; version?: number }>
  orders: AdminOrder[]
  reviews: ProductReview[]
  statuses: OrderStatusOption[]
  contextRole: UserRole
}
export interface ProductReview { id: string; productId?: string; rating: number; body: string; adminReply?: string; displayName?: string; status?: string; createdAt: string }
export interface UserNotification { id: string; kind: string; titleTh: string; titleEn: string; bodyTh: string; bodyEn: string; readAt?: string; createdAt: string }
export interface CartLine { productId: string; quantity: number }
export interface OrderSummary {
  id: string
  reference: string
  orderType: ProductType
  status: string
  subtotal: number
  shippingFee?: number
  amountDueNow?: number
  totalPaid: number
  balanceDue: number
  shipping?: { name?: string; phone?: string; address?: string; xAccount?:string; specialAreaType?:string; areaClassificationConfirmed?:boolean; specialAreaCostAccepted?:boolean }
  items?: Array<{ id: string; productId: string; titleSnapshot: string; unitPrice: number; quantity: number }>
  history?: Array<{ id: string; fromStatus?: string; toStatus: string; note?: string; actorUserId?: string; createdAt: string }>
  messages?: UserNotification[]
  reservedUntil?: string
  createdAt: string
}
export interface ReservationResult { order: OrderSummary; serverTime: string }
export interface ApiEnvelope<T> { ok: boolean; data?: T; error?: { code: string; message: string; details?: unknown }; requestId: string; serverTime: string; apiVersion: string }
export interface OutboxMutation { id: string; entity: string; action: string; payload: unknown; createdAt: string; attempts: number; nextAttemptAt: string; state: 'QUEUED' | 'SENDING' | 'RETRY_WAIT' | 'CONFLICT' | 'FAILED' | 'CONFIRMED'; lastError?: string }
