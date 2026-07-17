import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../Components/ui/Avatar';
import StatusBadge from '../Components/ui/StatusBadge';
import { HiOutlineArrowLeft, HiOutlineTrash } from 'react-icons/hi';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function MessageDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('message_metadata')
      .select(`
        id, status, created_at, delivered_at, opened_at, room_id, sender_id,
        sender:profiles!message_metadata_sender_id_fkey(id, username, avatar_url),
        receiver:profiles!message_metadata_receiver_id_fkey(id, username, avatar_url)
      `)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setMeta(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>
    );
  }

  if (!meta) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">Message not found.</div>
    );
  }

  const isSender = meta.sender_id === user?.id;
  const other = isSender ? meta.receiver : meta.sender;

  const timeline = [
    { label: 'Sent',      date: meta.created_at,   done: !!meta.created_at },
    { label: 'Delivered', date: meta.delivered_at,  done: !!meta.delivered_at },
    { label: 'Opened',    date: meta.opened_at,     done: !!meta.opened_at },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">Message Details</h1>
        </div>
        <button className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition">
          <HiOutlineTrash className="w-5 h-5" />
        </button>
      </div>

      {/* Meta header card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5 grid grid-cols-3 gap-4">
        <div>
          <p className="text-gray-500 text-xs mb-2">From</p>
          <div className="flex items-center gap-2">
            <Avatar name={meta.sender?.username ?? '?'} avatarUrl={meta.sender?.avatar_url} size="sm" />
            <p className="text-white font-semibold text-sm">{meta.sender?.username}</p>
          </div>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-2">Message ID</p>
          <p className="text-purple-400 font-mono text-sm">LK-{meta.id?.slice(0, 5).toUpperCase()}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs mb-2">Status</p>
          <StatusBadge status={meta.status} />
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
        <h2 className="text-white font-semibold text-sm mb-5">Timeline</h2>
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-white/10" />

          <div className="space-y-5">
            {timeline.map(({ label, date, done }) => (
              <div key={label} className="flex items-start gap-4 relative">
                {/* Dot */}
                <div className={`absolute -left-4 w-3 h-3 rounded-full mt-0.5 border-2 transition-colors
                                ${done ? 'bg-purple-500 border-purple-500' : 'bg-transparent border-white/20'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${done ? 'text-white' : 'text-gray-600'}`}>{label}</p>
                  <p className={`text-xs mt-0.5 ${done ? 'text-gray-400' : 'text-gray-700'}`}>
                    {formatDate(date)}
                  </p>
                </div>
                {done && (
                  <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Encryption details */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
        <h2 className="text-white font-semibold text-sm mb-4">Cover Image & Encryption</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">Encryption</p>
            <p className="text-purple-300 font-semibold text-sm">AES-256-GCM</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">Method</p>
            <p className="text-purple-300 font-semibold text-sm">LSB (Least Significant Bit)</p>
          </div>
        </div>
        <p className="text-gray-600 text-xs mt-3 leading-relaxed">
          This message was encrypted entirely in the browser using WebCrypto API and transferred directly peer-to-peer. No sensitive data ever touched any server.
        </p>
      </div>

      {/* Receiver info */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="text-white font-semibold text-sm mb-4">{isSender ? 'Recipient' : 'Sender'}</h2>
        <div className="flex items-center gap-3">
          <Avatar name={other?.username ?? '?'} avatarUrl={other?.avatar_url} size="md" />
          <div>
            <p className="text-white font-semibold text-sm">{other?.username}</p>
            <p className="text-gray-500 text-xs">Transferred via P2P WebRTC</p>
          </div>
        </div>
      </div>
    </div>
  );
}
