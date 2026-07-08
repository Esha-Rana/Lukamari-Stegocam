import { useRef, useState, useEffect } from 'react'
import { socket } from '../socket'

const ICE_CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
}

export function useWebRTC(roomId) {
  const pc = useRef(null)
  const dataChannel = useRef(null)
  const chunks = useRef([])
  const [connected, setConnected] = useState(false)
  const [status, setStatus] = useState('Waiting...')
  const [receivedFile, setReceivedFile] = useState(null)

  useEffect(() => {
    if (!roomId) return

    socket.connect()
    socket.emit('join-room', roomId)
    setStatus('Joined room. Waiting for peer...')

    socket.on('user-joined', async () => {
      setStatus('Peer joined! Initiating connection...')
      await createOffer()
    })

    socket.on('offer', async ({ offer }) => {
      setStatus('Offer received. Connecting...')
      await handleOffer(offer)
    })

    socket.on('answer', async ({ answer }) => {
      await pc.current?.setRemoteDescription(answer)
    })

    socket.on('ice-candidate', async ({ candidate }) => {
      try { await pc.current?.addIceCandidate(candidate) } catch (e) {}
    })

    return () => {
      socket.off('user-joined')
      socket.off('offer')
      socket.off('answer')
      socket.off('ice-candidate')
      socket.disconnect()
      pc.current?.close()
    }
  }, [roomId])

  const initPC = () => {
    pc.current = new RTCPeerConnection(ICE_CONFIG)

    pc.current.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit('ice-candidate', { roomId, candidate })
    }

    pc.current.onconnectionstatechange = () => {
      const state = pc.current.connectionState
      setStatus(`Status: ${state}`)
      if (state === 'connected') setConnected(true)
    }

    pc.current.ondatachannel = ({ channel }) => setupDataChannel(channel)
  }

  const createOffer = async () => {
    initPC()
    dataChannel.current = pc.current.createDataChannel('stego')
    setupDataChannel(dataChannel.current)
    const offer = await pc.current.createOffer()
    await pc.current.setLocalDescription(offer)
    socket.emit('offer', { roomId, offer })
  }

  const handleOffer = async (offer) => {
    initPC()
    await pc.current.setRemoteDescription(offer)
    const answer = await pc.current.createAnswer()
    await pc.current.setLocalDescription(answer)
    socket.emit('answer', { roomId, answer })
  }

  const setupDataChannel = (ch) => {
    ch.binaryType = 'arraybuffer'
    ch.onopen = () => setStatus('Connected! Ready to send.')
    ch.onmessage = ({ data }) => {
      if (typeof data === 'string' && data === 'EOF') {
        const blob = new Blob(chunks.current, { type: 'image/png' })
        setReceivedFile(URL.createObjectURL(blob))
        chunks.current = []
        setStatus('File received!')
      } else {
        chunks.current.push(data)
        setStatus(`Receiving... (${chunks.current.length} chunks)`)
      }
    }
  }

  const sendFile = async (file) => {
    if (!dataChannel.current || dataChannel.current.readyState !== 'open') {
      alert('Not connected yet!')
      return
    }
    const buffer = await file.arrayBuffer()
    const chunkSize = 16384
    for (let i = 0; i < buffer.byteLength; i += chunkSize) {
      dataChannel.current.send(buffer.slice(i, i + chunkSize))
    }
    dataChannel.current.send('EOF')
    setStatus('File sent!')
  }

  return { connected, status, receivedFile, sendFile }
}