import type { StorefrontData } from '../domain/types'

const now = Date.now()
export const mockStorefront: StorefrontData = {
  settings: { storeNameTh: 'Mellow Mart', storeNameEn: 'Mellow Mart', primaryColor: '#6d28d9', defaultTheme: 'system', allowUserTheme: true, pointsEnabled: true, reviewsEnabled: true, favoritesEnabled: true, reservationMinutes: 20, currency: 'THB', shippingFee: 50, shippingMode: 'CART', cartShippingFee: 50, loaderKickerTh: 'ยินดีต้อนรับสู่', loaderKickerEn: 'Welcome to', loaderTitleTh: '', loaderTitleEn: '', loaderMessageTh: 'กำลังจัดชั้นสินค้าให้คุณ', loaderMessageEn: 'Curating the shelves for you', loaderLogoUrl: '' },
  categories: [
    { id: 'all', nameTh: 'ทั้งหมด', nameEn: 'All', active: true, sortOrder: 0 },
    { id: 'ready', nameTh: 'พร้อมส่ง', nameEn: 'Ready stock', active: true, sortOrder: 1 },
    { id: 'preorder', nameTh: 'Pre-order', nameEn: 'Pre-order', active: true, sortOrder: 2 },
    { id: 'dessert', nameTh: 'ของหวาน', nameEn: 'Dessert', active: true, sortOrder: 3 },
  ],
  announcements: [{ id: 'ann-1', headerTh: 'Pre-order เปิดแล้ว', headerEn: 'Pre-order is open', bodyTh: 'รอบเกาหลีเดือนกันยายน ปิดรับ 5 ก.ย. เวลา 20:00', bodyEn: 'Korea September round closes Sep 5 at 8 PM', kind: 'PREORDER', active: true }],
  campaigns: [{ id: 'campaign-1', nameTh: 'รอบเกาหลีเดือนกันยายน', nameEn: 'Korea September round', openAt: new Date(now - 86400000).toISOString(), closeAt: new Date(now + 604800000).toISOString(), expectedArrival: new Date(now + 3888000000).toISOString(), capacity: 50, reservedQuantity: 19, purchaseLimit: 3, deposit: 250, finalPaymentTrigger: 'เมื่อสินค้าถึงไทย', status: 'OPEN', terms: { id: 'terms-1', version: 2, titleTh: 'เงื่อนไข Pre-order', titleEn: 'Pre-order terms', bodyTh: 'กำหนดถึงอาจเปลี่ยนตามการขนส่ง\nหลังส่งหลักฐานแล้วไม่สามารถยกเลิกเอง\nระบบจะแจ้งเมื่อถึงรอบชำระยอดคงเหลือ', bodyEn: 'Arrival dates may change due to shipping.\nOrders cannot be self-cancelled after payment proof.\nWe will notify you when the balance is due.' } }],
  products: [
    { id: 'p-1', type: 'READY', titleTh: 'คุกกี้หมีเนย', titleEn: 'Butter bear cookies', descriptionTh: 'คุกกี้เนยหอม บรรจุแยกชิ้น เก็บได้นาน 30 วัน', descriptionEn: 'Fragrant butter cookies, individually packed.', price: 189, shippingFee: 35, deposit: 0, stockOnHand: 8, reservedQuantity: 2, purchaseLimit: 3, points: 18, active: true, reviewEnabled: true, imageUrls: [], categoryId: 'dessert' },
    { id: 'p-2', type: 'PREORDER', titleTh: 'แก้วองุ่นม่วง', titleEn: 'Purple grape glass', descriptionTh: 'แก้วคอลเลกชันฤดูใบไม้ร่วง', descriptionEn: 'Autumn collection glass.', price: 359, shippingFee: 45, deposit: 120, stockOnHand: 30, reservedQuantity: 4, purchaseLimit: 2, points: 35, active: true, reviewEnabled: true, imageUrls: [], categoryId: 'preorder', preorderCampaignId: 'campaign-1' },
    { id: 'p-3', type: 'READY', titleTh: 'เยลลี่พีช', titleEn: 'Peach jelly', descriptionTh: 'เยลลี่พีชเนื้อนุ่ม', descriptionEn: 'Soft peach jelly.', price: 99, shippingFee: 25, deposit: 0, stockOnHand: 12, reservedQuantity: 0, purchaseLimit: 5, points: 9, active: true, reviewEnabled: true, imageUrls: [], categoryId: 'dessert' },
    { id: 'p-4', type: 'PREORDER', titleTh: 'กล่องสุ่มฤดูใบไม้ร่วง', titleEn: 'Autumn blind box', descriptionTh: 'กล่องสุ่มลายพิเศษประจำฤดู', descriptionEn: 'Limited seasonal blind box.', price: 690, shippingFee: 55, deposit: 250, stockOnHand: 50, reservedQuantity: 19, purchaseLimit: 3, points: 69, active: true, reviewEnabled: true, imageUrls: [], categoryId: 'preorder', preorderCampaignId: 'campaign-1' },
  ],
  paymentAccounts: [{ id: 'bank-1', bankName: 'ธนาคารกสิกรไทย', accountName: 'Mellow Mart', accountNumberMasked: 'XXX-X-X1234-X', active: true }],
  serverTime: new Date().toISOString(),
}
