import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { deleteTransferBlob, getTransferBlob } from '../utils/indexedDB';
import Avatar from '../Components/ui/Avatar';
import { HiOutlineShieldCheck } from 'react-icons/hi';

const STEPS = [
  { key: 'connecting',         label: 'Connecting to receiver...' },
  { key: 'ice-established',    label: 'ICE Connection Established' },
  { key: 'webrtc-established', label: 'WebRTC Connection Established' },
  { key: 'sending',            label: 'Sending Stego Image...' },
  { key: 'complete',           label: 'Transfer Complete' },
];

const STATUS_ORDER = ['connecting', 'ice-established', 'webrtc-established', 'sending', 'complete'];

function stepDone(current, stepKey) {
  const ci = STATUS_ORDER.indexOf(current);
  const si = STATUS_ORDER.indexOf(stepKey);
  return ci > si;
}

function stepActive(current, stepKey) {
  return current === stepKey;
}

export default function ActiveTransferPage() {
  const { roomId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const role = state?.role ?? 'receiver';
  const metaId = state?.metaId;

  const [meta, setMeta] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const hasSent = useRef(false);

  const { status, progress, receivedBlob, sendBlob, cancel } = useWebRTC(roomId, role);

  /* ── Load message metadata ── */
  useEffect(() => {
    if (!roomId) return;
    supabase
      .from('message_metadata')
      .select(`
        id, status, sender_id, receiver_id,
        sender:profiles!message_metadata_sender_id_fkey(id, username, avatar_url),
        receiver:profiles!message_metadata_receiver_id_fkey(id, username, avatar_url)
      `)
      .eq('room_id', roomId)
      .single()
      .then(({ data }) => {
        if (data) {
          setMeta(data);
          setOtherUser(role === 'sender' ? data.receiver : data.sender);
        }
      });
  }, [roomId, role]);

  /* ── Sender: send blob when DataChannel is ready ── */
  useEffect(() => {
    if (role !== 'sender') return;
    if (status !== 'webrtc-established') return;
    if (hasSent.current) return;
    hasSent.current = true;

    getTransferBlob(roomId)
      .then(blob => {
        if (!blob) throw new Error('The image prepared for transfer is unavailable. Please encode it again.');
        return sendBlob(blob);
      })
      .catch(console.error);
  }, [status, role, roomId, sendBlob]);

  /* ── Update Supabase status on state changes ── */
  useEffect(() => {
    const metadataId = meta?.id ?? metaId;
    if (!metadataId) return;

    const updates = {
      'ice-established': { status: 'connecting' },
      'sending': { status: 'connecting' },
      'complete': role === 'sender'
        ? { status: 'transferred', delivered_at: new Date().toISOString() }
        : { status: 'opened', opened_at: new Date().toISOString() },
    };

    const update = updates[status];
    if (update) {
      supabase.from('message_metadata').update(update).eq('id', metadataId).then(() => {});
    }
  }, [status, meta?.id, metaId, role]);

  /* ── Receiver: navigate to decode after transfer ── */
  useEffect(() => {
    if (role === 'receiver' && status === 'complete' && receivedBlob) {
      // Store received blob temporarily
      const url = URL.createObjectURL(receivedBlob);
      sessionStorage.setItem(`received_${roomId}`, 'pending');
      sessionStorage.setItem(`received_blob_url_${roomId}`, url);
      setTimeout(() => navigate(`/decode/${roomId}`, { state: { metaId: meta?.id } }), 1200);
    }
  }, [status, receivedBlob, role, roomId, meta?.id, navigate]);

  /* ── Sender: navigate to message details after transfer ── */
  useEffect(() => {
    if (role === 'sender' && status === 'complete' && metaId) {
      // The sender's temporary image is no longer needed after transfer.
      deleteTransferBlob(roomId).catch(console.error);
      setTimeout(() => navigate(`/message/${metaId}`), 1500);
    }
  }, [status, role, roomId, metaId, navigate]);

  function handleCancel() {
    cancel();
    if (role === 'sender') deleteTransferBlob(roomId).catch(console.error);
    if (meta?.id) {
      supabase.from('message_metadata').update({ status: 'pending' }).eq('id', meta.id);
    }
    navigate(-1);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Transferring Secret</h1>
        <p className="text-gray-400 text-sm text-center mb-10">
          {role === 'sender' ? 'Sending your encrypted image...' : 'Receiving your secret...'}
        </p>

        {/* Avatar animation */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {/* You */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar name={profile?.username ?? ''} avatarUrl={profile?.avatar_url} size="xl" />
              {status !== 'idle' && status !== 'error' && (
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500 animate-ping opacity-30" />
              )}
            </div>
            <p className="text-white text-sm font-medium">You</p>
            <p className="text-gray-500 text-xs">{role === 'sender' ? 'Sender' : 'Receiver'}</p>
          </div>

          {/* Animated connecting line + shield */}
          <div className="flex-1 flex items-center justify-center relative px-4">
            <div className="w-full h-0.5 bg-gradient-to-r from-cyan-600/50 via-cyan-400 to-cyan-600/50 relative overflow-hidden rounded-full">
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent
                              ${status !== 'complete' && status !== 'error' ? 'animate-[shimmer_1.5s_ease-in-out_infinite]' : ''}`}
                   style={{ width: '60%', animation: status !== 'complete' ? 'shimmer 1.5s ease-in-out infinite' : 'none' }}
              />
            </div>
            <div className={`absolute w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500
                            ${status === 'complete'
                              ? 'bg-green-600 shadow-green-600/30'
                              : status === 'error'
                              ? 'bg-red-600 shadow-red-600/30'
                              : 'bg-cyan-600 shadow-cyan-600/30'
                            }`}>
              <HiOutlineShieldCheck className="text-white w-5 h-5" />
            </div>
          </div>

          {/* Other user */}
          <div className="flex flex-col items-center gap-2">
            <Avatar name={otherUser?.username ?? '?'} avatarUrl={otherUser?.avatar_url} size="xl" />
            <p className="text-white text-sm font-medium">{otherUser?.username ?? '...'}</p>
            <p className="text-gray-500 text-xs">{role === 'sender' ? 'Receiver' : 'Sender'}</p>
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-3 mb-5">
          {STEPS.map(({ key, label }) => {
            const done = stepDone(status, key);
            const active = stepActive(status, key);

            return (
              <div key={key} className="flex items-center gap-3">
                {/* Icon */}
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500
                                ${done ? 'bg-green-600'
                                  : active ? 'bg-cyan-600'
                                  : 'bg-white/10'}`}>
                  {done ? (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : active ? (
                    <svg className="w-2.5 h-2.5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : null}
                </div>

                {/* Label */}
                <span className={`text-sm transition-colors duration-300
                                ${done ? 'text-green-400'
                                  : active ? 'text-cyan-300 font-medium'
                                  : 'text-gray-600'}`}>
                  {label}
                </span>

                {/* Progress bar for sending step */}
                {key === 'sending' && (active || done) && (
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-white/10 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-cyan-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 tabular-nums">{progress}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status error */}
        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
            <p className="text-red-400 text-sm text-center">Connection failed. Please try again.</p>
          </div>
        )}

        {/* Cancel */}
        {status !== 'complete' && (
          <button
            onClick={handleCancel}
            className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all"
          >
            Cancel Transfer
          </button>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
