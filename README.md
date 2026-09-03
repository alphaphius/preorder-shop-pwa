# Preorder Shop PWA

เว็บร้านค้าสำหรับสินค้าพร้อมส่งและ Pre-order แยกคำสั่งซื้อ ใช้ Google Sheets เป็นฐานข้อมูล, Google Apps Script เป็น API และ GitHub Pages เป็นหน้าเว็บ

## เริ่มใช้งานแบบเร็ว

ทำตามลำดับนี้เพื่อติดตั้งร้านของตัวเอง โดยไม่ต้องสร้าง Google Sheet ใหม่

1. เปิด [Google Sheet template](https://docs.google.com/spreadsheets/d/1HyTD-yyjdhJlxx3_gImctnRGMkovkEVGGRwwXPHLG80/copy) แล้วกด **Make a copy** เพื่อเก็บ Sheet ไว้ใน Google Drive ของตนเอง
2. กลับมาที่ Sheet ที่ copy แล้ว reload หนึ่งครั้ง จากแถบเมนูด้านบนเลือก **Preorder Shop** > **สร้าง/อัปเดตฐานข้อมูล** (Setup Database) และอนุญาตสิทธิ์ตามที่ Google ขอ ระบบจะสร้างแท็บฐานข้อมูลและโฟลเดอร์ Drive ที่จำเป็นใน Sheet เดิมอย่างปลอดภัย
3. เลือก **Extensions** > **Apps Script** เพื่อเปิด Apps Script editor
4. ใน Apps Script ให้เลือก **Deploy** > **New deployment** > **Web app** แล้วตั้งค่า:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. กด **Deploy** อนุญาตสิทธิ์ แล้วคัดลอก URL ที่ลงท้ายด้วย `/exec` เก็บไว้ เช่น `https://script.google.com/macros/s/.../exec`
6. สมัครหรือเข้าสู่ระบบ [GitHub](https://github.com/) แล้วกด **Use this template** บน repository นี้ เพื่อสร้าง repository ของร้านตนเอง
7. เปิดไฟล์ [`public/runtime-config.js`](public/runtime-config.js) ใน GitHub แล้วกดแก้ไขค่า `webAppUrl` เป็น URL `/exec` จากข้อ 5 จากนั้นกด **Commit changes**
8. ไปที่ **Settings** > **Pages** ของ repository แล้วเลือก Source เป็น **GitHub Actions** ระบบจะ build และ deploy ให้อัตโนมัติทุกครั้งที่ push/commit เข้า `main`
9. รอ workflow `Deploy GitHub Pages` สำเร็จ แล้วเปิด URL ที่แสดงใน **Settings** > **Pages** เพื่อใช้งานร้าน

> สำคัญ: ใช้ URL ที่ลงท้าย `/exec` เท่านั้น ห้ามใช้ `/dev` และไม่ควรนำ URL ของร้านอื่นมาใช้ร่วมกัน

## หลังติดตั้งครั้งแรก

1. เปิดหน้าเว็บ GitHub Pages ของร้าน
2. ล็อกอินด้วย Email OTP ของ Owner ที่ตั้งค่าไว้จาก Sheet
3. เปิด **บัญชี** > **หลังบ้าน** > **ตั้งค่าร้านและหน้าโหลด** เพื่อเปลี่ยนชื่อร้าน โลโก้ สี และข้อความหน้าเปิด
4. เพิ่มอีเมลผู้ดูแลใน **ผู้ดูแลระบบ** ก่อนให้บุคคลนั้นล็อกอินด้วย OTP
5. เพิ่มสินค้า บัญชีรับเงิน สถานะออเดอร์ และรอบ Pre-order ก่อนเปิดขายจริง

## คุณสมบัติ

- Email OTP และบทบาท Customer/Admin/Owner
- พักสต็อกหรือโควตา 20 นาทีแบบ server-locked เพื่อป้องกัน oversell
- อัปโหลดสลิป ตรวจสอบการชำระเงิน และประวัติสถานะ
- รอบ Pre-order, มัดจำ, ยอดคงเหลือ และเงื่อนไขแบบมีเวอร์ชัน
- สินค้า หมวดหมู่ รูปหลายรูป ประกาศ รายการโปรด รีวิว แต้ม และ Feature Flags
- ไทย/อังกฤษ, System/Light/Dark/High Contrast และสีแบรนด์จาก Admin
- รองรับมือถือ, iPad และ desktop พร้อม PWA, cache shell และ draft
- Dashboard, ตาราง/การ์ดออเดอร์, export ข้อมูล และงานอีเมลแบบ background queue

## อุปกรณ์และเบราว์เซอร์

รองรับ iPhone/iPad Safari, Android Chrome, macOS Safari/Chrome/Firefox และ Windows Edge/Chrome/Firefox รุ่นปัจจุบัน

บน Android สามารถติดตั้งแอปจากเมนูของเบราว์เซอร์ เช่น **Install app** หรือ **Add to Home screen** ได้โดยตรง จึงไม่มีปุ่มติดตั้งในหน้าเว็บ

## แก้ไข Config บน GitHub

เปิด [`public/runtime-config.js`](public/runtime-config.js) แล้วแก้เฉพาะค่าในตัวอย่างนี้:

```js
window.PREORDER_SHOP_CONFIG = window.PREORDER_SHOP_CONFIG || {
  webAppUrl: 'วาง-Google-Apps-Script-Web-App-URL-ที่ลงท้ายด้วย-/exec-ที่นี่'
}
```

เมื่อกด Commit แล้ว GitHub Actions จะ deploy หน้าเว็บใหม่ให้เอง ไม่ต้องวาง Script ID, Sheet ID, รหัสผ่าน หรือ token ในไฟล์นี้

## เปลี่ยนชื่อร้าน ชื่อแอป และ URL

- **ชื่อร้านที่ลูกค้าเห็น:** ล็อกอิน Owner แล้วไปที่ **บัญชี** > **หลังบ้าน** > **ตั้งค่าร้านและหน้าโหลด** จากนั้นแก้ `ชื่อร้าน (ไทย)` และ `Store name (English)` แล้วกดบันทึก ชื่อนี้จะแสดงใน header และหน้าโหลดทันที
- **ชื่อแอปที่แสดงหลังติดตั้งลงโทรศัพท์:** แก้ `name` และ `short_name` ใน [`public/manifest.webmanifest`](public/manifest.webmanifest) แล้ว commit/push รอ Pages deploy จากนั้นเปิดแอปอีกครั้ง (บาง Android อาจต้องลบ shortcut เดิมและ Add to Home screen ใหม่เพื่อเห็นชื่อใหม่)
- **ชื่อบนแท็บเบราว์เซอร์:** แก้ `<title>` ใน [`index.html`](index.html) แล้ว commit/push
- **URL แบบ GitHub Pages:** ไปที่ repository > **Settings** > **General** > **Repository name** แล้วเปลี่ยนชื่อ repository URL จะกลายเป็น `https://<github-user>.github.io/<ชื่อ-repositoryใหม่>/` หลัง workflow deploy สำเร็จ ลิงก์เก่าจะใช้ไม่ได้ จึงควรแจ้งลูกค้าและอัปเดตลิงก์โซเชียล
- **URL สั้นแบบชื่อร้าน:** ต้องมีโดเมนของตนเอง แล้วตั้งที่ **Settings** > **Pages** > **Custom domain** พร้อมเพิ่ม DNS record ตามที่ GitHub แนะนำ ก่อน build ให้ตั้ง `CUSTOM_DOMAIN=true`

## สำหรับผู้ที่พัฒนาในเครื่อง

### สิ่งที่ต้องมี

- Node.js 22+
- Git และบัญชี GitHub
- Google Sheet template ที่ copy แล้ว
- `clasp` สำหรับ push Apps Script (เฉพาะกรณีแก้ไขโค้ดฝั่ง Apps Script)

### macOS / Windows Terminal / PowerShell

```text
git clone <your-repository-url>
cd preorder-shop-pwa
npm install
npm run verify
```

คำสั่ง Node รองรับ path ที่มีช่องว่างและชื่อภาษาไทย ไม่ต้องใช้ Bash, `sed` หรือ `awk`

หากแก้ Apps Script จากเครื่อง ให้ตั้งค่า Script ID ของ Sheet ที่ copy ด้วย:

```text
npm run setup:apps-script
npm run deploy:api
```

จากนั้นกลับไปที่ Google Sheet, reload หนึ่งครั้ง, รัน **Preorder Shop** > **สร้าง/อัปเดตฐานข้อมูล** เมื่อมีการเปลี่ยน schema และ deploy/redeploy Web App เพื่อรับ URL `/exec` ล่าสุด

สำหรับ Schema v3 ระบบจะเพิ่มวิธีคิดค่าส่งต่อสินค้า (เหมารายการ/ต่อชิ้น) และหลักฐานการยืนยันประเภทพื้นที่จัดส่ง โดยไม่ลบข้อมูลเดิม หลังอัปเดต Apps Script ให้รัน **Preorder Shop** > **สร้าง/อัปเดตฐานข้อมูล** หนึ่งครั้ง

ต้องการข้อมูลสำหรับทดลองจริงใน Google Sheet ให้เลือก **Preorder Shop** > **เพิ่มข้อมูลตัวอย่างสำหรับทดสอบ** หรือเข้าหลังบ้านด้วยบัญชี Owner แล้วไปที่ **ผู้ดูแลระบบ** > **สร้าง/อัปเดตข้อมูลตัวอย่าง** ระบบจะเขียนสินค้า Blog, ประกาศที่เชื่อมโยงสินค้า, รีวิว, ออเดอร์, สลิปตัวอย่าง และรูปแบบค่าส่งลง Sheet เดิม ฟังก์ชันนี้รันซ้ำได้และจะอัปเดตเฉพาะรหัส `mock-*` โดยไม่สร้างรายการซ้ำ

เพิ่มผู้ดูแลได้จากหน้าแอดมินของเว็บ หรือเมนู **Preorder Shop** > **เพิ่มผู้ดูแลด้วยอีเมล** ใน Google Sheet เมนูใน Sheet จะตรวจว่าบัญชีที่กำลังใช้งานเป็น Owner ก่อนทุกครั้ง

### Deploy หน้าเว็บจากเครื่อง

```text
npm run verify
npm run deploy:web
git push origin main
```

หลัง push ให้ตรวจ workflow `Deploy GitHub Pages` จนสำเร็จ หากใช้ custom domain ให้ build ด้วย `CUSTOM_DOMAIN=true`

## Google Sheets, Apps Script และความปลอดภัย

- `Setup Database` ใช้ Sheet ที่ copy เดิม ไม่สร้าง Spreadsheet ใหม่ และสามารถรันซ้ำได้โดยไม่ลบข้อมูลร้าน
- อนุญาตสิทธิ์ที่จำเป็นสำหรับ Sheets, Drive, Mail และ Trigger ในบัญชีเจ้าของร้าน
- ห้ามแชร์ Spreadsheet หรือโฟลเดอร์ Drive เป็นสาธารณะ
- Web App URL ไม่ใช่สิทธิ์เข้าถึง: API ตรวจ session และบทบาททุกคำสั่งที่ได้รับการป้องกัน
- ห้าม commit `.clasp.json`, OAuth credential, session, Sheet ID หรือข้อมูลลูกค้าจริง

## PWA, Offline และการแจ้งเตือน

- แคชเฉพาะ app shell และ static assets ไม่แคช API response หรือ payment acknowledgement
- ดู storefront ที่เคยเปิดและเก็บ draft ได้ออฟไลน์ แต่การยืนยันออเดอร์และส่งสลิปต้องออนไลน์
- การแจ้งเตือนในเวอร์ชันนี้ทำงานขณะเปิดเว็บ/แอปอยู่ หากต้องการแจ้งเตือนขณะปิดแอป ต้องตั้งค่า Web Push provider เช่น FCM เพิ่มเติม
- หากมีเวอร์ชันใหม่ ให้ reload หลังบันทึก draft/งานค้างเรียบร้อย

## สำรองข้อมูลและแก้ปัญหา

- สำรอง Spreadsheet และโฟลเดอร์ Drive ตามนโยบายร้าน
- `SCHEMA_NOT_READY`: กลับไปที่ Sheet แล้วรัน **Setup Database**
- URL ไม่ผ่าน: ตรวจว่าเป็น Web App URL `/exec` ไม่ใช่ `/dev`
- OTP ไม่เข้า: ตรวจ Mail quota และ `SecurityLog`
- Email สถานะไม่เข้า: ดู `JobQueue.lastError` แล้วประมวลผลงานค้างอีกครั้ง
- GitHub Pages asset 404: ตรวจว่า Settings > Pages เลือก **GitHub Actions** และ workflow สำเร็จ
