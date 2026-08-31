import { useState } from 'react'
import type { Locale, SessionInfo } from '../domain/types'
import type { ApiClient } from '../api/client'

export function AuthDialog({ locale, api, onClose, onAuthenticated }: { locale: Locale; api?: ApiClient; onClose: () => void; onAuthenticated: (session: SessionInfo,rememberDevice:boolean) => void }) {
  const [step, setStep] = useState<'email' | 'code'>('email'); const [email, setEmail] = useState(''); const [code, setCode] = useState(''); const [rememberDevice,setRememberDevice]=useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setError(''); try {
    if (step === 'email') { if (api) await api.requestOtp(email); setStep('code') }
    else { const session = api ? await api.verifyOtp(email, code,rememberDevice) : { token: 'demo', expiresAt: new Date(Date.now() + 3600000).toISOString(), user: { id: 'demo-user', email, displayName: email.split('@')[0], role: 'OWNER' as const, locale, pointsBalance: 128 } }; onAuthenticated(session,rememberDevice) }
  } catch (cause) { setError(cause instanceof Error ? cause.message : 'ยืนยันอีเมลไม่สำเร็จ') } finally { setBusy(false) } }
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button type="button" className="dialog-close" onClick={onClose} aria-label={locale === 'th' ? 'ปิด' : 'Close'}>×</button>
      <h2 id="auth-title">{locale === 'th' ? 'เข้าสู่ระบบด้วยอีเมล' : 'Sign in with email'}</h2>
      <p>{step === 'email' ? (locale === 'th' ? 'เราจะส่งรหัส 6 หลักที่ใช้ได้ 10 นาที' : 'We will send a 6-digit code valid for 10 minutes.') : (locale === 'th' ? `กรอกรหัสที่ส่งไปยัง ${email}` : `Enter the code sent to ${email}`)}</p>
      <form onSubmit={submit}>
        {step === 'email' ? <><label htmlFor="auth-email">Email</label><input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></> : <><label htmlFor="auth-code">{locale === 'th' ? 'รหัสยืนยัน' : 'Verification code'}</label><input id="auth-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} required autoComplete="one-time-code" /></>}
        {step==='code'&&<label className="remember-device"><input type="checkbox" checked={rememberDevice} onChange={event=>setRememberDevice(event.target.checked)}/><span>{locale==='th'?'จดจำการเข้าสู่ระบบบนอุปกรณ์นี้':'Remember me on this device'}</span></label>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? (locale === 'th' ? 'กำลังยืนยัน…' : 'Verifying…') : step === 'email' ? (locale === 'th' ? 'ส่งรหัสยืนยัน' : 'Send code') : (locale === 'th' ? 'ยืนยันและเข้าสู่ระบบ' : 'Verify and sign in')}</button>
      </form>
    </section>
  </div>
}
