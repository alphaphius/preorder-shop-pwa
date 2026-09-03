import type { AdminAccount, AdminConfiguration, AdminDashboard, AdminWorkspace, Announcement, ApiEnvelope, Category, OrderStatusOption, OrderSummary, PaymentAccount, PreorderCampaign, Product, ProductReview, ReservationResult, SessionInfo, ShopSettings, StorefrontData, UserNotification, UserProfile } from '../domain/types'

const EXEC_URL = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/
export function normalizeEndpoint(raw: string) {
  const value = raw.trim().replace(/\/$/, '')
  if (!EXEC_URL.test(value)) throw new Error('กรุณาใช้ Apps Script Web App URL ที่ลงท้ายด้วย /exec')
  return value
}

export class ApiError extends Error {
  constructor(public code: string, message: string, public details?: unknown) { super(message) }
}

export class ApiClient {
  constructor(public endpoint: string) { this.endpoint = normalizeEndpoint(endpoint) }
  private async parse<T>(response: Response): Promise<T> {
    const envelope = await response.json() as ApiEnvelope<T>
    if (!envelope.ok || !envelope.data) throw new ApiError(envelope.error?.code || 'SERVER_ERROR', envelope.error?.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์', envelope.error?.details)
    return envelope.data
  }
  async get<T>(action: string, params: Record<string, string> = {}) {
    const url = new URL(this.endpoint); url.searchParams.set('action', action)
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
    return this.parse<T>(await fetch(url, { redirect: 'follow', cache: 'no-store' }))
  }
  async post<T>(action: string, payload: unknown = {}, session = '') {
    const response = await fetch(this.endpoint, {
      method: 'POST', redirect: 'follow', cache: 'no-store',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload, session, requestId: crypto.randomUUID() }),
    })
    return this.parse<T>(response)
  }
  health() { return this.get<{ apiVersion: string; schemaVersion: number; installed: boolean; serverTime: string }>('health') }
  storefront(locale = 'th') { return this.get<StorefrontData>('storefront', { locale }) }
  connectionTest() { return this.post<{ health: boolean; roundTrip: boolean }>('connectionTest') }
  requestOtp(email: string) { return this.post<{ expiresAt: string; maskedEmail: string }>('requestOtp', { email }) }
  verifyOtp(email: string, code: string, rememberDevice = true) { return this.post<SessionInfo>('verifyOtp', { email, code, rememberDevice }) }
  me(session: string) { return this.post<UserProfile>('me', {}, session) }
  createReservation(session: string, lines: { productId: string; quantity: number }[], termsAcceptance?: { termsId: string; version: number }, redeemPoints = 0, shipping: Record<string,string> = {}, shippingAcceptance?: { version:number }) { return this.post<ReservationResult>('createReservation', { lines, termsAcceptance, redeemPoints, shipping, shippingAcceptance }, session) }
  uploadSlip(session: string, payload: { orderId: string; amount: number; accountId: string; transferAt: string; fileName: string; mimeType: string; base64: string }) { return this.post<{ order: OrderSummary; paymentId: string; emailJobId: string }>('uploadSlip', payload, session) }
  listOrders(session: string) { return this.post<OrderSummary[]>('listOrders', {}, session) }
  listFavorites(session: string) { return this.post<string[]>('listFavorites', {}, session) }
  toggleFavorite(session: string, productId: string) { return this.post<{ active: boolean }>('toggleFavorite', { productId }, session) }
  productReviews(productId: string) { return this.get<ProductReview[]>('productReviews', { productId }) }
  publicMedia(id: string) { return this.get<{ id:string; mimeType:string; base64:string }>('publicMedia', { id }) }
  createReview(session: string, productId: string, rating: number, body: string) { return this.post<ProductReview>('createReview', { productId, rating, body }, session) }
  listNotifications(session: string) { return this.post<UserNotification[]>('listNotifications', {}, session) }
  readNotification(session: string, id: string) { return this.post<UserNotification>('readNotification', { id }, session) }
  notificationFeed(session:string,since:string){return this.post<{events:Array<{id:string;kind:string;titleTh:string;titleEn:string;bodyTh:string;bodyEn:string;createdAt:string}>;cursor:string}>('notificationFeed',{since},session)}
  adminDashboard(session: string) { return this.post<AdminDashboard>('adminDashboard', {}, session) }
  adminWorkspace(session: string) { return this.post<AdminWorkspace>('adminWorkspace', {}, session) }
  adminConfiguration(session: string) { return this.post<AdminConfiguration>('adminConfiguration', {}, session) }
  adminSaveSettings(session: string, settings: Partial<ShopSettings>) { return this.post<ShopSettings>('adminSaveSettings', settings, session) }
  adminAddAdmin(session: string, email: string, displayName = '') { return this.post<AdminAccount>('adminAddAdmin', { email, displayName }, session) }
  adminSetShippingAdjustment(session:string,orderId:string,amount:number,note:string){return this.post<OrderSummary>('adminSetShippingAdjustment',{orderId,amount,note},session)}
  adminSaveProduct(session: string, product: Product) { return this.post<Product>('adminSaveProduct', product, session) }
  adminSaveCategory(session: string, category: Partial<Category>) { return this.post<Category>('adminSaveCategory', category, session) }
  adminSaveAnnouncement(session: string, announcement: Partial<Announcement>) { return this.post<Announcement>('adminSaveAnnouncement', announcement, session) }
  adminSaveCampaign(session: string, campaign: Partial<PreorderCampaign>) { return this.post<PreorderCampaign>('adminSaveCampaign', campaign, session) }
  adminSavePaymentAccount(session: string, account: Partial<PaymentAccount> & { accountNumber?: string }) { return this.post<PaymentAccount>('adminSavePaymentAccount', account, session) }
  adminSetEntityActive(session: string, entity: string, id: string, active: boolean) { return this.post<Record<string, unknown>>('adminSetEntityActive', { entity, id, active }, session) }
  adminSaveStatuses(session: string, statuses: OrderStatusOption[]) { return this.post<OrderStatusOption[]>('adminSaveStatuses', { statuses }, session) }
  adminReviewPayment(session: string, paymentId: string, approved: boolean, note = '') { return this.post<Record<string, unknown>>('adminReviewPayment', { paymentId, approved, note }, session) }
  adminTransitionOrder(session: string, orderId: string, status: string, note = '') { return this.post<Record<string, unknown>>('adminTransitionOrder', { orderId, status, note }, session) }
  adminSendMessage(session: string, orderId: string, bodyTh: string, bodyEn = '', sendEmail = true) { return this.post<Record<string, unknown>>('adminSendMessage', { orderId, bodyTh, bodyEn, sendEmail }, session) }
  adminModerateReview(session: string, id: string, approved: boolean, adminReply = '') { return this.post<Record<string, unknown>>('adminModerateReview', { id, approved, adminReply }, session) }
  adminUploadMedia(session:string,payload:{kind:'PRODUCT_IMAGE'|'ANNOUNCEMENT_IMAGE'|'BLOG_IMAGE'|'SHOP_LOGO';fileName:string;mimeType:string;base64:string}){return this.post<{id:string;ref:string;fileName:string;mimeType:string;size:number}>('adminUploadMedia',payload,session)}
  adminFile(session:string,id:string){return this.post<{id:string;fileName:string;mimeType:string;base64:string}>('adminFile',{id},session)}
}
