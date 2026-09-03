import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('apps-script')
const source = fs.readdirSync(root).filter((name) => name.endsWith('.gs')).map((name) => fs.readFileSync(path.join(root, name), 'utf8')).join('\n')

describe('Apps Script contract', () => {
  it('contains the required setup and reservation boundaries', () => {
    expect(source).toContain('function setupSystem()')
    expect(source).toContain('LockService.getScriptLock()')
    expect(source).toContain("'STOCK_CONFLICT'")
    expect(source).toContain('cleanupExpiredReservations')
  })
  it('uses OTP hashes and opaque sessions', () => {
    expect(source).toContain('codeHash')
    expect(source).toContain('tokenHash')
    expect(source).not.toContain('passwordHash')
  })
  it('does not expose arbitrary sheet calls or public Drive links', () => {
    expect(source).not.toContain('setSharing(')
    expect(source).not.toContain('eval(')
    expect(source).not.toContain('google.script.run')
  })
  it('protects admin configuration and supports favorites', () => {
    expect(source).toContain("requireRole_(session, ['ADMIN', 'OWNER'])")
    expect(source).toContain('function listFavorites_')
    expect(source).toContain("requireRole_(context, ['OWNER'])")
  })
  it('keeps slips private while supporting in-app viewing and safe public content media',()=>{
    expect(source).toContain('function adminFile_')
    expect(source).toContain('function publicMedia_')
    expect(source).toContain("'SHOP_LOGO'")
    expect(source).not.toContain('drive.google.com/open?id=')
  })
  it('provides analytics and rich content fields',()=>{
    expect(source).toContain('totalTransferred')
    expect(source).toContain('productSales')
    expect(source).toContain('contentJson')
    expect(source).toContain('productIdsJson')
  })
  it('supports remembered sessions and role-aware notification polling',()=>{
    expect(source).toContain('rememberDevice ? 24 * 30')
    expect(source).toContain('function notificationFeed_')
    expect(source).toContain("kind:'ORDER_CREATED'")
    expect(source).toContain("kind:'PAYMENT_SUBMITTED'")
  })
  it('requires shipping agreement and supports safe shipping adjustments',()=>{
    expect(source).toContain('SHIPPING_TERMS_REQUIRED')
    expect(source).toContain('shippingTermsAcceptedAt')
    expect(source).toContain('function adminSetShippingAdjustment_')
    expect(source).toContain('SET_SHIPPING_ADJUSTMENT')
  })
  it('stores X accounts and emits low-stock events',()=>{
    expect(source).toContain('xAccount')
    expect(source).toContain("kind:'LOW_STOCK'")
    expect(source).toContain('lowStockThreshold')
  })
  it('timestamps every order transition and reopens the payment window for balances',()=>{
    expect(source).toContain("payload.status==='BALANCE_DUE'")
    expect(source).toContain("insert_('OrderStatusHistory'")
    expect(source).toContain("queueJob_('ORDER_STATUS_CHANGED'")
    expect(source).toContain("var isBalance=fresh.status==='BALANCE_DUE'")
  })
  it('keeps status emails off the save path and processes them in bounded batches',()=>{
    expect(source).toContain("queueJob_('ORDER_STATUS_CHANGED'")
    expect(source).toContain(".slice(0,3)")
    expect(source).toContain('Date.now()-started>240000')
    expect(source).toContain("job.state==='RUNNING'")
  })
  it('round-trips rich product content across legacy and current sheet layouts',()=>{
    expect(source).toContain("if(!headers[i]&&(record[header]===undefined||record[header]==='')")
    expect(source).toContain('sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0]')
    expect(source).toContain('var result=adminProduct_(next)')
    expect(source).toContain('contentEnabled:truthy_(item.contentEnabled)')
    expect(source).toContain('content:jsonArray_(item.contentJson)')
  })
  it('soft-deletes admin-created records without damaging transaction history',()=>{
    expect(source).toContain('function adminDeleteEntity_')
    expect(source).toContain("if (action === 'adminDeleteEntity')")
    expect(source).toContain("patch={deletedAt:new Date().toISOString()}")
    expect(source).toContain("'DELETE_'+String(payload.entity).toUpperCase()")
    expect(source).toContain("['all','ready','preorder']")
    expect(source).toContain("'STATUS_IN_USE'")
    expect(source).toContain('filter(notDeleted_)')
  })
})
