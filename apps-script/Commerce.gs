function createReservation_(context, payload, requestId) {
  var previous = mutationResult_(requestId, context.user.id); if (previous) return previous;
  var lines = payload.lines || []; if (!Array.isArray(lines) || !lines.length) throw apiError_('EMPTY_CART', 'ตะกร้าว่าง');
  return withScriptLock_(function() {
    var duplicate = mutationResult_(requestId, context.user.id); if (duplicate) return duplicate;
    cleanupExpiredReservations_();
    var normalized = []; var orderType = ''; var subtotal = 0; var depositDue = 0;
    lines.forEach(function(line) {
      var product = findById_('Products', line.productId); var quantity = Math.floor(Number(line.quantity || 0));
      if (!product || !truthy_(product.active)) throw apiError_('PRODUCT_UNAVAILABLE', 'สินค้าบางรายการไม่พร้อมขาย', { productId: line.productId });
      if (!orderType) orderType = product.type; if (orderType !== product.type) throw apiError_('MIXED_CART', 'สินค้าพร้อมส่งและ Pre-order ต้องแยกออเดอร์');
      if (quantity < 1 || quantity > Number(product.purchaseLimit || 1)) throw apiError_('PURCHASE_LIMIT', 'จำนวนสินค้าเกินที่กำหนด', { productId: product.id, limit: Number(product.purchaseLimit || 1) });
      var purchased = purchasedQuantity_(context.user.id, product.id); if (purchased + quantity > Number(product.purchaseLimit || 1)) throw apiError_('CUSTOMER_LIMIT_REACHED', 'คุณซื้อสินค้านี้ครบจำนวนที่กำหนดแล้ว', { productId: product.id, remaining: Math.max(0, Number(product.purchaseLimit || 1) - purchased) });
      var available = availableQuantity_(product.id); if (quantity > available) throw apiError_('STOCK_CONFLICT', 'สินค้าเพิ่งถูกจองครบหรือเหลือน้อยกว่าที่เลือก', { productId: product.id, available: available });
      if (product.type === 'PREORDER') validatePreorder_(product, payload.termsAcceptance);
      normalized.push({ product: product, quantity: quantity }); subtotal += Number(product.price || 0) * quantity; depositDue += (product.type === 'PREORDER' ? Number(product.deposit || 0) : Number(product.price || 0)) * quantity;
    });
    var shippingFee = Number(setting_('shippingFee', 50)); var amountDueNow = depositDue + shippingFee; var now = new Date(); var expiresAt = new Date(now.getTime() + Number(setting_('reservationMinutes', 20)) * 60000).toISOString(); var orderId = Utilities.getUuid(); var reference = reference_(orderType);
    var order = insert_('Orders', { id: orderId, reference: reference, userId: context.user.id, orderType: orderType, status: 'AWAITING_PAYMENT', subtotal: subtotal, shippingFee: shippingFee, amountDueNow: amountDueNow, totalPaid: 0, balanceDue: subtotal + shippingFee, reservedUntil: expiresAt, shippingJson: JSON.stringify(payload.shipping || {}), termsVersion: payload.termsAcceptance && payload.termsAcceptance.version || '', paymentAccountId: '' });
    normalized.forEach(function(item) {
      insert_('OrderItems', { orderId: orderId, productId: item.product.id, titleSnapshot: item.product.titleTh + ' / ' + item.product.titleEn, unitPrice: Number(item.product.price || 0), depositUnit: Number(item.product.deposit || 0), quantity: item.quantity, pointsUnit: Number(item.product.points || 0) });
      insert_('StockReservations', { orderId: orderId, productId: item.product.id, userId: context.user.id, quantity: item.quantity, state: 'HELD', expiresAt: expiresAt });
    });
    if (orderType === 'PREORDER') insert_('TermsAcceptances', { orderId: orderId, userId: context.user.id, termsId: payload.termsAcceptance.termsId, versionNumber: payload.termsAcceptance.version, acceptedAt: now.toISOString(), deviceInfo: String(payload.deviceInfo || '').slice(0, 250) });
    insert_('OrderStatusHistory', { orderId: orderId, fromStatus: '', toStatus: 'AWAITING_PAYMENT', note: 'Stock reserved for payment', actorUserId: context.user.id });
    var result = { order: publicOrder_(order), serverTime: new Date().toISOString() }; saveMutation_(requestId, context.user.id, 'createReservation', result); return result;
  });
}

