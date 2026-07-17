import { useRef, useState, useEffect, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8787';

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const CHUNK_SIZE = 16384; // 16 KB

/**
 * Enhanced WebRTC hook with role-based logic, progress tracking, and detailed status events.
 *
 * @param {string|null} roomId
 * @param {'sender'|'receiver'} role
 * @returns {{ status, progress, receivedBlob, sendBlob, cancel }}
 */
export function useWebRTC(roomId, role) {
  const pc = useRef(null);
  const dc = useRef(null); // DataChannel
  const ws = useRef(null);
  const chunks = useRef([]);
  const totalChunks = useRef(0);
  const receivedChunks = useRef(0);

  const [status, setStatus] = useState('idle');
  // 'idle' | 'connecting' | 'ice-established' | 'webrtc-established' | 'sending' | 'complete' | 'error'
  const [progress, setProgress] = useState(0);
  const [receivedBlob, setReceivedBlob] = useState(null);

  const sendSignal = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  /* ── DataChannel setup ── */
  function setupDC(channel) {
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      setStatus('webrtc-established');
    };

    channel.onmessage = ({ data }) => {
      if (typeof data === 'string') {
        // Control messages
        if (data.startsWith('TOTAL:')) {
          totalChunks.current = parseInt(data.slice(6));
          receivedChunks.current = 0;
          chunks.current = [];
          setStatus('sending');
        } else if (data === 'EOF') {
          const blob = new Blob(chunks.current, { type: 'image/png' });
          setReceivedBlob(blob);
          setProgress(100);
          setStatus('complete');
          chunks.current = [];
        }
      } else {
        // Binary chunk
        chunks.current.push(data);
        receivedChunks.current++;
        if (totalChunks.current > 0) {
          setProgress(Math.round((receivedChunks.current / totalChunks.current) * 100));
          setStatus('sending');
        }
      }
    };

    channel.onerror = () => setStatus('error');
    channel.onclose = () => {};
  }

  /* ── RTCPeerConnection setup ── */
  function createPC() {
    const connection = new RTCPeerConnection(ICE_CONFIG);

    connection.onicecandidate = ({ candidate }) => {
      if (candidate) sendSignal({ type: 'candidate', candidate });
    };

    connection.oniceconnectionstatechange = () => {
      const s = connection.iceConnectionState;
      if (s === 'checking') setStatus('connecting');
      if (s === 'connected' || s === 'completed') setStatus('ice-established');
      if (s === 'failed' || s === 'disconnected') setStatus('error');
    };

    connection.ondatachannel = ({ channel }) => {
      dc.current = channel;
      setupDC(channel);
    };

    pc.current = connection;
    return connection;
  }

  /* ── Sender: create offer ── */
  async function createOffer() {
    const connection = createPC();
    const channel = connection.createDataChannel('stego');
    dc.current = channel;
    setupDC(channel);

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    sendSignal({ type: 'offer', offer });
  }

  /* ── Receiver: handle offer ── */
  async function handleOffer(offer) {
    const connection = createPC();
    await connection.setRemoteDescription(offer);
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);
    sendSignal({ type: 'answer', answer });
  }

  /* ── Connect to signaling server ── */
  useEffect(() => {
    if (!roomId || !role) return;

    setStatus('connecting');
    ws.current = new WebSocket(`${WS_URL}/room/${roomId}`);

    ws.current.onopen = () => {
      // Announce role so the other peer knows what to do
      sendSignal({ type: 'joined', role });
      // Sender initiates the offer
      if (role === 'sender') {
        createOffer();
      }
    };

    ws.current.onmessage = async (event) => {
      const signal = JSON.parse(event.data);

      if (signal.type === 'joined' && role === 'sender') {
        // Receiver joined — if we haven't created an offer yet, do it now
        // (offer may already be sent, that's OK — receiver will just answer)
      }

      if (signal.type === 'offer' && role === 'receiver') {
        await handleOffer(signal.offer);
      }

      if (signal.type === 'answer' && role === 'sender') {
        await pc.current?.setRemoteDescription(signal.answer);
      }

      if (signal.type === 'candidate') {
        try {
          if (pc.current?.remoteDescription) {
            await pc.current.addIceCandidate(signal.candidate);
          }
        } catch (_) {}
      }
    };

    ws.current.onerror = () => setStatus('error');
    ws.current.onclose = () => {};

    return () => {
      ws.current?.close();
      pc.current?.close();
    };
  }, [roomId, role]); // eslint-disable-line

  /* ── Send a Blob over DataChannel ── */
  const sendBlob = useCallback(async (blob) => {
    if (!dc.current || dc.current.readyState !== 'open') {
      throw new Error('DataChannel not open');
    }

    const buffer = await blob.arrayBuffer();
    const numChunks = Math.ceil(buffer.byteLength / CHUNK_SIZE);

    // Send total chunk count first
    dc.current.send(`TOTAL:${numChunks}`);
    setStatus('sending');

    for (let i = 0; i < buffer.byteLength; i += CHUNK_SIZE) {
      const chunk = buffer.slice(i, i + CHUNK_SIZE);
      // Wait if buffer is full (backpressure)
      while (dc.current.bufferedAmount > 16 * 1024 * 1024) {
        await new Promise(r => setTimeout(r, 50));
      }
      dc.current.send(chunk);
      setProgress(Math.round(((i + CHUNK_SIZE) / buffer.byteLength) * 100));
    }

    dc.current.send('EOF');
    setProgress(100);
    setStatus('complete');
  }, []);

  const cancel = useCallback(() => {
    ws.current?.close();
    pc.current?.close();
    setStatus('idle');
    setProgress(0);
  }, []);

  return { status, progress, receivedBlob, sendBlob, cancel };
}