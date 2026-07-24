import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../Components/ui/Avatar';
import { HiOutlinePencil, HiOutlineCamera, HiOutlineCheck } from 'react-icons/hi';

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const [form, setForm] = useState({ username: '', email: '' });
  const [stats, setStats] = useState({ sent: 0, received: 0 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  /* ── Populate form from profile ── */
  useEffect(() => {
    if (profile) {
      setForm({ username: profile.username ?? '', email: profile.email ?? '' });
    }
  }, [profile]);

  /* ── Load stats ── */
  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('message_metadata').select('id', { count: 'exact', head: true }).eq('sender_id', user.id),
      supabase.from('message_metadata').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id),
    ]).then(([sentRes, recRes]) => {
      setStats({ sent: sentRes.count ?? 0, received: recRes.count ?? 0 });
    });
  }, [user]);

  /* ── Save profile ── */
  async function handleSave() {
    if (!form.username.trim()) return setError('Username is required.');
    setSaving(true);
    setError('');
    try {
      await updateProfile({ username: form.username.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  /* ── Avatar upload ── */
  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Select an image file.');
    setUploading(true);
    setError('');
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await updateProfile({ avatar_url: publicUrl });
    } catch (err) {
      setError(err.message ?? 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <button className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">
          <HiOutlinePencil className="w-5 h-5" />
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <Avatar
            name={profile?.username ?? ''}
            avatarUrl={profile?.avatar_url}
            size="xl"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-cyan-600 hover:bg-cyan-500
                       flex items-center justify-center border-2 border-[#0a0b14] transition disabled:opacity-50"
          >
            {uploading
              ? <svg className="w-3 h-3 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              : <HiOutlineCamera className="w-3.5 h-3.5 text-white" />
            }
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <h2 className="text-white font-bold text-xl mt-4">{profile?.username ?? '—'}</h2>
        <p className="text-gray-400 text-sm">{profile?.email ?? '—'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Member Since',        value: memberSince },
          { label: 'Messages Sent',       value: stats.sent },
          { label: 'Messages Received',   value: stats.received },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-white font-bold text-lg">{value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm">Edit Profile</h2>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
          <input
            type="text"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-sm cursor-not-allowed"
          />
          <p className="text-gray-600 text-xs mt-1">Email cannot be changed here.</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm
                     transition-all shadow-lg shadow-cyan-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saved ? (
            <><HiOutlineCheck className="w-4 h-4" /> Changes Saved</>
          ) : saving ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Saving...</>
          ) : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
