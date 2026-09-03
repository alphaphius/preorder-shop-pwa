import { useLayoutEffect, useRef } from 'react'
import { Bell, Heart, House, MagnifyingGlass, ShoppingBag, SpinnerGap, UserCircle } from '@phosphor-icons/react'
import gsap from 'gsap'
import type { Locale, Route, SessionInfo, StorefrontData } from '../domain/types'
import { MediaImage } from './MediaImage'

interface Props { data: StorefrontData; locale: Locale; setLocale: (v: Locale) => void; route: Route; navigate: (route: Route) => void; cartCount: number; online: boolean; session: SessionInfo | null;notificationCount:number;notificationsEnabled:boolean;onNotifications:()=>void; dataLoading:boolean; children: React.ReactNode }
export function AppShell({ data, locale, setLocale, route, navigate, cartCount, online, session,notificationCount,notificationsEnabled,onNotifications,dataLoading, children }: Props) {
  const main = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !main.current) return
    const context = gsap.context(() => gsap.from('[data-animate-item]', { opacity: 0, y: 12, duration: .32, stagger: .045, ease: 'power2.out', clearProps: 'all' }), main)
    return () => context.revert()
  }, [route])
  const name = locale === 'th' ? data.settings.storeNameTh : data.settings.storeNameEn
  return <div className="app-shell" style={{ '--brand-primary': data.settings.primaryColor } as React.CSSProperties}>
    <a className="skip-link" href="#main-content">ข้ามไปยังเนื้อหา</a>
    {!online && <div className="offline-banner" role="status">{locale === 'th' ? 'ออฟไลน์ — ดูข้อมูลที่บันทึกไว้ได้ แต่ยืนยันออเดอร์ไม่ได้' : 'Offline — cached content is available, checkout is disabled'}</div>}
    <header className="topbar">
      <button className="brand-button" type="button" onClick={() => navigate('home')} aria-label={name}>
        {data.settings.logoUrl ? <MediaImage src={data.settings.logoUrl} alt="" loading="eager" className="brand-logo"/> : <span className="brand-mark">M</span>}
        <span><strong>{name}</strong><small>{locale === 'th' ? 'เลือกของที่ชอบได้เลย' : 'Find something lovely'}</small></span>
      </button>
      <div className="top-actions">
        {session && ['ADMIN', 'OWNER'].includes(session.user.role) && <button className="admin-chip" type="button" onClick={() => navigate('admin')}>{session.user.role}</button>}
        <button className="icon-button" type="button" onClick={() => setLocale(locale === 'th' ? 'en' : 'th')} aria-label="Change language">{locale.toUpperCase()}</button>
        <button className={`icon-button notification-button ${notificationsEnabled?'is-enabled':''}`} type="button" onClick={onNotifications} aria-label={locale === 'th' ? notificationsEnabled?'การแจ้งเตือนเปิดอยู่':'เปิดการแจ้งเตือน' : notificationsEnabled?'Notifications enabled':'Enable notifications'}><Bell size={20} weight={notificationsEnabled?'fill':'regular'}/>{notificationCount>0&&<b>{Math.min(notificationCount,99)}</b>}</button>
      </div>
    </header>
    <nav className="bottom-nav" aria-label={locale === 'th' ? 'เมนูหลัก' : 'Main navigation'}>
      <Nav active={route === 'home' || route === 'product'} onClick={() => navigate('home')} icon={<House />} label={locale === 'th' ? 'หน้าแรก' : 'Home'} />
      <Nav active={false} onClick={() => navigate('home')} icon={<MagnifyingGlass />} label={locale === 'th' ? 'ค้นหา' : 'Search'} />
      <Nav prominent active={route === 'cart' || route === 'payment'} onClick={() => navigate('cart')} icon={<ShoppingBag weight="fill" />} label={locale === 'th' ? 'ตะกร้า' : 'Cart'} badge={cartCount} />
      <Nav active={route === 'favorites'} onClick={() => navigate('favorites')} icon={<Heart />} label={locale === 'th' ? 'ถูกใจ' : 'Favorites'} />
      <Nav active={route === 'profile' || route === 'orders' || route === 'admin'} onClick={() => navigate('profile')} icon={<UserCircle />} label={locale === 'th' ? 'บัญชี' : 'Account'} />
    </nav>
    {dataLoading && <div className="app-data-loading" role="status" aria-live="polite"><SpinnerGap className="spin" aria-hidden="true"/><span>{locale === 'th' ? 'กำลังโหลดข้อมูล…' : 'Loading data…'}</span></div>}
    <main id="main-content" ref={main}>{children}</main>
  </div>
}

function Nav({ active, onClick, icon, label, badge = 0, prominent = false }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number; prominent?: boolean }) {
  return <button className={`nav-button ${active ? 'is-active' : ''} ${prominent ? 'is-cart' : ''}`} type="button" onClick={onClick} aria-current={active ? 'page' : undefined}><span className="nav-icon">{icon}{badge > 0 && <b>{badge}</b>}</span><span>{label}</span></button>
}
