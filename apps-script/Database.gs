var TABLES = {
  Settings: ['id','key','value','updatedAt'],
  Users: ['id','email','displayName','role','status','locale','pointsBalance','createdAt','updatedAt','version'],
  OtpCodes: ['id','email','purpose','codeHash','salt','expiresAt','attempts','consumedAt','createdAt','updatedAt','version'],
  Sessions: ['id','userId','tokenHash','role','expiresAt','privilegedUntil','revokedAt','createdAt','updatedAt','version'],
  Categories: ['id','nameTh','nameEn','active','sortOrder','createdAt','updatedAt','version'],
  Products: ['id','type','titleTh','titleEn','descriptionTh','descriptionEn','price','deposit','stockOnHand','purchaseLimit','points','active','reviewEnabled','imagesJson','categoryId','preorderCampaignId','createdAt','updatedAt','version','shippingFee'],
  PreorderCampaigns: ['id','nameTh','nameEn','openAt','closeAt','expectedArrival','capacity','purchaseLimit','deposit','finalPaymentTrigger','termsId','status','createdAt','updatedAt','version'],
  PreorderTerms: ['id','campaignId','versionNumber','titleTh','titleEn','bodyTh','bodyEn','effectiveAt','createdBy','createdAt','updatedAt','version'],
  TermsAcceptances: ['id','orderId','userId','termsId','versionNumber','acceptedAt','deviceInfo','createdAt','updatedAt','version'],
  Orders: ['id','reference','userId','orderType','status','subtotal','shippingFee','amountDueNow','totalPaid','balanceDue','reservedUntil','shippingJson','termsVersion','paymentAccountId','createdAt','updatedAt','version','pointsRedeemed','discount'],
  OrderItems: ['id','orderId','productId','titleSnapshot','unitPrice','depositUnit','quantity','pointsUnit','createdAt','updatedAt','version'],
  StockReservations: ['id','orderId','productId','userId','quantity','state','expiresAt','createdAt','updatedAt','version'],
  Payments: ['id','orderId','userId','kind','amount','accountId','slipFileId','transferAt','status','reviewNote','reviewedBy','reviewedAt','createdAt','updatedAt','version'],
  PaymentAccounts: ['id','bankName','accountName','accountNumber','accountNumberMasked','active','sortOrder','createdAt','updatedAt','version'],
  OrderStatusHistory: ['id','orderId','fromStatus','toStatus','note','actorUserId','createdAt','updatedAt','version'],
  OrderMessages: ['id','orderId','campaignId','subjectTh','subjectEn','bodyTh','bodyEn','sendEmail','createdBy','createdAt','updatedAt','version'],
  Announcements: ['id','headerTh','headerEn','bodyTh','bodyEn','imageUrl','kind','active','sortOrder','createdAt','updatedAt','version'],
  Favorites: ['id','userId','productId','active','createdAt','updatedAt','version'],
  Reviews: ['id','userId','productId','orderItemId','rating','body','status','adminReply','createdAt','updatedAt','version'],
  PointsLedger: ['id','userId','orderId','kind','points','expiresAt','note','createdAt','updatedAt','version'],
  Notifications: ['id','userId','orderId','kind','titleTh','titleEn','bodyTh','bodyEn','readAt','createdAt','updatedAt','version'],
  FileRegistry: ['id','ownerUserId','orderId','kind','driveFileId','fileName','mimeType','size','checksum','state','createdAt','updatedAt','version'],
  JobQueue: ['id','kind','payloadJson','state','attempts','nextAttemptAt','leaseUntil','lastError','createdAt','updatedAt','version'],
  MutationLog: ['id','userId','action','resultJson','createdAt','updatedAt','version'],
  AuditLog: ['id','actorUserId','action','entity','entityId','beforeJson','afterJson','createdAt','updatedAt','version'],
  SecurityLog: ['id','email','event','ipHint','details','createdAt','updatedAt','version'],
  SchemaMigrations: ['id','schemaVersion','appliedAt','notes'],
  Diagnostics: ['id','marker','createdAt']
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Preorder Shop').addItem('สร้าง/อัปเดตฐานข้อมูล', 'setupSystem').addItem('เพิ่มข้อมูลตัวอย่างสำหรับทดสอบ', 'seedMockData').addItem('ตั้งค่า Owner จากบัญชีปัจจุบัน', 'configureCurrentUserAsOwner').addItem('ประมวลผลงานค้าง', 'processJobs').addToUi();
}

