import { io } from 'socket.io-client'

// reads from .env — so you only change the URL in one place
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

export const socket = io(SERVER_URL, {
  autoConnect: false  // only connect when Share page is opened
})