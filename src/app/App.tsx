import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import type { CartLine, Locale, OrderSummary, Product, ProductType, Route, SessionInfo, ShopSettings, StorefrontData, ThemePreference } from '../domain/types'
import { ApiClient } from '../api/client'
import { configuredWebAppUrl } from '../config/runtime'
import { cacheStorefront, loadCachedStorefront, loadCart, saveCart } from '../db/database'
import { mockStorefront } from '../mock/data'
import { shippingTotal } from '../domain/logic'
import { AppShell } from '../components/AppShell'
import { StoreLoadingScreen } from '../components/StoreLoadingScreen'
import { AuthDialog } from '../pages/AuthDialog'
import { AnnouncementPage, StorefrontPage, ProductPage } from '../pages/StorePages'
import { CartPage, PaymentPage } from '../pages/CheckoutPages'
import { OrdersPage, ProfilePage } from '../pages/AccountPages'
import { useNotifications } from '../pwa/useNotifications'
const AdminPage=lazy(()=>import('../pages/AdminPage').then(module=>({default:module.AdminPage})))

type CartState = Record<ProductType, CartLine[]>
const emptyCart: CartState = { READY: [], PREORDER: [] }
const readStoredSession=()=>{for(const storage of [localStorage,sessionStorage]){try{const value=JSON.parse(storage.getItem('shop.session')||'null') as SessionInfo|null;if(value&&new Date(value.expiresAt).getTime()>Date.now())return value}catch{/* ignore invalid local data */}}return null}
const saveStoredSession=(value:SessionInfo,remember?:boolean)=>{const persistent=remember??Boolean(localStorage.getItem('shop.session'));localStorage.removeItem('shop.session');sessionStorage.removeItem('shop.session');(persistent?localStorage:sessionStorage).setItem('shop.session',JSON.stringify(value))}
const routeFromHash = (): { route: Route; id?: string } => {
  const [route = 'home', id] = location.hash.replace(/^#\/?/, '').split('/')
  const allowed: Route[] = ['home', 'favorites', 'cart', 'orders', 'profile', 'product', 'announcement', 'payment', 'preorder', 'order-detail', 'admin']
  return { route: allowed.includes(route as Route) ? route as Route : 'home', id }
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => (localStorage.getItem('shop.locale') as Locale) || 'th')
  const [theme, setTheme] = useState<ThemePreference>(() => (localStorage.getItem('shop.theme') as ThemePreference) || 'system')
  const [endpoint] = useState(() => configuredWebAppUrl())
  const [data, setData] = useState<StorefrontData | null>(null)
  const [demo] = useState(false)
  const [loading, setLoading] = useState(Boolean(endpoint))
  const [error, setError] = useState('')
  const [online, setOnline] = useState(navigator.onLine)
  const [locationState, setLocationState] = useState(routeFromHash)
  const [session, setSession] = useState<SessionInfo | null>(readStoredSession)
  const [showAuth, setShowAuth] = useState(false)
  const [carts, setCarts] = useState<CartState>(emptyCart)
  const [activeCartType, setActiveCartType] = useState<ProductType>('READY')
  const [pendingOrder, setPendingOrder] = useState<OrderSummary | null>(null)
  const [toast, setToast] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const api = useMemo(() => endpoint ? new ApiClient(endpoint) : null, [endpoint])
  const notifications=useNotifications({api,session,locale})

  useEffect(() => {
    loadCart().then((lines) => {
      const next: CartState = { READY: [], PREORDER: [] }
      ;(lines || []).forEach((line) => {
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
      localStorage.setItem('shop.loader-settings', JSON.stringify(value.settings))
      setData(value); void cacheStorefront(value)
      void loadCart().then((savedLines) => {
        const regrouped: CartState = { READY: [], PREORDER: [] }
        ;(savedLines || []).forEach((line) => {
          const type = value.products.find((product) => product.id === line.productId)?.type
          if (type) regrouped[type].push(line)
        })
        setCarts(regrouped)
      })
    }).catch(async (cause) => {
      const cached = await loadCachedStorefront(); if (cached) setData(cached)
      setError(cause instanceof Error ? cause.message : 'เชื่อมต่อร้านค้าไม่สำเร็จ')
    }).finally(() => setLoading(false))
  }, [api, locale, loadAttempt])
  useEffect(() => {
    if (!api || !session?.token || demo) return
    api.me(session.token).then((user) => {
      const refreshed = { ...session, user }; saveStoredSession(refreshed); setSession((current) => current && current.user.role === user.role && current.user.email === user.email ? current : refreshed)
    }).catch(() => { localStorage.removeItem('shop.session');sessionStorage.removeItem('shop.session'); setSession(null); setFavoriteIds([]) })
  }, [api, session?.token, demo])
  useEffect(() => {
    if (!api || !session?.token || demo) return
    api.listFavorites(session.token).then(setFavoriteIds).catch(() => undefined)
  }, [api, session?.token, demo])

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
  const reserve = async (type: ProductType, termsAcceptance?: { termsId: string; version: number }, redeemPoints = 0, shipping: Record<string,string> = {},shippingAcceptance?:{version:number}) => {
    if (!online) throw new Error(locale === 'th' ? 'ต้องออนไลน์ก่อนยืนยันออเดอร์' : 'Go online to confirm your order')
    if (!requireAuth()) return
    if (demo) {
      const subtotal = carts[type].reduce((sum, line) => sum + (data?.products.find((p) => p.id === line.productId)?.price || 0) * line.quantity, 0)
      const shipping = data ? shippingTotal(carts[type], data.products, data.settings) : 0
      const amountDue = type === 'PREORDER' ? carts[type].reduce((sum, line) => sum + (data?.products.find((p) => p.id === line.productId)?.deposit || 0) * line.quantity, 0) : subtotal
      const order: OrderSummary = { id: crypto.randomUUID(), reference: `${type === 'READY' ? 'RD' : 'PO'}-DEMO-1042`, orderType: type, status: 'AWAITING_PAYMENT', subtotal, totalPaid: 0, balanceDue: amountDue + shipping, reservedUntil: new Date(Date.now() + 20 * 60000).toISOString(), createdAt: new Date().toISOString() }
      setPendingOrder(order); navigate('payment', order.id); return
    }
    if (!api || !session) return
    const result = await api.createReservation(session.token, carts[type], termsAcceptance, redeemPoints, shipping,shippingAcceptance)
    setPendingOrder(result.order); persistCarts({ ...carts, [type]: [] });
    try { const user=await api.me(session.token);const refreshed={...session,user};saveStoredSession(refreshed);setSession(refreshed) } catch { /* order is already reserved; profile can refresh later */ }
    navigate('payment', result.order.id)
  }
  const onAuthenticated = (next: SessionInfo,rememberDevice:boolean) => { saveStoredSession(next,rememberDevice); setSession(next); setShowAuth(false); flash(locale === 'th' ? 'เข้าสู่ระบบแล้ว' : 'Signed in') }
  const signOut = () => { localStorage.removeItem('shop.session');sessionStorage.removeItem('shop.session'); setSession(null); setFavoriteIds([]); navigate('home') }
  const handleNotifications=async()=>{if(!session){setShowAuth(true);return}if(!notifications.enabled){const granted=await notifications.enable();flash(granted?(locale==='th'?'เปิดการแจ้งเตือนแล้ว':'Notifications enabled'):(locale==='th'?'เบราว์เซอร์ไม่อนุญาตการแจ้งเตือน':'Notification permission was not granted'));return}notifications.clearCount();navigate(['ADMIN','OWNER'].includes(session.user.role)?'admin':'profile')}
  const toggleFavorite = async (productId: string) => {
    if (!data?.settings.favoritesEnabled) return
    if (demo) { setFavoriteIds((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]); return }
    if (!session || !api) { setShowAuth(true); return }
    const before = favoriteIds; const optimistic = before.includes(productId) ? before.filter((id) => id !== productId) : [...before, productId]; setFavoriteIds(optimistic)
    try { const result = await api.toggleFavorite(session.token, productId); setFavoriteIds((current) => result.active ? [...new Set([...current, productId])] : current.filter((id) => id !== productId)) }
    catch (cause) { setFavoriteIds(before); flash(cause instanceof Error ? cause.message : (locale === 'th' ? 'บันทึกรายการโปรดไม่สำเร็จ' : 'Could not save favorite')) }
  }

  if (!endpoint) return <StoreLoadingScreen locale={locale} storeName={locale === 'th' ? 'ร้านของฉัน' : 'My Shop'} error={locale === 'th' ? 'ยังไม่ได้กำหนด Web App URL ในไฟล์ config' : 'The Web App URL is missing from config'} onRetry={() => location.reload()} />
  if (!data) {
    const rememberedName = localStorage.getItem(`shop.store-name.${locale}`) || (locale === 'th' ? 'ร้านของฉัน' : 'My Shop')
    let rememberedSettings: Partial<ShopSettings> = {}; try { rememberedSettings = JSON.parse(localStorage.getItem('shop.loader-settings') || '{}') } catch { /* use defaults */ }
    return <StoreLoadingScreen locale={locale} storeName={rememberedName} title={locale === 'th' ? rememberedSettings.loaderTitleTh : rememberedSettings.loaderTitleEn} kicker={locale === 'th' ? rememberedSettings.loaderKickerTh : rememberedSettings.loaderKickerEn} message={locale === 'th' ? rememberedSettings.loaderMessageTh : rememberedSettings.loaderMessageEn} logoUrl={rememberedSettings.loaderLogoUrl || rememberedSettings.logoUrl} error={loading ? '' : error} onRetry={() => setLoadAttempt((value) => value + 1)} />
  }

  const common = { data, locale, online, navigate, addToCart, favoriteIds, toggleFavorite, api, session }
  let page: React.ReactNode
  if (locationState.route === 'product') page = <ProductPage {...common} productId={locationState.id} />
  else if (locationState.route === 'announcement') page = <AnnouncementPage {...common} productId={locationState.id}/>
  else if (locationState.route === 'cart') page = <CartPage data={data} locale={locale} online={online} session={session} carts={carts} activeType={activeCartType} setActiveType={setActiveCartType} updateQuantity={updateQuantity} reserve={reserve} />
  else if (locationState.route === 'payment') page = <PaymentPage data={data} locale={locale} online={online} order={pendingOrder} api={api} session={session} demo={demo} navigate={navigate} />
  else if (locationState.route === 'orders' || locationState.route === 'order-detail') page = <OrdersPage locale={locale} session={session} api={api} demo={demo} pendingOrder={pendingOrder} onPay={(order)=>{setPendingOrder(order);navigate('payment',order.id)}} />
  else if (locationState.route === 'profile') page = <ProfilePage locale={locale} session={session} api={api} theme={theme} setTheme={setTheme} signOut={signOut} requestAuth={() => setShowAuth(true)} />
  else if (locationState.route === 'admin') page = <Suspense fallback={<div className="page"><div className="admin-skeleton" aria-label={locale==='th'?'กำลังเตรียมหลังบ้าน':'Preparing admin workspace'}/></div>}><AdminPage locale={locale} session={session} demo={demo} api={api} data={data} onDataChange={setData} /></Suspense>
  else page = <StorefrontPage {...common} favoritesOnly={locationState.route === 'favorites'} />

  return <>
    <AppShell data={data} locale={locale} setLocale={setLocale} route={locationState.route} navigate={navigate} cartCount={[...carts.READY, ...carts.PREORDER].reduce((sum, line) => sum + line.quantity, 0)} online={online} session={session} notificationCount={notifications.count} notificationsEnabled={notifications.enabled} onNotifications={handleNotifications}>{page}</AppShell>
    {showAuth && api && <AuthDialog locale={locale} api={api} onClose={() => setShowAuth(false)} onAuthenticated={onAuthenticated} />}
    {showAuth && demo && <AuthDialog locale={locale} onClose={() => setShowAuth(false)} onAuthenticated={onAuthenticated} />}
    {toast && <div className="status-capsule" role="status">{toast}</div>}
  </>
}
