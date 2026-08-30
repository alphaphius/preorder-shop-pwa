import { openDB } from 'idb'
import type { CartLine, OutboxMutation, StorefrontData } from '../domain/types'

const dbPromise = openDB('preorder-shop', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache')
    if (!db.objectStoreNames.contains('drafts')) db.createObjectStore('drafts')
    if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id' })
  },
})

export async function cacheStorefront(value: StorefrontData) { (await dbPromise).put('cache', value, 'storefront') }
export async function loadCachedStorefront() { return (await dbPromise).get('cache', 'storefront') as Promise<StorefrontData | undefined> }
export async function saveCart(lines: CartLine[]) { (await dbPromise).put('drafts', lines, 'cart') }
export async function loadCart() { return ((await dbPromise).get('drafts', 'cart') || []) as Promise<CartLine[]> }
export async function queueMutation(mutation: Omit<OutboxMutation, 'attempts' | 'nextAttemptAt' | 'state'>) {
  const record: OutboxMutation = { ...mutation, attempts: 0, nextAttemptAt: new Date().toISOString(), state: 'QUEUED' }
  await (await dbPromise).put('outbox', record); return record
}
export async function listOutbox() { return (await dbPromise).getAll('outbox') as Promise<OutboxMutation[]> }
