import type { Locale } from '../domain/types'

const th = {
  home: 'หน้าแรก', search: 'ค้นหา', cart: 'ตะกร้า', favorites: 'ถูกใจ', account: 'บัญชี', orders: 'คำสั่งซื้อ', admin: 'หลังบ้าน',
  ready: 'พร้อมส่ง', preorder: 'Pre-order', add: 'เพิ่ม', remaining: 'เหลือ', deposit: 'มัดจำ', fullAmount: 'ยอดเต็ม', balance: 'ยอดคงเหลือ',
  login: 'เข้าสู่ระบบด้วยอีเมล', sendOtp: 'ส่งรหัสยืนยัน', verify: 'ยืนยันรหัส', offline: 'ขณะนี้ออฟไลน์', retry: 'ลองใหม่',
  payWithin: 'ส่งหลักฐานภายใน', submitProof: 'ส่งหลักฐานและยืนยัน', acceptTerms: 'ฉันอ่านและยอมรับเงื่อนไขฉบับนี้แล้ว',
}
const en: typeof th = {
  home: 'Home', search: 'Search', cart: 'Cart', favorites: 'Favorites', account: 'Account', orders: 'Orders', admin: 'Admin',
  ready: 'Ready stock', preorder: 'Pre-order', add: 'Add', remaining: 'Remaining', deposit: 'Deposit', fullAmount: 'Full amount', balance: 'Balance',
  login: 'Sign in with email', sendOtp: 'Send verification code', verify: 'Verify code', offline: 'You are offline', retry: 'Try again',
  payWithin: 'Submit proof within', submitProof: 'Submit proof and confirm', acceptTerms: 'I have read and accept these terms',
}
export type DictionaryKey = keyof typeof th
export const dictionary = (locale: Locale) => locale === 'th' ? th : en
