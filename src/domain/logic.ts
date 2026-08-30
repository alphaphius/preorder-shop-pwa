import type { CartLine, Product, ProductType } from './types'

export const availableStock = (product: Pick<Product, 'stockOnHand' | 'reservedQuantity'>) => Math.max(0, product.stockOnHand - product.reservedQuantity)

export const clampQuantity = (product: Product, requested: number) => {
  const max = Math.min(product.purchaseLimit || Number.MAX_SAFE_INTEGER, availableStock(product))
  return Math.max(0, Math.min(Math.floor(requested), max))
}

export const cartType = (lines: CartLine[], products: Product[]): ProductType | null => {
  const types = new Set(lines.map((line) => products.find((product) => product.id === line.productId)?.type).filter(Boolean))
  if (types.size === 0) return null
  if (types.size > 1) throw new Error('READY_AND_PREORDER_MUST_BE_SEPARATE')
  return [...types][0] as ProductType
}

export const cartTotal = (lines: CartLine[], products: Product[], depositOnly = false) => lines.reduce((sum, line) => {
  const product = products.find((item) => item.id === line.productId)
  if (!product) return sum
  const unit = depositOnly && product.type === 'PREORDER' ? product.deposit : product.price
  return sum + unit * line.quantity
}, 0)

export const secondsRemaining = (expiresAt: string | undefined, serverNow = Date.now()) => !expiresAt ? 0 : Math.max(0, Math.ceil((new Date(expiresAt).getTime() - serverNow) / 1000))

export const formatCountdown = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

export const canSubmitPayment = (expiresAt: string | undefined, online: boolean, now = Date.now()) => online && secondsRemaining(expiresAt, now) > 0
