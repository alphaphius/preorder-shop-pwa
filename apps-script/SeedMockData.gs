function seedMockData() {
  if (PropertiesService.getScriptProperties().getProperty('SCHEMA_VERSION') !== String(SCHEMA_VERSION)) setupSystem();
  return withScriptLock_(function() {
    var now = Date.now();
    var day = 24 * 60 * 60 * 1000;
    var iso = function(offsetDays) { return new Date(now + offsetDays * day).toISOString(); };

    [
      { id:'dessert', nameTh:'ของหวาน', nameEn:'Desserts', active:true, sortOrder:3 },
      { id:'drink', nameTh:'เครื่องดื่ม', nameEn:'Drinks', active:true, sortOrder:4 },
      { id:'collectible', nameTh:'ของสะสม', nameEn:'Collectibles', active:true, sortOrder:5 },
      { id:'beauty', nameTh:'บิวตี้', nameEn:'Beauty', active:true, sortOrder:6 }
    ].forEach(function(item) { upsertMock_('Categories', item); });

    var campaigns = [
      { id:'mock-campaign-korea', nameTh:'รอบเกาหลี เดือนกันยายน', nameEn:'Korea September Round', openAt:iso(-2), closeAt:iso(8), expectedArrival:iso(45), capacity:60, purchaseLimit:3, deposit:250, finalPaymentTrigger:'เมื่อสินค้าเดินทางถึงประเทศไทย', termsId:'mock-terms-korea-v1', status:'OPEN' },
      { id:'mock-campaign-japan', nameTh:'รอบญี่ปุ่น คาแรกเตอร์แฟร์', nameEn:'Japan Character Fair', openAt:iso(-1), closeAt:iso(14), expectedArrival:iso(60), capacity:40, purchaseLimit:2, deposit:300, finalPaymentTrigger:'เมื่อร้านต่างประเทศยืนยันการจัดส่ง', termsId:'mock-terms-japan-v1', status:'OPEN' }
    ];
    campaigns.forEach(function(item) { upsertMock_('PreorderCampaigns', item); });
    [
      { id:'mock-terms-korea-v1', campaignId:'mock-campaign-korea', versionNumber:1, titleTh:'เงื่อนไขรอบเกาหลี', titleEn:'Korea round terms', bodyTh:'วันถึงโดยประมาณอาจเปลี่ยนตามการขนส่ง\nหลังส่งหลักฐานแล้วไม่สามารถยกเลิกเอง\nร้านจะแจ้งเตือนเมื่อถึงรอบชำระยอดคงเหลือ', bodyEn:'Arrival is an estimate and may change.\nOrders cannot be self-cancelled after payment proof.\nWe will notify you when the balance is due.', effectiveAt:iso(-2), createdBy:'SYSTEM' },
      { id:'mock-terms-japan-v1', campaignId:'mock-campaign-japan', versionNumber:1, titleTh:'เงื่อนไขรอบญี่ปุ่น', titleEn:'Japan round terms', bodyTh:'สินค้าเป็น Pre-order ไม่รับเปลี่ยนหรือคืน\nสีจากภาพอาจแตกต่างเล็กน้อย\nกรุณาชำระยอดคงเหลือตามขั้นตอนที่ร้านแจ้ง', bodyEn:'Pre-order items are non-returnable.\nColours may vary slightly.\nPlease pay the balance when notified.', effectiveAt:iso(-1), createdBy:'SYSTEM' }
    ].forEach(function(item) { upsertMock_('PreorderTerms', item); });

    var products = [
      { id:'mock-ready-cookie', type:'READY', titleTh:'คุกกี้หมีเนย', titleEn:'Butter Bear Cookies', descriptionTh:'คุกกี้เนยหอม บรรจุแยกชิ้น เก็บได้นาน 30 วัน', descriptionEn:'Fragrant butter cookies, individually packed.', price:189, deposit:0, stockOnHand:8, purchaseLimit:3, points:18, active:true, reviewEnabled:true, imagesJson:JSON.stringify(['https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=80']), categoryId:'dessert', preorderCampaignId:'' },
      { id:'mock-ready-jelly', type:'READY', titleTh:'เยลลี่พีชญี่ปุ่น', titleEn:'Japanese Peach Jelly', descriptionTh:'เยลลี่พีชเนื้อนุ่ม หอมหวานกำลังดี แพ็ก 6 ชิ้น', descriptionEn:'Soft peach jelly in a six-piece pack.', price:129, deposit:0, stockOnHand:3, purchaseLimit:4, points:12, active:true, reviewEnabled:true, imagesJson:JSON.stringify(['https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=900&q=80']), categoryId:'dessert', preorderCampaignId:'' },
      { id:'mock-ready-matcha', type:'READY', titleTh:'มัทฉะลาเต้พรีเมียม', titleEn:'Premium Matcha Latte', descriptionTh:'ผงมัทฉะแท้ ชงง่าย ได้ทั้งร้อนและเย็น', descriptionEn:'Premium matcha blend for hot or iced drinks.', price:259, deposit:0, stockOnHand:12, purchaseLimit:3, points:25, active:true, reviewEnabled:true, imagesJson:JSON.stringify(['https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=900&q=80']), categoryId:'drink', preorderCampaignId:'' },
      { id:'mock-ready-lip', type:'READY', titleTh:'ลิปบาล์มองุ่นม่วง', titleEn:'Purple Grape Lip Balm', descriptionTh:'ลิปบาล์มสีอ่อน กลิ่นองุ่น เติมความชุ่มชื้น', descriptionEn:'A moisturising tinted balm with grape scent.', price:219, deposit:0, stockOnHand:2, purchaseLimit:2, points:21, active:true, reviewEnabled:true, imagesJson:JSON.stringify(['https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80']), categoryId:'beauty', preorderCampaignId:'' },
      { id:'mock-po-grape-glass', type:'PREORDER', titleTh:'แก้วองุ่นม่วงคอลเลกชัน', titleEn:'Purple Grape Glass', descriptionTh:'แก้วคอลเลกชันฤดูใบไม้ร่วง พร้อมกล่องของขวัญ', descriptionEn:'Autumn collection glass with gift box.', price:459, deposit:150, stockOnHand:30, purchaseLimit:2, points:45, active:true, reviewEnabled:true, imagesJson:JSON.stringify(['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80']), categoryId:'collectible', preorderCampaignId:'mock-campaign-korea' },
      { id:'mock-po-blindbox', type:'PREORDER', titleTh:'กล่องสุ่ม Autumn Friends', titleEn:'Autumn Friends Blind Box', descriptionTh:'ฟิกเกอร์กล่องสุ่ม 1 ตัว จากทั้งหมด 8 แบบ', descriptionEn:'One mystery figure from eight autumn designs.', price:690, deposit:250, stockOnHand:50, purchaseLimit:3, points:69, active:true, reviewEnabled:true, imagesJson:JSON.stringify(['https://images.unsplash.com/photo-1594784054224-8bb9b3c7ca99?auto=format&fit=crop&w=900&q=80']), categoryId:'collectible', preorderCampaignId:'mock-campaign-korea' },
      { id:'mock-po-tote', type:'PREORDER', titleTh:'กระเป๋าผ้า Character Fair', titleEn:'Character Fair Tote Bag', descriptionTh:'กระเป๋าผ้าลายลิมิเต็ดจากงานคาแรกเตอร์แฟร์', descriptionEn:'Limited tote from the character fair.', price:790, deposit:300, stockOnHand:40, purchaseLimit:2, points:79, active:true, reviewEnabled:true, imagesJson:JSON.stringify(['https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=900&q=80']), categoryId:'collectible', preorderCampaignId:'mock-campaign-japan' },
      { id:'mock-po-perfume', type:'PREORDER', titleTh:'น้ำหอม Morning Garden', titleEn:'Morning Garden Perfume', descriptionTh:'กลิ่นดอกไม้สะอาด ขนาด 30 ml รุ่นเฉพาะฤดูกาล', descriptionEn:'A clean floral seasonal fragrance, 30 ml.', price:1190, deposit:400, stockOnHand:20, purchaseLimit:1, points:119, active:true, reviewEnabled:true, imagesJson:JSON.stringify(['https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80']), categoryId:'beauty', preorderCampaignId:'mock-campaign-japan' }
    ];
    products.forEach(function(item) { upsertMock_('Products', item); });

    [
      { id:'mock-ann-preorder', headerTh:'Pre-order รอบใหม่เปิดแล้ว', headerEn:'A new pre-order round is open', bodyTh:'รอบเกาหลีและญี่ปุ่นเปิดรับจำนวนจำกัด ดูวันปิดรอบได้ในหน้าสินค้า', bodyEn:'Korea and Japan rounds are open in limited quantities.', imageUrl:'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=1200&q=80', kind:'PREORDER', active:true, sortOrder:1 },
      { id:'mock-ann-new', headerTh:'สินค้าใหม่พร้อมส่ง', headerEn:'New ready-stock arrivals', bodyTh:'คุกกี้ มัทฉะ และไอเท็มบิวตี้พร้อมส่งแล้ววันนี้', bodyEn:'Cookies, matcha and beauty items are ready to ship.', imageUrl:'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80', kind:'NEW_PRODUCT', active:true, sortOrder:2 },
      { id:'mock-ann-general', headerTh:'ส่งฟรีเมื่อครบ 1,500 บาท', headerEn:'Free shipping over ฿1,500', bodyTh:'ใช้ได้กับสินค้าพร้อมส่งในออเดอร์เดียวกัน', bodyEn:'Valid for ready-stock items in one order.', imageUrl:'', kind:'GENERAL', active:false, sortOrder:3 }
    ].forEach(function(item) { upsertMock_('Announcements', item); });

    [
      { id:'mock-bank-kbank', bankName:'ธนาคารกสิกรไทย (ทดสอบ)', accountName:'PREORDER SHOP TEST', accountNumber:'000-0-00000-0', accountNumberMasked:'XXX-X-X0000-X', active:true, sortOrder:1 },
      { id:'mock-bank-promptpay', bankName:'พร้อมเพย์ (ทดสอบ)', accountName:'PREORDER SHOP TEST', accountNumber:'0000000000', accountNumberMasked:'XXX-XXX-0000', active:true, sortOrder:2 }
    ].forEach(function(item) { upsertMock_('PaymentAccounts', item); });

    upsertMock_('Users', { id:'mock-customer-001', email:'customer@example.invalid', displayName:'ลูกค้าทดสอบ', role:'CUSTOMER', status:'ACTIVE', locale:'th', pointsBalance:168 });
    upsertMock_('Orders', { id:'mock-order-ready-001', reference:'RD-MOCK-1001', userId:'mock-customer-001', orderType:'READY', status:'PAYMENT_REVIEW', subtotal:577, shippingFee:50, amountDueNow:627, totalPaid:627, balanceDue:0, reservedUntil:iso(1), shippingJson:JSON.stringify({name:'ลูกค้าทดสอบ',province:'Bangkok'}), termsVersion:'', paymentAccountId:'mock-bank-kbank', createdAt:new Date().toISOString() });
    upsertMock_('OrderItems', { id:'mock-item-ready-001', orderId:'mock-order-ready-001', productId:'mock-ready-cookie', titleSnapshot:'คุกกี้หมีเนย / Butter Bear Cookies', unitPrice:189, depositUnit:0, quantity:1, pointsUnit:18 });
    upsertMock_('OrderItems', { id:'mock-item-ready-002', orderId:'mock-order-ready-001', productId:'mock-ready-matcha', titleSnapshot:'มัทฉะลาเต้พรีเมียม / Premium Matcha Latte', unitPrice:259, depositUnit:0, quantity:1, pointsUnit:25 });
    upsertMock_('OrderItems', { id:'mock-item-ready-003', orderId:'mock-order-ready-001', productId:'mock-ready-jelly', titleSnapshot:'เยลลี่พีชญี่ปุ่น / Japanese Peach Jelly', unitPrice:129, depositUnit:0, quantity:1, pointsUnit:12 });
    upsertMock_('Payments', { id:'mock-payment-001', orderId:'mock-order-ready-001', userId:'mock-customer-001', kind:'FULL', amount:627, accountId:'mock-bank-kbank', slipFileId:'MOCK-NO-FILE', transferAt:new Date().toISOString(), status:'PENDING_REVIEW', reviewNote:'ข้อมูลตัวอย่างสำหรับทดสอบ Dashboard', reviewedBy:'', reviewedAt:'' });
    upsertMock_('JobQueue', { id:'mock-job-failed-001', kind:'ORDER_STATUS_CHANGED', payloadJson:JSON.stringify({orderId:'mock-order-ready-001',userId:'mock-customer-001'}), state:'FAILED', attempts:5, nextAttemptAt:iso(0), leaseUntil:'', lastError:'Mock email provider timeout' });

    PropertiesService.getScriptProperties().setProperty('MOCK_DATA_SEEDED_AT', new Date().toISOString());
    return { seeded:true, products:products.length, campaigns:campaigns.length, announcements:3, paymentAccounts:2, sampleOrders:1 };
  });
}

function upsertMock_(tableName, data) {
  var current = findById_(tableName, data.id);
  if (current) return update_(tableName, current.id, data);
  return insert_(tableName, data);
}