function setupSystem() {
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    var ss = bindContainerSpreadsheet_();
    Object.keys(TABLES).forEach(function(name) { ensureSheet_(ss, name, TABLES[name]); });
    seedSettings_(); setSetting_('spreadsheetId', ss.getId()); seedReferenceData_(); ensureDriveFolders_(); ensureTriggers_();
    PropertiesService.getScriptProperties().setProperty('SCHEMA_VERSION', String(SCHEMA_VERSION));
    if (!findOne_('SchemaMigrations', 'schemaVersion', SCHEMA_VERSION)) insert_('SchemaMigrations', { id: Utilities.getUuid(), schemaVersion: SCHEMA_VERSION, appliedAt: new Date().toISOString(), notes: 'Initial commerce schema' });
    var owner = configureCurrentUserAsOwner_();
    return { installed: true, spreadsheetName: ss.getName(), ownerEmail: owner && owner.email || '' };
  } finally { lock.releaseLock(); }
}

function configureCurrentUserAsOwner() { return configureCurrentUserAsOwner_(); }
function configureCurrentUserAsOwner_() {
  var email = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) throw apiError_('OWNER_EMAIL_UNAVAILABLE', 'ไม่พบอีเมลของบัญชีที่รันสคริปต์ กรุณาตั้ง Script Property INITIAL_OWNER_EMAIL');
  PropertiesService.getScriptProperties().setProperty('INITIAL_OWNER_EMAIL', email);
  var user = findOne_('Users', 'email', email);
  if (!user) user = insert_('Users', { id: Utilities.getUuid(), email: email, displayName: email.split('@')[0], role: 'OWNER', status: 'ACTIVE', locale: 'th', pointsBalance: 0 });
  else if (user.role !== 'OWNER') user = update_('Users', user.id, { role: 'OWNER', status: 'ACTIVE' });
  return user;
}

function bindContainerSpreadsheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss && CONFIG.SPREADSHEET_ID) ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  if (!ss) throw apiError_('CONTAINER_REQUIRED', 'สคริปต์นี้ต้องสร้างจาก Google Sheet เดิม และต้องรัน setupSystem จากหน้า Spreadsheet');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId()); return ss;
}
var SPREADSHEET_RUNTIME_CACHE_;
function spreadsheet_() {
  if (SPREADSHEET_RUNTIME_CACHE_) return SPREADSHEET_RUNTIME_CACHE_;
  var active = SpreadsheetApp.getActiveSpreadsheet(); if (active) { SPREADSHEET_RUNTIME_CACHE_ = active; return active; }
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || CONFIG.SPREADSHEET_ID;
  if (!id) throw apiError_('NOT_INSTALLED', 'กรุณารัน setupSystem จาก Google Sheet ก่อน');
  SPREADSHEET_RUNTIME_CACHE_ = SpreadsheetApp.openById(id); return SPREADSHEET_RUNTIME_CACHE_;
}
function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  else {
    var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
    headers.forEach(function(header) { if (existing.indexOf(header) < 0) { existing.push(header); sheet.getRange(1, existing.length).setValue(header); } });
  }
  sheet.setFrozenRows(1); sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).setFontWeight('bold').setBackground('#6d28d9').setFontColor('#ffffff');
  if (!sheet.getFilter() && sheet.getLastColumn() > 0) sheet.getRange(1, 1, Math.max(1, sheet.getLastRow()), sheet.getLastColumn()).createFilter();
  return sheet;
}
function sheet_(name) {
  var ss = spreadsheet_();
  return ss.getSheetByName(name) || ensureSheet_(ss, name, TABLES[name]);
}
function records_(name) {
  var sheet = sheet_(name); if (sheet.getLastRow() < 2) return [];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues().map(function(row, index) { var record = { _row: index + 2 }; headers.forEach(function(header, i) { record[header] = row[i]; }); return record; });
}
function findById_(name, id) { return records_(name).filter(function(record) { return String(record.id) === String(id); })[0] || null; }
function findOne_(name, field, value) { return records_(name).filter(function(record) { return String(record[field]) === String(value); })[0] || null; }
function findAll_(name, field, value) { return records_(name).filter(function(record) { return String(record[field]) === String(value); }); }
function insert_(name, record) {
  var now = new Date().toISOString(); var next = Object.assign({ id: Utilities.getUuid(), createdAt: now, updatedAt: now, version: 1 }, record);
  var headers = TABLES[name]; ensureSheet_(spreadsheet_(), name, headers).appendRow(headers.map(function(header) { return next[header] === undefined || next[header] === null ? '' : next[header]; })); return next;
}
function update_(name, id, patch, expectedVersion) {
  var current = findById_(name, id); if (!current) throw apiError_('NOT_FOUND', 'ไม่พบข้อมูล ' + name + ':' + id);
  if (expectedVersion !== undefined && Number(current.version) !== Number(expectedVersion)) throw apiError_('VERSION_CONFLICT', 'ข้อมูลถูกแก้จากอุปกรณ์อื่น', { current: current });
  var next = Object.assign({}, current, patch, { updatedAt: new Date().toISOString(), version: Number(current.version || 0) + 1 }); delete next._row;
  var headers = TABLES[name]; ensureSheet_(spreadsheet_(), name, headers).getRange(current._row, 1, 1, headers.length).setValues([headers.map(function(header) { return next[header] === undefined || next[header] === null ? '' : next[header]; })]); return next;
}
function deleteRow_(name, row) { sheet_(name).deleteRow(row); }
function setting_(key, fallback) { var record = findOne_('Settings', 'key', key); if (!record) return fallback; try { return JSON.parse(record.value); } catch (_) { return record.value; } }
function setSetting_(key, value) { var record = findOne_('Settings', 'key', key); var payload = typeof value === 'string' ? value : JSON.stringify(value); return record ? update_('Settings', record.id, { value: payload }) : insert_('Settings', { id: key, key: key, value: payload }); }
function seedSettings_() {
  var defaults = { storeNameTh: 'ร้านของฉัน', storeNameEn: 'My Shop', primaryColor: '#6d28d9', defaultTheme: 'system', allowUserTheme: true, pointsEnabled: true, reviewsEnabled: true, favoritesEnabled: true, reservationMinutes: 20, currency: 'THB', shippingFee: 50, shippingMode: 'CART', cartShippingFee: 50, pointsPerBaht: 10, minimumRedeemPoints: 100, maxRedeemPercent: 20, loaderKickerTh: 'ยินดีต้อนรับสู่', loaderKickerEn: 'Welcome to', loaderTitleTh: '', loaderTitleEn: '', loaderMessageTh: 'กำลังจัดชั้นสินค้าให้คุณ', loaderMessageEn: 'Curating the shelves for you', loaderLogoUrl: '' };
  Object.keys(defaults).forEach(function(key) { if (!findOne_('Settings', 'key', key)) setSetting_(key, defaults[key]); });
}
function seedReferenceData_() {
  if (!findOne_('Categories', 'id', 'all')) insert_('Categories', { id: 'all', nameTh: 'ทั้งหมด', nameEn: 'All', active: true, sortOrder: 0 });
  if (!findOne_('Categories', 'id', 'ready')) insert_('Categories', { id: 'ready', nameTh: 'พร้อมส่ง', nameEn: 'Ready stock', active: true, sortOrder: 1 });
  if (!findOne_('Categories', 'id', 'preorder')) insert_('Categories', { id: 'preorder', nameTh: 'Pre-order', nameEn: 'Pre-order', active: true, sortOrder: 2 });
}
function ensureDriveFolders_() {
  var props = PropertiesService.getScriptProperties(); var rootId = props.getProperty('DRIVE_ROOT_FOLDER_ID'); var root;
  try { root = rootId && DriveApp.getFolderById(rootId); } catch (_) { root = null; }
  if (!root) { root = DriveApp.createFolder('Preorder Shop Files'); props.setProperty('DRIVE_ROOT_FOLDER_ID', root.getId()); }
  ['Products','Announcements','Payment Slips'].forEach(function(name) { var key = name.toUpperCase().replace(/\s/g, '_') + '_FOLDER_ID'; if (!props.getProperty(key)) { var folders = root.getFoldersByName(name); var folder = folders.hasNext() ? folders.next() : root.createFolder(name); props.setProperty(key, folder.getId()); } });
}
function ensureTriggers_() {
  var handlers = ScriptApp.getProjectTriggers().map(function(trigger) { return trigger.getHandlerFunction(); });
  if (handlers.indexOf('cleanupExpiredReservations') < 0) ScriptApp.newTrigger('cleanupExpiredReservations').timeBased().everyMinutes(1).create();
  if (handlers.indexOf('processJobs') < 0) ScriptApp.newTrigger('processJobs').timeBased().everyMinutes(5).create();
}
function withScriptLock_(callback) { var lock = LockService.getScriptLock(); lock.waitLock(30000); try { return callback(); } finally { lock.releaseLock(); } }
function mutationResult_(requestId, userId) { var record = findById_('MutationLog', requestId); if (!record || String(record.userId) !== String(userId)) return null; try { return JSON.parse(record.resultJson); } catch (_) { return null; } }
function saveMutation_(requestId, userId, action, result) { insert_('MutationLog', { id: requestId, userId: userId, action: action, resultJson: JSON.stringify(result) }); }
