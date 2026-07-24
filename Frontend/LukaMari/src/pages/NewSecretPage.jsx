import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useAuth } from '../context/AuthContext';
import { encryptMessage } from '../utils/crypto';
import { loadImageToCanvas, exportCanvasAsPNG } from '../utils/canvas';
import { encodeMessageInPixels } from '../utils/stegno';
import { deleteTransferBlob, saveTransferBlob } from '../utils/indexedDB';
import PasswordStrength from '../Components/ui/PasswordStrength';
import Avatar from '../Components/ui/Avatar';
import {
  HiOutlineSearch, HiOutlineX, HiOutlinePhotograph,
  HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff,
  HiOutlineArrowLeft,
} from 'react-icons/hi';

const MAX_CHARS = 500;

export default function NewSecretPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Receiver search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [searching, setSearching] = useState(false);

  // Image
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef();

  // Message + password
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [encoding, setEncoding] = useState(false);
  const [error, setError] = useState('');

  /* ── search users ── */
  const searchUsers = useCallback(async (q) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, email, avatar_url')
      .or(`username.ilike.%${q}%,email.ilike.%${q}%`)
      .neq('id', user.id)
      .limit(6);
    setResults(data ?? []);
    setSearching(false);
  }, [user.id]);

  function selectReceiver(u) {
    setReceiver(u);
    setQuery('');
    setResults([]);
  }

  /* ── image selection ── */
  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  }

  /* ── encode & send ── */
  async function handleEncode() {
    if (!receiver) return setError('Please select a receiver.');
    if (!imageFile) return setError('Please upload a cover image.');
    if (!message.trim()) return setError('Please enter a secret message.');
    if (!password.trim()) return setError('Please enter an encryption password.');

    setEncoding(true);
    setError('');
    let roomId;

    try {
      // 1. Encrypt message
      const encrypted = await encryptMessage(message, password);
      const payload = JSON.stringify(encrypted);

      // 2. LSB-encode into image
      const { canvas, ctx, imageData } = await loadImageToCanvas(imageFile);
      const encoded = encodeMessageInPixels(imageData, payload);
      const stegoBlob = await exportCanvasAsPNG(canvas, ctx, encoded);

      // 3. Generate room ID
      roomId = crypto.randomUUID();

      // 4. Keep the raw image locally until WebRTC sends it. IndexedDB avoids
      // sessionStorage's small string quota and Base64 size overhead.
      await saveTransferBlob(roomId, stegoBlob);

      // 5. Insert metadata into Supabase (no image, no ciphertext)
      const { data: meta, error: insertErr } = await supabase
        .from('message_metadata')
        .insert({
          sender_id: user.id,
          receiver_id: receiver.id,
          room_id: roomId,
          status: 'pending',
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // 6. Navigate to Active Transfer screen
      navigate(`/transfer/${roomId}`, { state: { metaId: meta.id, role: 'sender' } });
    } catch (err) {
      if (roomId) deleteTransferBlob(roomId).catch(() => {});
      console.error(err);
      setError(err.message ?? 'Encoding failed. Please try again.');
    } finally {
      setEncoding(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Secret</h1>
          <p className="text-gray-400 text-sm mt-0.5">Hide a message inside an image and send it securely.</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* ── 1. Receiver ── */}
       <section className="relative z-20 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center font-bold">1</span>
            Select Receiver
          </h2>

          {receiver ? (
            <div className="flex items-center gap-3 bg-cyan-600/10 border border-cyan-500/20 rounded-xl px-4 py-3">
              <Avatar name={receiver.username} avatarUrl={receiver.avatar_url} size="sm" />
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{receiver.username}</p>
                <p className="text-gray-500 text-xs">{receiver.email}</p>
              </div>
              <button
                onClick={() => setReceiver(null)}
                className="text-gray-500 hover:text-red-400 transition"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search user by name or email"
                  value={query}
                  onChange={e => searchUsers(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white
                             placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                />
              </div>
              {(results.length > 0 || searching) && (
                <div className="absolute z-10 mt-1 w-full bg-[#1a1b2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  {searching ? (
                    <div className="px-4 py-3 text-gray-500 text-sm">Searching...</div>
                  ) : results.map(u => (
                    <button
                      key={u.id}
                      onClick={() => selectReceiver(u)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-left"
                    >
                      <Avatar name={u.username} avatarUrl={u.avatar_url} size="sm" />
                      <div>
                        <p className="text-white text-sm font-medium">{u.username}</p>
                        <p className="text-gray-500 text-xs">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── 2. Cover Image ── */}
        <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center font-bold">2</span>
            Upload Cover Image
          </h2>

          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Cover"
                className="w-full h-48 object-cover rounded-xl border border-white/10"
              />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); fileInputRef.current.value = ''; }}
                className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-lg p-1.5 transition"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
              <div className="mt-2 text-xs text-gray-500">{imageFile?.name} · {(imageFile?.size / 1024).toFixed(1)} KB</div>
            </div>
          ) : (
            <label
              className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-cyan-500/50
                         rounded-xl p-10 cursor-pointer transition group"
            >
              <HiOutlinePhotograph className="w-10 h-10 text-gray-600 group-hover:text-cyan-400 transition mb-3" />
              <p className="text-gray-400 text-sm text-center">Click to upload or drag & drop</p>
              <p className="text-gray-600 text-xs mt-1">PNG, JPG up to 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          )}
        </section>

        {/* ── 3. Secret Message ── */}
        <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center font-bold">3</span>
            Secret Message
          </h2>
          <textarea
            placeholder="Type your secret message here..."
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, MAX_CHARS))}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none transition"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${message.length > MAX_CHARS * 0.9 ? 'text-amber-400' : 'text-gray-600'}`}>
              {message.length}/{MAX_CHARS}
            </span>
          </div>
        </section>

        {/* ── 4. Password ── */}
        <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center font-bold">4</span>
            Encryption Password
          </h2>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter a strong password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pr-12 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm
                         focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-cyan-400 transition"
            >
              {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
            </button>
          </div>
          <PasswordStrength password={password} />

          <p className="text-xs text-gray-600 mt-3 flex items-start gap-1.5">
            <HiOutlineLockClosed className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            This password never leaves your device. You must share it with the receiver separately.
          </p>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          id="encode-send-btn"
          onClick={handleEncode}
          disabled={encoding}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl
                     bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-base
                     shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {encoding ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Encoding & Preparing...
            </>
          ) : (
            <>
              <HiOutlineLockClosed className="w-5 h-5" />
              Encode & Send
            </>
          )}
        </button>
      </div>
    </div>
  );
}
