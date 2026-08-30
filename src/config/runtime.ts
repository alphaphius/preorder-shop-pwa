declare global { interface Window { PREORDER_SHOP_CONFIG?: { webAppUrl?: string } } }
export const configuredWebAppUrl = () => window.PREORDER_SHOP_CONFIG?.webAppUrl?.trim() || ''
