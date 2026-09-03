import { describe, expect, it } from 'vitest'
import { availableStock, canSubmitPayment, cartTotal, cartType, clampQuantity, formatCountdown, secondsRemaining, shippingTotal } from '../src/domain/logic'
import { mockStorefront } from '../src/mock/data'

describe('commerce logic', () => {
  it('subtracts active reservations from stock', () => expect(availableStock({ stockOnHand: 8, reservedQuantity: 2 })).toBe(6))
  it('clamps quantity to customer and stock limits', () => expect(clampQuantity(mockStorefront.products[0], 9)).toBe(3))
  it('rejects mixed ready and preorder carts', () => expect(() => cartType([{ productId: 'p-1', quantity: 1 }, { productId: 'p-2', quantity: 1 }], mockStorefront.products)).toThrow('READY_AND_PREORDER_MUST_BE_SEPARATE'))
  it('calculates full and deposit totals separately', () => {
    const lines = [{ productId: 'p-4', quantity: 2 }]
    expect(cartTotal(lines, mockStorefront.products)).toBe(1380)
    expect(cartTotal(lines, mockStorefront.products, true)).toBe(500)
  })
  it('calculates cart-wide and per-item shipping', () => {
    const lines = [{ productId: 'p-1', quantity: 2 }, { productId: 'p-3', quantity: 1 }]
    expect(shippingTotal(lines, mockStorefront.products, { shippingMode: 'CART', cartShippingFee: 50 })).toBe(50)
    expect(shippingTotal(lines, mockStorefront.products, { shippingMode: 'ITEM', cartShippingFee: 50 })).toBe(95)
    expect(shippingTotal(lines, mockStorefront.products.map((product, index) => index === 0 ? { ...product, shippingCalculation: 'FLAT' } : product), { shippingMode: 'ITEM', cartShippingFee: 50 })).toBe(60)
  })
  it('uses server deadline for countdown', () => {
    expect(secondsRemaining('2026-08-30T10:01:40.000Z', Date.parse('2026-08-30T10:00:00.000Z'))).toBe(100)
    expect(formatCountdown(100)).toBe('01:40')
    expect(canSubmitPayment('2026-08-30T10:01:40.000Z', true, Date.parse('2026-08-30T10:00:00.000Z'))).toBe(true)
    expect(canSubmitPayment('2026-08-30T09:59:00.000Z', true, Date.parse('2026-08-30T10:00:00.000Z'))).toBe(false)
  })
})
