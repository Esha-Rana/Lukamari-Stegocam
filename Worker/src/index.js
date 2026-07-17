// ── Entry point ──────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // WebSocket signaling route: /room/:roomId
    if (url.pathname.startsWith('/room/')) {
      const roomId = url.pathname.split('/')[2]
      if (!roomId) {
        return new Response('Room ID required', { status: 400 })
      }

      // get or create a Durable Object for this room
      const roomObjectId = env.ROOMS.idFromName(roomId)
      const roomObject = env.ROOMS.get(roomObjectId)

      // forward the request to the Durable Object
      return roomObject.fetch(request)
    }

    return new Response('Not found', { status: 404 })
  }
}

// ── Durable Object — one instance per room ───────────────────
export class SignalingRoom {
  constructor(state, env) {
    this.state = state
    this.connections = []   // holds all WebSocket connections in this room
  }

  async fetch(request) {
    // must be a WebSocket upgrade request
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    // create a WebSocket pair — client gets one end, we keep the other
    const [client, server] = Object.values(new WebSocketPair())

    this.handleSession(server)

    return new Response(null, {
      status: 101,
      webSocket: client
    })
  }

  handleSession(ws) {
    ws.accept()
    this.connections.push(ws)

    ws.addEventListener('message', (event) => {
      // broadcast the signal to everyone else in the room
      // the server just relays — never reads the content
      const others = this.connections.filter(c => c !== ws)
      others.forEach(other => {
        try {
          other.send(event.data)
        } catch (e) {
          // connection probably closed
        }
      })
    })

    ws.addEventListener('close', () => {
      this.connections = this.connections.filter(c => c !== ws)
    })

    ws.addEventListener('error', () => {
      this.connections = this.connections.filter(c => c !== ws)
    })
  }
}