function validatePreorder_(product, acceptance) {
  var campaign = findById_('PreorderCampaigns', product.preorderCampaignId); if (!campaign || computedCampaignStatus_(campaign) !== 'OPEN') throw apiError_('PREORDER_CLOSED', 'รอบ Pre-order ไม่ได้เปิดรับ');
  var terms = findById_('PreorderTerms', campaign.termsId); if (!terms || !acceptance || acceptance.termsId !== terms.id || Number(acceptance.version) !== Number(terms.versionNumber)) throw apiError_('TERMS_REQUIRED', 'กรุณาอ่านและยอมรับเงื่อนไข Pre-order ฉบับล่าสุด');
}
function purchasedQuantity_(userId, productId) {
  var validOrders = {}; records_('Orders').filter(function(order){return order.userId===userId && ['CANCELLED','EXPIRED','REFUNDED'].indexOf(order.status)<0;}).forEach(function(order){validOrders[order.id]=true;});
  return records_('OrderItems').filter(function(item){return validOrders[item.orderId] && item.productId===productId;}).reduce(function(sum,item){return sum+Number(item.quantity||0);},0);
}
function availableQuantity_(productId) {
  var product = findById_('Products', productId); if (!product) return 0; var held = records_('StockReservations').filter(function(item){return item.productId===productId && ['HELD','SUBMITTED'].indexOf(item.state)>=0 && new Date(item.expiresAt).getTime()>Date.now();}).reduce(function(sum,item){return sum+Number(item.quantity||0);},0); return Math.max(0, Number(product.stockOnHand||0)-held);
}
function reference_(type) { var date = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyMMdd'); var suffix = String(Math.floor(1000 + Math.random()*9000)); return (type==='PREORDER'?'PO':'RD')+'-'+date+'-'+suffix; }

function uploadSlip_(context, payload, requestId) {
  var previous = mutationResult_(requestId, context.user.id); if (previous) return previous;
  var order = findById_('Orders', payload.orderId); if (!order || order.userId !== context.user.id) throw apiError_('ORDER_NOT_FOUND', 'ไม่พบออเดอร์');
  if (order.status !== 'AWAITING_PAYMENT') throw apiError_('INVALID_ORDER_STATE', 'ออเดอร์นี้ไม่อยู่ในขั้นตอนส่งหลักฐาน');
  if (new Date(order.reservedUntil).getTime() <= Date.now()) { cleanupExpiredReservations_(); throw apiError_('RESERVATION_EXPIRED', 'หมดเวลาชำระแล้ว กรุณาสร้างออเดอร์ใหม่'); }
  var mime = String(payload.mimeType || ''); if (['image/jpeg','image/png','image/webp'].indexOf(mime)<0) throw apiError_('INVALID_FILE_TYPE', 'รองรับเฉพาะ JPG, PNG หรือ WebP');
  var bytes; try { bytes = Utilities.base64Decode(String(payload.base64 || '')); } catch (_) { throw apiError_('INVALID_FILE', 'อ่านไฟล์สลิปไม่สำเร็จ'); }
  if (!bytes.length || bytes.length > CONFIG.MAX_SLIP_BYTES) throw apiError_('FILE_TOO_LARGE', 'รูปสลิปต้องมีขนาดไม่เกิน 5MB');
  var folderId = PropertiesService.getScriptProperties().getProperty('PAYMENT_SLIPS_FOLDER_ID'); if (!folderId) { ensureDriveFolders_(); folderId = PropertiesService.getScriptProperties().getProperty('PAYMENT_SLIPS_FOLDER_ID'); }
  var safeName = String(payload.fileName || 'slip.jpg').replace(/[^A-Za-z0-9._-]/g,'_').slice(-100); var blob = Utilities.newBlob(bytes, mime, order.reference+'-'+safeName); var file = DriveApp.getFolderById(folderId).createFile(blob);
  try {
    return withScriptLock_(function() {
      var duplicate = mutationResult_(requestId, context.user.id); if (duplicate) { file.setTrashed(true); return duplicate; }
      var fresh = findById_('Orders', payload.orderId); if (!fresh || fresh.status !== 'AWAITING_PAYMENT' || new Date(fresh.reservedUntil).getTime() <= Date.now()) { file.setTrashed(true); cleanupExpiredReservations_(); throw apiError_('RESERVATION_EXPIRED', 'หมดเวลาชำระแล้ว กรุณาสร้างออเดอร์ใหม่'); }
      var fileRecord = insert_('FileRegistry', { ownerUserId: context.user.id, orderId: fresh.id, kind: 'PAYMENT_SLIP', driveFileId: file.getId(), fileName: safeName, mimeType: mime, size: bytes.length, checksum: digest_(Utilities.base64Encode(bytes)), state: 'ACTIVE' });
      var amount = Number(payload.amount || 0); if (amount <= 0) throw apiError_('INVALID_AMOUNT', 'กรุณาระบุยอดที่โอน');
      var payment = insert_('Payments', { orderId: fresh.id, userId: context.user.id, kind: fresh.orderType==='PREORDER'?'DEPOSIT':'FULL', amount: amount, accountId: payload.accountId, slipFileId: fileRecord.id, transferAt: payload.transferAt || new Date().toISOString(), status: 'PENDING_REVIEW', reviewNote: '', reviewedBy: '', reviewedAt: '' });
      findAll_('StockReservations','orderId',fresh.id).forEach(function(reservation){ if(reservation.state==='HELD'){ var product=findById_('Products',reservation.productId); if(!product || Number(product.stockOnHand)<Number(reservation.quantity))throw apiError_('STOCK_INVARIANT','สต็อกไม่เพียงพอระหว่างบันทึก'); update_('Products',product.id,{stockOnHand:Number(product.stockOnHand)-Number(reservation.quantity)}); update_('StockReservations',reservation.id,{state:'COMMITTED'}); } });
      var next = update_('Orders', fresh.id, { status:'PAYMENT_REVIEW', totalPaid:amount, paymentAccountId:payload.accountId }); insert_('OrderStatusHistory',{orderId:fresh.id,fromStatus:'AWAITING_PAYMENT',toStatus:'PAYMENT_REVIEW',note:'Payment proof submitted',actorUserId:context.user.id});
      var emailJob = queueJob_('ORDER_PAYMENT_SUBMITTED',{orderId:fresh.id,userId:context.user.id,paymentId:payment.id}); var result={order:publicOrder_(next),paymentId:payment.id,emailJobId:emailJob.id}; saveMutation_(requestId,context.user.id,'uploadSlip',result); return result;
    });
  } catch (error) { try { if (file && !file.isTrashed()) file.setTrashed(true); } catch (_) {} throw error; }
}

function cleanupExpiredReservations() { return cleanupExpiredReservations_(); }
function cleanupExpiredReservations_() {
  var now = Date.now(); var expired = records_('StockReservations').filter(function(item){return item.state==='HELD' && new Date(item.expiresAt).getTime()<=now;}); var orderIds={}; expired.forEach(function(item){update_('StockReservations',item.id,{state:'EXPIRED'});orderIds[item.orderId]=true;}); Object.keys(orderIds).forEach(function(orderId){var order=findById_('Orders',orderId);if(order&&order.status==='AWAITING_PAYMENT'){update_('Orders',order.id,{status:'EXPIRED'});insert_('OrderStatusHistory',{orderId:order.id,fromStatus:'AWAITING_PAYMENT',toStatus:'EXPIRED',note:'Payment window expired',actorUserId:'SYSTEM'});queueJob_('ORDER_EXPIRED',{orderId:order.id,userId:order.userId});}}); return {released:expired.length};
}
function listOrders_(context) { return records_('Orders').filter(function(order){return order.userId===context.user.id;}).sort(function(a,b){return String(b.createdAt).localeCompare(String(a.createdAt));}).map(publicOrder_); }
function publicOrder_(order) { return { id:order.id,reference:order.reference,orderType:order.orderType,status:order.status,subtotal:Number(order.subtotal||0),totalPaid:Number(order.totalPaid||0),balanceDue:Number(order.balanceDue||0),reservedUntil:order.reservedUntil||undefined,createdAt:order.createdAt }; }
function toggleFavorite_(context,productId,requestId){var product=findById_('Products',productId);if(!product)throw apiError_('PRODUCT_NOT_FOUND','ไม่พบสินค้า');var id=context.user.id+':'+productId;var current=findById_('Favorites',id);var active=current?!truthy_(current.active):true;current?update_('Favorites',id,{active:active}):insert_('Favorites',{id:id,userId:context.user.id,productId:productId,active:active});return{active:active,requestId:requestId};}
