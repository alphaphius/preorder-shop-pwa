import { useEffect, useMemo, useState } from 'react'
import type { CartLine, Locale, OrderSummary, Product, ProductType, Route, SessionInfo, StorefrontData, ThemePreference } from '../domain/types'
import { ApiClient } from '../api/client'
import { configuredWebAppUrl } from '../config/runtime'
import { cacheStorefront, loadCachedStorefront, loadCart, saveCart } from '../db/database'
import { mockStorefront } from '../mock/data'
import { AppShell } from '../components/AppShell'
import { StoreLoadingScreen } from '../components/StoreLoadingScreen'
import { AuthDialog } from '../pages/AuthDialog'
import { SetupPage } from '../pages/SetupPage'
import { StorefrontPage, ProductPage } from '../pages/StorePages'
import { CartPage, PaymentPage } from '../pages/CheckoutPages'
import { OrdersPage, ProfilePage } from '../pages/AccountPages'
import { AdminPage } from '../pages/AdminPage'

type CartState = Record<ProductType, CartLine[]>
const emptyCart: CartState = { READY: [], PREORDER: [] }
const routeFromHash = (): { route: Route; id?: string } => {
  const [route = 'home', id] = location.hash.replace(/^#\/?/, '').split('/')
  const allowed: Route[] = ['home', 'favorites', 'cart', 'orders', 'profile', 'product', 'payment', 'preorder', 'order-detail', 'admin']
  return { route: allowed.includes(route as Route) ? route as Route : 'home', id }
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => (localStorage.getItem('shop.locale') as Locale) || 'th')
  const [theme, setTheme] = useState<ThemePreference>(() => (localStorage.getItem('shop.theme') as ThemePreference) || 'system')
  const [endpoint, setEndpoint] = useState(() => configuredWebAppUrl() || localStorage.getItem('shop.endpoint') || '')
  const [data, setData] = useState<StorefrontData | null>(null)
  const [demo, setDemo] = useState(false)
  const [loading, setLoading] = useState(Boolean(endpoint))
  const [error, setError] = useState('')
  const [online, setOnline] = useState(navigator.onLine)
  const [locationState, setLocationState] = useState(routeFromHash)
  const [session, setSession] = useState<SessionInfo | null>(() => { try { return JSON.parse(sessionStorage.getItem('shop.session') || 'null') } catch { return null } })
  const [showAuth, setShowAuth] = useState(false)
  const [carts, setCarts] = useState<CartState>(emptyCart)
  const [activeCartType, setActiveCartType] = useState<ProductType>('READY')
  const [pendingOrder, setPendingOrder] = useState<OrderSummary | null>(null)
  const [toast, setToast] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const api = useMemo(() => endpoint ? new ApiClient(endpoint) : null, [endpoint])

  useEffect(() => {
    loadCart().then((lines) => {
      const next: CartState = { READY: [], PREORDER: [] }
      lines.forEach((line) => {
        const type = mockStorefront.products.find((p) => p.id === line.productId)?.type || 'READY'
        next[type].push(line)
      })
      setCarts(next)
    })
  }, [])
  useEffect(() => { const update = () => setLocationState(routeFromHash()); addEventListener('hashchange', update); return () => removeEventListener('hashchange', update) }, [])
  useEffect(() => { const up = () => setOnline(true); const down = () => setOnline(false); addEventListener('online', up); addEventListener('offline', down); return () => { removeEventListener('online', up); removeEventListener('offline', down) } }, [])
  useEffect(() => {
    const resolved = theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme
    document.documentElement.dataset.theme = resolved
    localStorage.setItem('shop.theme', theme)
  }, [theme])
  useEffect(() => {
    document.documentElement.lang = locale
    localStorage.setItem('shop.locale', locale)
  }, [locale])
  useEffect(() => {
    if (!api) return
    setLoading(true); setError('')
    api.storefront(locale).then((value) => {
      localStorage.setItem('shop.store-name.th', value.settings.storeNameTh)
      localStorage.setItem('shop.store-name.en', value.settings.storeNameEn)
      setData(value); void cacheStorefront(value)
    }).catch(async (cause) => {
      const cached = await loadCachedStorefront(); if (cached) setData(cached)
      setError(cause instanceof Error ? cause.message : 'เชื่อมต่อร้านค้าไม่สำเร็จ')
    }).finally(() => setLoading(false))
  }, [api, locale, loadAttempt])

  const connect = async (raw: string) => {
    const client = new ApiClient(raw); await client.health(); await client.connectionTest()
    localStorage.setItem('shop.endpoint', client.endpoint); setEndpoint(client.endpoint)
  }
  const startDemo = () => { setDemo(true); setData(mockStorefront); setError(''); location.hash = '#/home' }
  const navigate = (route: Route, id?: string) => { location.hash = `#/${route}${id ? `/${id}` : ''}` }
  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600) }
  const persistCarts = (next: CartState) => { setCarts(next); void saveCart([...next.READY, ...next.PREORDER]) }
  const addToCart = (product: Product, quantity = 1) => {
    const lines = [...carts[product.type]]; const found = lines.find((line) => line.productId === product.id)
    const limit = Math.min(product.purchaseLimit, product.stockOnHand - product.reservedQuantity)
    if (found) found.quantity = Math.min(limit, found.quantity + quantity); else lines.push({ productId: product.id, quantity: Math.min(quantity, limit) })
    persistCarts({ ...carts, [product.type]: lines }); setActiveCartType(product.type); flash(locale === 'th' ? 'เพิ่มลงตะกร้าแล้ว' : 'Added to cart')
  }
  const updateQuantity = (type: ProductType, productId: string, quantity: number) => {
    const product = data?.products.find((item) => item.id === productId); if (!product) return
    const max = Math.min(product.purchaseLimit, product.stockOnHand - product.reservedQuantity)
    const lines = carts[type].map((line) => line.productId === productId ? { ...line, quantity: Math.max(0, Math.min(max, quantity)) } : line).filter((line) => line.quantity > 0)
    persistCarts({ ...carts, [type]: lines })
  }
  const requireAuth = () => { if (demo || session) return true; setShowAuth(true); return false }
  const reserve = async (type: ProductType, termsAcceptance?: { termsId: string; version: number }) => {
    if (!online) throw new Error(locale === 'th' ? 'ต้องออนไลน์ก่อนยืนยันออเดอร์' : 'Go online to confirm your order')
    if (!requireAuth()) return
    if (demo) {
      const subtotal = carts[type].reduce((sum, line) => sum + (data?.products.find((p) => p.id === line.productId)?.price || 0) * line.quantity, 0)
      const order: OrderSummary = { id: crypto.randomUUID(), reference: `${type === 'READY' ? 'RD' : 'PO'}-DEMO-1042`, orderType: type, status: 'AWAITING_PAYMENT', subtotal, totalPaid: 0, balanceDue: subtotal, reservedUntil: new Date(Date.now() + 20 * 60000).toISOString(), createdAt: new Date().toISOString() }
      setPendingOrder(order); navigate('payment', order.id); return
    }
    if (!api || !session) return
    const result = await api.createReservation(session.token, carts[type], termsAcceptance)
    setPendingOrder(result.order); navigate('payment', result.order.id)
  }
  const onAuthenticated = (next: SessionInfo) => { sessionStorage.setItem('shop.session', JSON.stringify(next)); setSession(next); setShowAuth(false); flash(locale === 'th' ? 'เข้าสู่ระบบแล้ว' : 'Signed in') }
  const signOut = () => { sessionStorage.removeItem('shop.session'); setSession(null); navigate('home') }

  if (!endpoint && !demo) return <SetupPage locale={locale} setLocale={setLocale} onConnect={connect} onDemo={startDemo} />
  if (!data) {
    const rememberedName = localStorage.getItem(`shop.store-name.${locale}`) || (locale === 'th' ? 'ร้านของฉัน' : 'My Shop')
    return <StoreLoadingScreen locale={locale} storeName={rememberedName} error={loading ? '' : error} onRetry={() => setLoadAttempt((value) => value + 1)} />
  }

  const common = { data, locale, online, navigate, addToCart }
  let page: React.ReactNode
  if (locationState.route === 'product') page = <ProductPage {...common} productId={locationState.id} />
  else if (locationState.route === 'cart') page = <CartPage data={data} locale={locale} online={online} carts={carts} activeType={activeCartType} setActiveType={setActiveCartType} updateQuantity={updateQuantity} reserve={reserve} />
  else if (locationState.route === 'payment') page = <PaymentPage data={data} locale={locale} online={online} order={pendingOrder} api={api} session={session} demo={demo} navigate={navigate} />
  else if (locationState.route === 'orders' || locationState.route === 'order-detail') page = <OrdersPage locale={locale} session={session} api={api} demo={demo} pendingOrder={pendingOrder} />
  else if (locationState.route === 'profile') page = <ProfilePage locale={locale} session={session} theme={theme} setTheme={setTheme} signOut={signOut} requestAuth={() => setShowAuth(true)} />
  else if (locationState.route === 'admin') page = <AdminPage locale={locale} session={session} demo={demo} api={api} />
  else page = <StorefrontPage {...common} />

  return <>
    <AppShell data={data} locale={locale} setLocale={setLocale} route={locationState.route} navigate={navigate} cartCount={carts.READY.length + carts.PREORDER.length} online={online} session={session}>{page}</AppShell>
    {showAuth && api && <AuthDialog locale={locale} api={api} onClose={() => setShowAuth(false)} onAuthenticated={onAuthenticated} />}
    {showAuth && demo && <AuthDialog locale={locale} onClose={() => setShowAuth(false)} onAuthenticated={onAuthenticated} />}
    {toast && <div className="status-capsule" role="status">{toast}</div>}
  </>
}
