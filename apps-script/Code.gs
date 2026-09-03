var API_VERSION = '1.0.0';
var SCHEMA_VERSION = 3;

function doGet(e) {
  var requestId = Utilities.getUuid();
  try {
    var action = e && e.parameter && e.parameter.action || 'health';
    if (action === 'health') return output_(true, health_(), requestId);
    if (action === 'storefront') return output_(true, storefront_(e.parameter.locale || 'th'), requestId);
    if (action === 'productReviews') return output_(true, productReviews_(e.parameter.productId || ''), requestId);
    if (action === 'publicMedia') return output_(true, publicMedia_(e.parameter.id || ''), requestId);
    throw apiError_('NOT_FOUND', 'ไม่พบคำสั่งที่ร้องขอ');
  } catch (error) { return errorOutput_(error, requestId); }
}

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse(e && e.postData && e.postData.contents || '{}');
    if (!body.action) throw apiError_('BAD_REQUEST', 'ไม่ระบุ action');
    var requestId = body.requestId || Utilities.getUuid();
    var data = route_(body.action, body.payload || {}, body.session || '', requestId);
    return output_(true, data, requestId);
  } catch (error) { return errorOutput_(error, body.requestId); }
}

function route_(action, payload, token, requestId) {
  if (action === 'connectionTest') return connectionTest_();
  if (action === 'requestOtp') return requestOtp_(payload.email);
  if (action === 'verifyOtp') return verifyOtp_(payload.email, payload.code, payload.rememberDevice);
  var session = requireSession_(token);
  if (action === 'me') return publicUser_(session.user);
  if (action === 'createReservation') return createReservation_(session, payload, requestId);
  if (action === 'uploadSlip') return uploadSlip_(session, payload, requestId);
  if (action === 'listOrders') return listOrders_(session);
  if (action === 'listFavorites') return listFavorites_(session);
  if (action === 'toggleFavorite') return toggleFavorite_(session, payload.productId, requestId);
  if (action === 'createReview') return createReview_(session, payload);
  if (action === 'listNotifications') return listNotifications_(session);
  if (action === 'readNotification') return readNotification_(session, payload.id);
  if (action === 'notificationFeed') return notificationFeed_(session, payload.since);
  if (action === 'adminDashboard') return adminDashboard_(requireRole_(session, ['ADMIN', 'OWNER']));
  if (action === 'adminWorkspace') return adminWorkspace_(requireRole_(session, ['ADMIN', 'OWNER']));
  if (action === 'adminConfiguration') return adminConfiguration_(requireRole_(session, ['ADMIN', 'OWNER']));
  if (action === 'adminSaveSettings') return adminSaveSettings_(requireRole_(session, ['ADMIN', 'OWNER']), payload);
  if (action === 'adminAddAdmin') return adminAddAdmin_(session, payload);
  if (action === 'adminRemoveAdmin') return adminRemoveAdmin_(session, payload);
  if (action === 'adminSeedMockData') return adminSeedMockData_(requireRole_(session, ['OWNER']));
  if (action === 'adminSetShippingAdjustment') return adminSetShippingAdjustment_(requireRole_(session, ['ADMIN', 'OWNER']), payload);
  if (action === 'adminSaveProduct') return adminSaveProduct_(requireRole_(session, ['ADMIN', 'OWNER']), payload, requestId);
  if (action === 'adminSaveCategory') return adminSaveCategory_(requireRole_(session, ['ADMIN', 'OWNER']), payload);
  if (action === 'adminSaveAnnouncement') return adminSaveAnnouncement_(requireRole_(session, ['ADMIN', 'OWNER']), payload);
  if (action === 'adminSaveCampaign') return adminSaveCampaign_(requireRole_(session, ['ADMIN', 'OWNER']), payload);
  if (action === 'adminSavePaymentAccount') return adminSavePaymentAccount_(requireRole_(session, ['ADMIN', 'OWNER']), payload);
  if (action === 'adminSetEntityActive') return adminSetEntityActive_(requireRole_(session, ['ADMIN', 'OWNER']), payload);
  if (action === 'adminSaveStatuses') return adminSaveStatuses_(requireRole_(session, ['ADMIN', 'OWNER']), payload);
  if (action === 'adminModerateReview') return adminModerateReview_(requireRole_(session, ['ADMIN', 'OWNER']), payload);
  if (action === 'adminUploadMedia') return adminUploadMedia_(requireRole_(session, ['ADMIN', 'OWNER']), payload);
  if (action === 'adminFile') return adminFile_(requireRole_(session, ['ADMIN', 'OWNER']), payload.id);
  if (action === 'adminReviewPayment') return adminReviewPayment_(requireRole_(session, ['ADMIN', 'OWNER']), payload, requestId);
  if (action === 'adminTransitionOrder') return adminTransitionOrder_(requireRole_(session, ['ADMIN', 'OWNER']), payload, requestId);
  if (action === 'adminSendMessage') return adminSendMessage_(requireRole_(session, ['ADMIN', 'OWNER']), payload, requestId);
  if (action === 'jobStatus') return jobStatus_(payload.jobId, session);
  throw apiError_('NOT_FOUND', 'ไม่พบคำสั่ง ' + action);
}

function health_() {
  var props = PropertiesService.getScriptProperties();
  return { apiVersion: API_VERSION, schemaVersion: SCHEMA_VERSION, installed: props.getProperty('SCHEMA_VERSION') === String(SCHEMA_VERSION), storage: 'CONTAINER_BOUND_SHEET', serverTime: new Date().toISOString() };
}

function output_(ok, data, requestId) {
  return ContentService.createTextOutput(JSON.stringify({ ok: ok, data: data, error: null, requestId: requestId || Utilities.getUuid(), serverTime: new Date().toISOString(), apiVersion: API_VERSION })).setMimeType(ContentService.MimeType.JSON);
}
function errorOutput_(error, requestId) {
  console.error(error && error.stack || error);
  return ContentService.createTextOutput(JSON.stringify({ ok: false, data: null, error: { code: error.code || 'SERVER_ERROR', message: error.message || 'เกิดข้อผิดพลาดใน Apps Script', details: error.details || null }, requestId: requestId || Utilities.getUuid(), serverTime: new Date().toISOString(), apiVersion: API_VERSION })).setMimeType(ContentService.MimeType.JSON);
}
function apiError_(code, message, details) { var error = new Error(message); error.code = code; error.details = details; return error; }
