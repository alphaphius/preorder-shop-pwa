var OTP_TTL_MINUTES = 10;
var SESSION_TTL_HOURS = 12;

function normalizeEmail_(email) {
  var value = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw apiError_('INVALID_EMAIL', 'กรุณากรอกอีเมลที่ถูกต้อง');
  return value;
}
function digest_(value) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8).map(function(byte) { var v = byte < 0 ? byte + 256 : byte; return ('0' + v.toString(16)).slice(-2); }).join(''); }
function secureToken_() { return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); }
function maskEmail_(email) { var parts = email.split('@'); return parts[0].slice(0, 2) + '***@' + parts[1]; }
function securityLog_(email, event, details) { insert_('SecurityLog', { email: email || '', event: event, ipHint: '', details: details || '' }); }

function requestOtp_(rawEmail) {
  var email = normalizeEmail_(rawEmail); var cache = CacheService.getScriptCache(); var rateKey = 'otp-request:' + digest_(email); var count = Number(cache.get(rateKey) || 0);
  if (count >= 4) { securityLog_(email, 'OTP_RATE_LIMIT', 'Too many requests'); throw apiError_('RATE_LIMITED', 'ขอรหัสบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'); }
  cache.put(rateKey, String(count + 1), 600);
  var code = String(Math.floor(100000 + Math.random() * 900000)); var salt = secureToken_().slice(0, 32); var expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60000).toISOString();
  insert_('OtpCodes', { email: email, purpose: 'LOGIN', codeHash: digest_(salt + ':' + code), salt: salt, expiresAt: expiresAt, attempts: 0, consumedAt: '' });
  try {
    MailApp.sendEmail({ to: email, subject: 'รหัสเข้าสู่ระบบ Preorder Shop', htmlBody: '<div style="font-family:Arial,sans-serif"><h2>รหัสยืนยันของคุณ</h2><p style="font-size:30px;font-weight:700;letter-spacing:6px">' + code + '</p><p>รหัสนี้ใช้ได้ ' + OTP_TTL_MINUTES + ' นาที หากคุณไม่ได้ขอรหัสนี้ ไม่ต้องดำเนินการใดๆ</p></div>', name: setting_('storeNameEn', 'Preorder Shop') });
  } catch (error) { securityLog_(email, 'OTP_EMAIL_FAILED', String(error)); throw apiError_('EMAIL_SEND_FAILED', 'ส่งอีเมลยืนยันไม่สำเร็จ กรุณาลองใหม่'); }
  securityLog_(email, 'OTP_SENT', 'Login code queued'); return { expiresAt: expiresAt, maskedEmail: maskEmail_(email) };
}

function verifyOtp_(rawEmail, rawCode, rememberDevice) {
  var email = normalizeEmail_(rawEmail); var code = String(rawCode || '').trim(); if (!/^\d{6}$/.test(code)) throw apiError_('INVALID_OTP', 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุ');
  var rows = findAll_('OtpCodes', 'email', email).filter(function(record) { return record.purpose === 'LOGIN' && !record.consumedAt; }).sort(function(a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); }); var otp = rows[0];
  if (!otp || new Date(otp.expiresAt).getTime() < Date.now() || Number(otp.attempts || 0) >= 5) { securityLog_(email, 'OTP_INVALID', 'Expired or missing'); throw apiError_('INVALID_OTP', 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุ'); }
  if (digest_(otp.salt + ':' + code) !== otp.codeHash) { update_('OtpCodes', otp.id, { attempts: Number(otp.attempts || 0) + 1 }); securityLog_(email, 'OTP_INVALID', 'Mismatch'); throw apiError_('INVALID_OTP', 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุ'); }
  update_('OtpCodes', otp.id, { consumedAt: new Date().toISOString() });
  var user = findOne_('Users', 'email', email); var ownerEmail = String(PropertiesService.getScriptProperties().getProperty('INITIAL_OWNER_EMAIL') || '').toLowerCase();
  if (!user) user = insert_('Users', { email: email, displayName: email.split('@')[0], role: email === ownerEmail ? 'OWNER' : 'CUSTOMER', status: 'ACTIVE', locale: 'th', pointsBalance: 0 });
  if (user.status !== 'ACTIVE') throw apiError_('ACCOUNT_DISABLED', 'บัญชีนี้ถูกระงับ กรุณาติดต่อร้านค้า');
  var session = issueSession_(user, rememberDevice === true); securityLog_(email, 'LOGIN_SUCCESS', user.role); return session;
}

function issueSession_(user, rememberDevice) {
  var hours = rememberDevice ? 24 * 30 : SESSION_TTL_HOURS; var token = secureToken_(); var expiresAt = new Date(Date.now() + hours * 3600000).toISOString();
  insert_('Sessions', { userId: user.id, tokenHash: digest_(token), role: user.role, expiresAt: expiresAt, privilegedUntil: ['OWNER','ADMIN'].indexOf(user.role) >= 0 ? new Date(Date.now() + 15 * 60000).toISOString() : '', revokedAt: '' });
  return { token: token, expiresAt: expiresAt, user: publicUser_(user) };
}
function requireSession_(token) {
  if (!token) throw apiError_('UNAUTHENTICATED', 'กรุณาเข้าสู่ระบบ');
  var session = findOne_('Sessions', 'tokenHash', digest_(token));
  if (!session || session.revokedAt || new Date(session.expiresAt).getTime() <= Date.now()) throw apiError_('SESSION_EXPIRED', 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
  var user = findById_('Users', session.userId); if (!user || user.status !== 'ACTIVE') throw apiError_('ACCOUNT_DISABLED', 'บัญชีนี้ไม่พร้อมใช้งาน');
  return { session: session, user: user };
}
function requireRole_(context, roles) { if (roles.indexOf(context.user.role) < 0) throw apiError_('FORBIDDEN', 'คุณไม่มีสิทธิ์ทำรายการนี้'); return context; }
function requirePrivileged_(context) { if (!context.session.privilegedUntil || new Date(context.session.privilegedUntil).getTime() <= Date.now()) throw apiError_('REAUTH_REQUIRED', 'กรุณายืนยันตัวตนอีกครั้งก่อนเปลี่ยนการตั้งค่าสำคัญ'); return context; }
function publicUser_(user) { return { id: user.id, email: user.email, displayName: user.displayName, role: user.role, locale: user.locale || 'th', pointsBalance: Number(user.pointsBalance || 0), xAccount:user.xAccount||'' }; }
