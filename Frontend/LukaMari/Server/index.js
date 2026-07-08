const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
require('dotenv').config()

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    // during dev: your vite port
    // during production: your deployed frontend URL
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

// health check — visit this to confirm server works
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// track active rooms
const rooms = {}

io.on('connection', (socket) => {
  console.log('Connected:', socket.id)

  socket.on('join-room', (roomId) => {
    socket.join(roomId)
    if (!rooms[roomId]) rooms[roomId] = []
    rooms[roomId].push(socket.id)
    // tell the other person someone joined
    socket.to(roomId).emit('user-joined', socket.id)
    console.log(`${socket.id} joined ${roomId}`)
  })

  // just relay — server never reads these
  socket.on('offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('offer', { offer, from: socket.id })
  })

  socket.on('answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('answer', { answer, from: socket.id })
  })

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', { candidate })
  })

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id)
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id)
      if (rooms[roomId].length === 0) delete rooms[roomId]
    }
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`))