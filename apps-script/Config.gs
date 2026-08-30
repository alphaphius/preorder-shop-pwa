/**
 * Server-only configuration.
 *
 * Leave SPREADSHEET_ID empty for the recommended container-bound flow.
 * setupSystem() will detect the Google Sheet that owns this Apps Script,
 * save its ID to Script Properties, and mirror it into Settings:spreadsheetId.
 * Set an explicit ID only for recovery when the active container is unavailable.
 */
var CONFIG = Object.freeze({
  SPREADSHEET_ID: '',
  TIMEZONE: 'Asia/Bangkok',
  CURRENCY: 'THB',
  DEFAULT_RESERVATION_MINUTES: 20,
  MAX_SLIP_BYTES: 5 * 1024 * 1024
});
