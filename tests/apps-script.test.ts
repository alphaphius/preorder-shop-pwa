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
})
