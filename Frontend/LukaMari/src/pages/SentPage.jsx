import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../Components/ui/Avatar';
import StatusBadge from '../Components/ui/StatusBadge';
import { HiOutlineArrowRight } from 'react-icons/hi';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('message_metadata')
      .select(`
        id, status, created_at, delivered_at, opened_at, room_id,
        receiver:profiles!message_metadata_receiver_id_fkey(id, username, avatar_url)
      `)
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setMessages(data ?? []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Sent</h1>
        <p className="text-gray-400 text-sm mt-0.5">Messages you have sent.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : messages.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-16 text-center">
          <div className="text-4xl mb-3"></div>
          <p className="text-gray-400 text-sm">You haven't sent any secrets yet.</p>
          <button
            onClick={() => navigate('/new-secret')}
            className="mt-4 text-cyan-400 text-sm hover:text-cyan-300 transition"
          >
            Send your first secret →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-cyan-500/30
                         rounded-2xl px-5 py-4 flex items-center gap-4 transition-all group cursor-pointer"
              onClick={() => navigate(`/message/${msg.id}`)}
            >
              <Avatar
                name={msg.receiver?.username ?? '?'}
                avatarUrl={msg.receiver?.avatar_url}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-semibold text-sm">To: {msg.receiver?.username ?? 'Unknown'}</p>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{timeAgo(msg.created_at)}</span>
                </div>
                <p className="text-gray-600 text-xs">LK-{msg.id?.slice(0, 5).toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={msg.status} />
                <HiOutlineArrowRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
