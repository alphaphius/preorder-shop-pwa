# Design Contract — Lavender Pop

## Design read

ร้านค้าออนไลน์สำหรับลูกค้ามือถือที่ต้องน่ารัก ไว้ใจได้ และทำรายการเร่งเวลาได้โดยไม่สับสน หน้าลูกค้าโปร่งและเป็นมิตร ส่วน Admin กระชับและสแกนสถานะได้เร็ว

## Impeccable lenses

- Storefront/product: layout, typeset, adapt, harden, polish
- Checkout/payment: distill, clarify, harden, optimize
- Pre-order terms: clarify, typeset, harden
- Tracking/messages: clarify, delight, harden
- Admin: quieter, layout, typeset, adapt, harden
- Release: audit, critique, optimize, polish

## Tokens

- Primary: violet 700; on-primary: white
- Background: cool lavender 25; surfaces: white/lavender 50
- Text: deep plum; muted: cool mauve gray
- Success, warning, error ใช้ semantic tokensและข้อความ/ไอคอนร่วมกับสี
- Radius: cards 22px, controls 14–16px, chips pill
- Spacing: 4/8px rhythm; touch target อย่างน้อย 44px
- Font: Noto Sans Thai Variable ครอบคลุมไทย/อังกฤษ; body mobile 16px, line-height 1.6

## Themes

- System, Light, Dark, High Contrast
- Admin กำหนด primary color ส่วนกลางได้ แต่ระบบคำนวณ on-primary และปฏิเสธคู่สีที่ contrast ไม่ถึงเกณฑ์
- Theme ถูกใช้ก่อน first paint และ preference รายอุปกรณ์ทำงานออฟไลน์

## Motion

- GSAP ใช้กับ add-to-cart, list entrance, countdown urgency และ success confirmation
- ใช้ transform/opacity ระยะ 150–400ms; ไม่บล็อก input และยกเลิกได้
- `prefers-reduced-motion` ปิด choreography เหลือ feedback แบบทันที

## Responsive contract

- 320–767px: bottom navigation, sticky checkout, single/2-column product grid
- 768–1023px: adaptive grid และ navigation rail ตามพื้นที่
- 1024px+: Admin sidebar + data workspace; customer content max-width
- ไม่มี horizontal page overflow, sticky UI ไม่บัง content/safe area และ input mobile อย่างน้อย 16px

## Required states

Loading, empty, disabled, validation, success, recoverable error, offline, slow network, retrying, stock conflict, partial sync, expired session, API/schema incompatibility, install/update available และ email job failed
