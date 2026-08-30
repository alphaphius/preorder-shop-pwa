import type { ApiEnvelope, OrderSummary, ReservationResult, SessionInfo, StorefrontData, UserProfile } from '../domain/types'

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
  verifyOtp(email: string, code: string) { return this.post<SessionInfo>('verifyOtp', { email, code }) }
  me(session: string) { return this.post<UserProfile>('me', {}, session) }
  createReservation(session: string, lines: { productId: string; quantity: number }[], termsAcceptance?: { termsId: string; version: number }) { return this.post<ReservationResult>('createReservation', { lines, termsAcceptance }, session) }
  uploadSlip(session: string, payload: { orderId: string; amount: number; accountId: string; transferAt: string; fileName: string; mimeType: string; base64: string }) { return this.post<{ order: OrderSummary; paymentId: string; emailJobId: string }>('uploadSlip', payload, session) }
  listOrders(session: string) { return this.post<OrderSummary[]>('listOrders', {}, session) }
  toggleFavorite(session: string, productId: string) { return this.post<{ active: boolean }>('toggleFavorite', { productId }, session) }
  adminDashboard(session: string) { return this.post<Record<string, number>>('adminDashboard', {}, session) }
}
