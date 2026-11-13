/**
 * config.ts 
 */
export const CLOUDFLARE_URL = process.env.CLOUDFLARE_URL
export const WSS_URL = CLOUDFLARE_URL!.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws'

