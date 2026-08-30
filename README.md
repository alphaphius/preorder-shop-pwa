# Preorder Shop PWA

เว็บร้านค้า mobile-first สำหรับสินค้าพร้อมส่งและ Pre-order แยกคำสั่งซื้อ ใช้ GitHub Pages, Google Apps Script, Google Sheets และ Google Drive

## คุณสมบัติ

- Email OTP, session แบบหมดอายุ และบทบาท Customer/Admin/Owner
- พักสต็อกหรือโควตา 20 นาทีแบบ server-locked ป้องกัน oversell
- อัปโหลดสลิป ตรวจสอบการชำระเงิน และประวัติสถานะ
- รอบ Pre-order, มัดจำ, ยอดคงเหลือ และเงื่อนไขแบบมีเวอร์ชัน
- สินค้า หมวดหมู่ รูปหลายรูป ประกาศ รายการโปรด รีวิว แต้ม และ Feature Flags
- ไทย/อังกฤษ, System/Light/Dark/High Contrast และสีแบรนด์จาก Admin
- PWA ติดตั้งได้ แคช shell/draft และไม่อนุญาต checkout ขณะออฟไลน์
- งานอีเมลแบบ durable queue พร้อม retry และหน้า Admin

## อุปกรณ์และเบราว์เซอร์

รองรับ iPhone/iPad Safari, Android Chrome, macOS Safari/Chrome/Firefox และ Windows Edge/Chrome/Firefox รุ่นปัจจุบัน ตรวจช่วงหน้าจอ 320px ถึง desktop

## สิ่งที่ต้องมี

- Node.js 22+
- Git และบัญชี GitHub
- Google Sheet ที่สร้าง Apps Script แบบ container-bound แล้ว
- `clasp` และ `gh` CLI สำหรับ deploy ผ่านคำสั่งช่วยเหลือ

## เริ่มต้นบน macOS หรือ Windows Terminal/PowerShell

```text
git clone <your-repository-url>
cd preorder-shop-pwa
npm install
npm run setup:apps-script
npm run verify
```

คำสั่ง Node รองรับ path ที่มีช่องว่างและชื่อภาษาไทย ไม่ต้องใช้ Bash, `sed` หรือ `awk`

## Google Sheet และ Apps Script

1. เปิด Google Sheet ที่เป็นเจ้าของ Apps Script
2. ตั้งค่า `.clasp.json` ผ่าน `npm run setup:apps-script` ไฟล์นี้ถูก gitignore
3. รัน `npm run deploy:api` เพื่อ push source
4. Reload Google Sheet แล้วเลือก `Preorder Shop > สร้าง/อัปเดตฐานข้อมูล`
5. อนุญาต Sheets, Drive, Mail และ Trigger
6. `setupSystem()` จะใช้ Sheet เดิม ไม่สร้าง Spreadsheet ใหม่ และบันทึก Sheet ID จริงลง Script Properties กับ `Settings:spreadsheetId`
7. เลือก `Preorder Shop > ตั้งค่า Owner จากบัญชีปัจจุบัน`
8. Deploy เป็น Web App: Execute as “Me”, access “Anyone” แล้วคัดลอก URL `/exec`

Sheet ID, Script ID, Drive ID, session และ OAuth credentials ต้องไม่ commit ส่วน Web App URL `/exec` ของระบบนี้กำหนดไว้ใน `public/runtime-config.js` เพื่อให้ GitHub Pages เชื่อมต่ออัตโนมัติ ทั้งนี้ URL ไม่ใช่สิทธิ์เข้าถึงและ API ยังตรวจ session ทุกคำสั่งที่ได้รับการป้องกัน

## เชื่อมต่อหน้าเว็บ

เปิดหน้าเว็บครั้งแรก วาง Web App URL `/exec` ระบบจะตรวจ:

- API/schema version และ server time
- สิทธิ์การเข้าถึง
- POST redirect/response
- เขียน อ่าน และล้าง diagnostic record แบบ idempotent

Web App URL ถูกกำหนดใน `public/runtime-config.js` สำหรับ single-store deployment นี้ ผู้ใช้งานจึงไม่ต้องกรอก URL เอง หน้า setup จะปรากฏเฉพาะเมื่อ Config หายหรือการเชื่อมต่อไม่พร้อม

## Deploy GitHub Pages

```text
npm run verify
npm run deploy:web
git push origin main
```

เปิด Pages ใน Repository Settings แบบ GitHub Actions ระบบคำนวณ base path ของ repository อัตโนมัติ สำหรับ custom domain ให้ build ด้วย `CUSTOM_DOMAIN=true`

## PWA และ Offline

- ติดตั้งจากเมนู Add to Home Screen/Install App
- แคชเฉพาะ app shell และ static assets ไม่แคช API response หรือ payment acknowledgement
- ดู storefront ที่เคยเปิดและเก็บ draft ได้ออฟไลน์
- การยืนยันออเดอร์และส่งสลิปต้องออนไลน์เพื่อตรวจสต็อกและ deadline จากเซิร์ฟเวอร์
- หากมีเวอร์ชันใหม่ ให้ reload หลังบันทึก draft/งานค้างเรียบร้อย

## Email และงานเบื้องหลัง

OTP ถูกส่งใน request path เพราะจำเป็นต่อการเข้าสู่ระบบ อีเมลสถานะและข้อความร้านถูกสร้างเป็น `JobQueue` แล้วให้ Trigger ประมวลผล การบันทึกออเดอร์ยังสำเร็จได้แม้อีเมลล่าช้าหรือล้มเหลว

## สำรองข้อมูลและความปลอดภัย

- สำรอง Spreadsheet และโฟลเดอร์ Drive ตามนโยบายร้าน
- ห้ามแชร์ Sheet/Drive folder เป็นสาธารณะ
- Web App URL ไม่ใช่สิทธิ์เข้าถึง ทุก protected action ตรวจ opaque session
- OTP มีอายุ 10 นาที จำกัดครั้งขอ/ลอง และเก็บเฉพาะ salted hash
- ตรวจ `AuditLog`, `SecurityLog`, `MutationLog` และ `JobQueue` เป็นประจำ
- เมื่อปริมาณรายการย่อยเกินประมาณ 100,000 แถวหรือ concurrent writes สูง ให้ประเมินย้ายฐานข้อมูล

## แก้ปัญหา

- `SCHEMA_NOT_READY`: เปิด Sheet แล้วรัน `setupSystem()`
- URL ไม่ผ่าน: ต้องเป็น Web App `/exec` ไม่ใช่ `/dev`
- OTP ไม่เข้า: ดู Mail quota และ `SecurityLog`
- ออเดอร์หมดเวลา: สร้างใหม่ ระบบจะคืน reservation ผ่าน request validation และ Trigger
- Email สถานะไม่เข้า: ดู `JobQueue.lastError` แล้วประมวลผลงานค้างอีกครั้ง
- GitHub Pages asset 404: ตรวจ Pages workflow และ base path จากชื่อ repository
