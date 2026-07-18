const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8788';

export class SignalingClient {
  constructor(roomId, onMessage) {
    this.roomId = roomId;
    this.onMessage = onMessage;
    this.ws = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      console.log(`[Signal] Connecting to room: ${this.roomId}`);
      this.ws = new WebSocket(`${WS_URL}/room/${this.roomId}`);

      this.ws.onopen = () => {
        console.log('[Signal] Connected');
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`[Signal] Received: ${data.type}`);
          this.onMessage(data);
        } catch (e) {
          console.error('[Signal] Failed to parse message', e);
        }
      };

      this.ws.onerror = (e) => {
        console.error('[Signal] Error', e);
        reject(e);
      };

      this.ws.onclose = () => {
        console.log('[Signal] Disconnected');
      };
    });
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log(`[Signal] Sending: ${data.type}`);
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[Signal] Cannot send — WebSocket not open');
    }
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}