import { describe, expect, it } from 'vitest'
import { normalizeEndpoint } from '../src/api/client'

describe('Apps Script endpoint', () => {
  it('normalizes valid exec URLs', () => expect(normalizeEndpoint('https://script.google.com/macros/s/ABC_123-def/exec/')).toBe('https://script.google.com/macros/s/ABC_123-def/exec'))
  it('rejects dev and arbitrary URLs', () => {
    expect(() => normalizeEndpoint('https://example.com/api')).toThrow()
    expect(() => normalizeEndpoint('https://script.google.com/macros/s/ABC/dev')).toThrow()
  })
})
