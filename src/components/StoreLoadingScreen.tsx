import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import gsap from 'gsap'
import type { Locale } from '../domain/types'
import { MediaImage } from './MediaImage'

export function StoreLoadingScreen({ locale, storeName, title, kicker, message, logoUrl, error, onRetry }: { locale: Locale; storeName: string; title?: string; kicker?: string; message?: string; logoUrl?: string; error?: string; onRetry: () => void }) {
  const root = useRef<HTMLElement>(null)
  const initial = storeName.trim().charAt(0).toUpperCase() || 'M'

  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const context = gsap.context(() => {
      gsap.to('.loader-orbit-outer', { rotate: 360, duration: 8, repeat: -1, ease: 'none' })
      gsap.to('.loader-orbit-inner', { rotate: -360, duration: 4.8, repeat: -1, ease: 'none' })
      gsap.to('.loader-core', { scale: 1.08, boxShadow: '0 18px 48px rgba(109,40,217,.36)', duration: 1.15, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      gsap.fromTo('.loading-dot', { y: 0, opacity: .3 }, { y: -7, opacity: 1, duration: .65, repeat: -1, yoyo: true, stagger: .16, ease: 'sine.inOut' })
      gsap.from('.loading-copy > *', { y: 12, opacity: 0, duration: .65, stagger: .1, ease: 'power2.out' })
    }, root)
    return () => context.revert()
  }, [])

  return <main className="loading-page" ref={root} aria-live="polite" aria-busy={!error}>
    <div className="loading-glow loading-glow-one" />
    <div className="loading-glow loading-glow-two" />
    <section className="loading-stage">
      <div className="loader-art" role="img" aria-label={locale === 'th' ? `กำลังเปิด ${storeName}` : `Opening ${storeName}`}>
        <div className="loader-orbit loader-orbit-outer">
          {[0, 60, 120, 180, 240, 300].map((angle) => <span key={angle} className="loader-petal" style={{ '--petal-angle': `${angle}deg` } as CSSProperties} />)}
        </div>
        <div className="loader-orbit loader-orbit-inner"><i /><i /><i /></div>
        <div className={`loader-core ${logoUrl?'has-logo':''}`}>{logoUrl ? <MediaImage src={logoUrl} alt="" loading="eager"/> : <span>{initial}</span>}</div>
      </div>
      <div className="loading-copy">
        {!error&&<span className="loading-source-status">{locale==='th'?'กำลังเชื่อมต่อ Apps Script · อ่านข้อมูลจาก Google Sheet':'Connecting to Apps Script · Reading Google Sheets data'}</span>}
        <span className="loading-kicker">{kicker || (locale === 'th' ? 'ยินดีต้อนรับสู่' : 'Welcome to')}</span>
        <h1>{title || storeName}</h1>
        {!error ? <><p>{message || (locale === 'th' ? 'กำลังจัดชั้นสินค้าให้คุณ' : 'Curating the shelves for you')}</p><div className="loading-dots" aria-hidden="true"><i className="loading-dot" /><i className="loading-dot" /><i className="loading-dot" /></div></> : <div className="loading-error"><p>{error}</p><button type="button" className="primary-button" onClick={onRetry}>{locale === 'th' ? 'ลองเชื่อมต่ออีกครั้ง' : 'Try again'}</button></div>}
      </div>
    </section>
  </main>
}
