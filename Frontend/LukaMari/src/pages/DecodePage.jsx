import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { decryptMessage } from '../utils/crypto';
import { loadImageToCanvas } from '../utils/canvas';
import { decodeMessageFromPixels } from '../utils/stegno';
import Avatar from '../Components/ui/Avatar';
import { HiOutlineArrowLeft, HiOutlineEye, HiOutlineEyeOff, HiOutlineLockOpen } from 'react-icons/hi';

function blobUrlToFile(blobUrl) {
  return fetch(blobUrl)
    .then(r => r.blob())
    .then(blob => new File([blob], 'received.png', { type: blob.type }));
}

export default function DecodePage() {
  const { roomId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const metaId = state?.metaId;

  const [meta, setMeta] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  /* ── Load metadata ── */
  useEffect(() => {
    if (!roomId) return;
    supabase
      .from('message_metadata')
      .select(`
        id, status, created_at, opened_at,
        sender:profiles!message_metadata_sender_id_fkey(id, username, avatar_url, email)
      `)
      .eq('room_id', roomId)
      .single()
      .then(({ data }) => setMeta(data));
  }, [roomId]);

  /* ── Get received image from sessionStorage ── */
  useEffect(() => {
    const blobUrl = sessionStorage.getItem(`received_blob_url_${roomId}`);
    if (blobUrl) {
      setImageUrl(blobUrl);
    }
  }, [roomId]);

  /* ── Block timer ── */
  useEffect(() => {
    if (!blocked || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setBlocked(false);
          setAttempts(0);
          setError('You can try again.');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [blocked, timeLeft]);

  /* ── Decode ── */
  async function handleDecode() {
    if (blocked) return;
    if (!imageUrl) return setError('No image to decode.');
    if (!password) return setError('Enter the decryption password.');

    setLoading(true);
    setError('');

    try {
      const file = await blobUrlToFile(imageUrl);
      const { imageData } = await loadImageToCanvas(file);
      const extracted = decodeMessageFromPixels(imageData);
      const data = JSON.parse(extracted.trim());
      const decrypted = await decryptMessage(data, password);

      setResult(decrypted);
      setAttempts(0);
      setBlocked(false);

      // Update status to completed
      if (metaId || meta?.id) {
        await supabase
          .from('message_metadata')
          .update({
            status: 'completed',
            opened_at: new Date().toISOString(),
          })
          .eq('id', metaId ?? meta.id);
      }

      // Cleanup
      sessionStorage.removeItem(`received_blob_url_${roomId}`);
      sessionStorage.removeItem(`received_${roomId}`);
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setBlocked(true);
        setTimeLeft(30);
        setError(' Too many attempts. Locked for 30 seconds.');
      } else {
        setError(` Wrong password. ${3 - newAttempts} attempt${3 - newAttempts !== 1 ? 's' : ''} left.`);
      }
    } finally {
      setLoading(false);
    }
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} mins ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/inbox')}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">Decode Message</h1>
      </div>

      {/* Sender metadata */}
      {meta && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5 grid grid-cols-3 gap-4">
          <div>
            <p className="text-gray-500 text-xs mb-1">From</p>
            <div className="flex items-center gap-2">
              <Avatar name={meta.sender?.username ?? '?'} avatarUrl={meta.sender?.avatar_url} size="sm" />
              <p className="text-white font-semibold text-sm">{meta.sender?.username ?? 'Unknown'}</p>
            </div>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Message ID</p>
            <p className="text-cyan-400 font-mono text-sm">LK-{meta.id?.slice(0, 5).toUpperCase()}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Received</p>
            <p className="text-gray-300 text-sm">{timeAgo(meta.created_at)}</p>
          </div>
        </div>
      )}

      {/* Received image */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
        <h2 className="text-white font-semibold mb-4 text-sm">Received Image</h2>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Received stego"
            className="w-full max-h-64 object-contain rounded-xl border border-white/10"
          />
        ) : (
          <div className="h-48 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl">
            <p className="text-gray-600 text-sm">Waiting for image...</p>
          </div>
        )}
      </div>

      {/* Password + Decode */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
        <h2 className="text-white font-semibold mb-4 text-sm">Enter Password</h2>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Decryption password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={blocked || !!result}
            onKeyDown={e => e.key === 'Enter' && handleDecode()}
            className="w-full pr-12 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 transition disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-cyan-400 transition"
          >
            {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
          </button>
        </div>

        {attempts > 0 && !blocked && (
          <p className="text-amber-400 text-xs mt-2">Attempts remaining: {3 - attempts}</p>
        )}
        {blocked && (
          <p className="text-red-400 text-xs mt-2">🔒 Try again in {timeLeft} seconds</p>
        )}
        {error && !blocked && (
          <p className="text-red-400 text-xs mt-2">{error}</p>
        )}
      </div>

      <button
        id="decode-btn"
        onClick={handleDecode}
        disabled={loading || blocked || !!result || !imageUrl}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                   bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm
                   shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-5"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Decoding...
          </>
        ) : (
          <>
            <HiOutlineLockOpen className="w-4 h-4" />
            Decode
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-green-400 font-semibold text-sm">Message Revealed</p>
          </div>
          <p className="text-white text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-xl p-4">
            {result}
          </p>
        </div>
      )}
    </div>
  );
}
