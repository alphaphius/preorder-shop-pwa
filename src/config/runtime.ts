declare global { interface Window { PREORDER_SHOP_CONFIG?: { webAppUrl?: string } } }

export const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwMU_YNQ06sSmnjTSIceZ2wu8kHuT1hRUEGJdZTHDqLxP1JVGNRdzQmkRBxvyijIk36/exec'

export const configuredWebAppUrl = () => window.PREORDER_SHOP_CONFIG?.webAppUrl?.trim() || DEFAULT_WEB_APP_URL
