import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../Components/ui/Avatar';
import StatusBadge from '../Components/ui/StatusBadge';
import { HiOutlinePlus, HiOutlineInbox, HiOutlineArrowRight } from 'react-icons/hi';

function StatCard({ label, value, color = 'purple', icon }) {
  const colors = {
    purple: 'from-purple-600/20 to-purple-800/10 border-purple-500/20 text-purple-400',
    blue:   'from-blue-600/20 to-blue-800/10 border-blue-500/20 text-blue-400',
    green:  'from-green-600/20 to-green-800/10 border-green-500/20 text-green-400',
    amber:  'from-amber-600/20 to-amber-800/10 border-amber-500/20 text-amber-400',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-4xl font-bold ${colors[color].split(' ')[3]}`}>{value}</p>
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ inbox: 0, sent: 0, delivered: 0, read: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);

    // Fetch counts
    const [inboxRes, sentRes, deliveredRes, readRes] = await Promise.all([
      supabase.from('message_metadata').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id),
      supabase.from('message_metadata').select('id', { count: 'exact', head: true }).eq('sender_id', user.id),
      supabase.from('message_metadata').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id).not('delivered_at', 'is', null),
      supabase.from('message_metadata').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('status', 'completed'),
    ]);

    setStats({
      inbox: inboxRes.count ?? 0,
      sent: sentRes.count ?? 0,
      delivered: deliveredRes.count ?? 0,
      read: readRes.count ?? 0,
    });

    // Fetch recent conversations
    const { data } = await supabase
      .from('message_metadata')
      .select(`
        id, status, created_at, room_id,
        sender:profiles!message_metadata_sender_id_fkey(id, username, avatar_url),
        receiver:profiles!message_metadata_receiver_id_fkey(id, username, avatar_url)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(5);

    setRecent(data ?? []);
    setLoading(false);
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, <span className="text-purple-400">{profile?.username ?? 'User'}</span>
          </h1>
          <p className="text-gray-400 mt-1">Send and receive secret messages securely.</p>
        </div>
        <button
          onClick={() => navigate('/new-secret')}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl
                     text-sm font-semibold transition-all shadow-lg shadow-purple-600/30"
        >
          <HiOutlinePlus className="w-5 h-5" />
          New Secret
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Inbox"     value={stats.inbox}     color="purple"  />
        <StatCard label="Sent"      value={stats.sent}      color="blue"  />
        <StatCard label="Delivered" value={stats.delivered} color="green"   />
        <StatCard label="Read"      value={stats.read}      color="amber"  />
      </div>

      {/* Recent Conversations */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <HiOutlineInbox className="w-5 h-5 text-purple-400" />
            Recent Conversations
          </h2>
          <button
            onClick={() => navigate('/inbox')}
            className="text-purple-400 text-sm hover:text-purple-300 transition flex items-center gap-1"
          >
            View all <HiOutlineArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-gray-500">Loading...</div>
        ) : recent.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-gray-500 text-sm">No conversations yet.</p>
            <button
              onClick={() => navigate('/new-secret')}
              className="mt-3 text-purple-400 text-sm hover:text-purple-300 transition"
            >
              Send your first secret →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recent.map(msg => {
              const isSender = msg.sender?.id === user.id;
              const other = isSender ? msg.receiver : msg.sender;
              const label = isSender ? 'New' : null;
              return (
                <div
                  key={msg.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition cursor-pointer group"
                  onClick={() => navigate(`/message/${msg.id}`)}
                >
                  <Avatar name={other?.username ?? '?'} avatarUrl={other?.avatar_url} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium text-sm truncate">{other?.username ?? 'Unknown'}</p>
                      {label && (
                        <span className="bg-purple-600/30 text-purple-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                          {label}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{timeAgo(msg.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={msg.status} />
                    <HiOutlineArrowRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    
    </div>
  );
}
