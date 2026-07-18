import { useRef, useState, useEffect, useCallback } from 'react';
import { SignalingClient } from '../webrtc/signaling';
import { Peer } from '../webrtc/peer';
import { TransferManager } from '../webrtc/transfer';

export function useWebRTC(roomId, role) {
  const signalingRef = useRef(null);
  const peerRef     = useRef(null);
  const transferRef = useRef(null);
  const dcRef       = useRef(null);
  const hasCreatedOffer = useRef(false);

  const [status, setStatus]           = useState('idle');
  const [progress, setProgress]       = useState(0);
  const [receivedBlob, setReceivedBlob] = useState(null);

  useEffect(() => {
    if (!roomId || !role) return;

    console.log(`[Hook] Starting — role: ${role}, room: ${roomId}`);
    setStatus('connecting');

    // ── Transfer manager ─────────────────────────────────
    const transfer = new TransferManager({
      onProgress: (pct) => setProgress(pct),
      onComplete: (blob) => {
        setReceivedBlob(blob);
        setStatus('complete');
      },
      onStateChange: (s) => setStatus(s),
    });
    transferRef.current = transfer;

    // ── Peer ─────────────────────────────────────────────
    const peer = new Peer({
      onSignal: (data) => signalingRef.current?.send(data),
      onDataChannel: (dc) => {
        dcRef.current = dc;
        transfer.attachChannel(dc);
      },
      onStateChange: (s) => setStatus(s),
    });
    peerRef.current = peer;

    // ── Signaling message handler ─────────────────────────
    const handleMessage = async (signal) => {
      if (signal.type === 'joined' && role === 'sender') {
        // Receiver just joined — now safe to create offer
        if (hasCreatedOffer.current) return;
        hasCreatedOffer.current = true;
        console.log('[Hook] Receiver joined — creating offer');
        await peer.createOffer();
      }

      if (signal.type === 'offer' && role === 'receiver') {
        console.log('[Signal] Offer received');
        await peer.handleOffer(signal.offer);
      }

      if (signal.type === 'answer' && role === 'sender') {
        console.log('[Signal] Answer received');
        await peer.handleAnswer(signal.answer);
      }

      if (signal.type === 'candidate') {
        await peer.addCandidate(signal.candidate);
      }
    };

    // ── Signaling client ──────────────────────────────────
    const signaling = new SignalingClient(roomId, handleMessage);
    signalingRef.current = signaling;

    signaling.connect().then(() => {
      // announce presence to the room
      signaling.send({ type: 'joined', role });
      console.log(`[Hook] Joined room as ${role}`);
    }).catch((e) => {
      console.error('[Hook] Failed to connect to signaling', e);
      setStatus('error');
    });

    // ── Cleanup ───────────────────────────────────────────
    return () => {
      console.log('[Hook] Cleaning up');
      signaling.disconnect();
      peer.destroy();
      transfer.reset();
      hasCreatedOffer.current = false;
    };
  }, [roomId, role]);

  // ── sendBlob — called by ActiveTransferPage ───────────
  const sendBlob = useCallback(async (blob) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== 'open') {
      console.error('[Hook] sendBlob called but DataChannel not open');
      throw new Error('DataChannel not open');
    }
    await transferRef.current.sendBlob(dc, blob);
  }, []);

  const cancel = useCallback(() => {
    console.log('[Hook] Cancelled');
    signalingRef.current?.disconnect();
    peerRef.current?.destroy();
    transferRef.current?.reset();
    setStatus('idle');
    setProgress(0);
  }, []);

  return { status, progress, receivedBlob, sendBlob, cancel };
}