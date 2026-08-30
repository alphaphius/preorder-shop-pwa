import { useState } from 'react'
import type { Locale } from '../domain/types'

export function SetupPage({ locale, setLocale, onConnect, onDemo, loading = false, error = '' }: { locale: Locale; setLocale: (v: Locale) => void; onConnect: (url: string) => Promise<void>; onDemo: () => void; loading?: boolean; error?: string }) {
  const [url, setUrl] = useState(''); const [busy, setBusy] = useState(false); const [localError, setLocalError] = useState('')
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setLocalError(''); try { await onConnect(url) } catch (cause) { setLocalError(cause instanceof Error ? cause.message : 'เชื่อมต่อไม่สำเร็จ') } finally { setBusy(false) } }
  return <main className="setup-page">
    <section className="setup-panel">
      <div className="setup-brand"><span className="brand-mark">M</span><strong>Preorder Shop</strong></div>
      <button className="locale-switch" type="button" onClick={() => setLocale(locale === 'th' ? 'en' : 'th')}>{locale.toUpperCase()}</button>
      <h1>{locale === 'th' ? 'เชื่อมต่อร้านค้าของคุณ' : 'Connect your shop'}</h1>
      <p>{locale === 'th' ? 'วาง Apps Script Web App URL ที่ลงท้ายด้วย /exec ระบบจะตรวจ API, schema และการเขียนอ่านก่อนบันทึก' : 'Paste the Apps Script Web App URL ending in /exec. We will verify the API, schema, and a write/read round trip.'}</p>
      <form onSubmit={submit}>
        <label htmlFor="endpoint">Apps Script Web App URL</label>
        <input id="endpoint" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://script.google.com/macros/s/.../exec" required autoComplete="url" />
        {(localError || error) && <p className="form-error" role="alert">{localError || error}</p>}
        <button className="primary-button" type="submit" disabled={busy || loading}>{busy || loading ? (locale === 'th' ? 'กำลังตรวจสอบการเชื่อมต่อ…' : 'Testing connection…') : (locale === 'th' ? 'ทดสอบและเชื่อมต่อ' : 'Test and connect')}</button>
      </form>
      <button className="secondary-button" type="button" onClick={onDemo}>{locale === 'th' ? 'ดูตัวอย่างแบบไม่เชื่อมต่อ' : 'Preview without connecting'}</button>
      <small>{locale === 'th' ? 'URL ไม่ใช่รหัสลับ แต่ session และข้อมูลร้านจะไม่ถูกใส่ใน repository' : 'The URL is not a secret, but sessions and store data are never committed.'}</small>
    </section>
  </main>
}
