export function registerPwa() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return
  addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => undefined))
}
