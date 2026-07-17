// WebSocket URL — reads from .env
// in dev: wrangler runs locally on 8787
// in production: your Worker URL
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8787'