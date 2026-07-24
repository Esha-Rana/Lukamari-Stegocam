import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../Components/ui/Avatar';
import StatusBadge from '../Components/ui/StatusBadge';
import { HiOutlineFilter, HiOutlineArrowRight } from 'react-icons/hi';

const TABS = ['All', 'Waiting', 'Delivered', 'Read'];

const TAB_FILTERS = {
  All:       null,
  Waiting:   ['pending', 'transferred'],
  Delivered: ['opened'],
  Read:      ['completed'],
};

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

function shortId(id) {
  return `LK-${id?.slice(0, 5).toUpperCase() ?? '?????'}`;
}

export default function InboxPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('All');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── Fetch messages ── */
  async function fetchMessages() {
    setLoading(true);
    const filter = TAB_FILTERS[tab];
    let query = supabase
      .from('message_metadata')
      .select(`
        id, status, created_at, room_id, delivered_at, opened_at,
        sender:profiles!message_metadata_sender_id_fkey(id, username, avatar_url)
      `)
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });

    if (filter) query = query.in('status', filter);

    const { data } = await query;
    setMessages(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    fetchMessages();
  }, [user, tab]); // eslint-disable-line

  /* ── Realtime subscription ── */
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('inbox-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_metadata',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, tab]); // eslint-disable-line

  /* ── Open a message (receiver) ── */
  async function handleOpen(msg) {
    // Update status to connecting
    await supabase
      .from('message_metadata')
      .update({ status: 'connecting' })
      .eq('id', msg.id);

    navigate(`/transfer/${msg.room_id}`, {
      state: { metaId: msg.id, role: 'receiver' }
    });
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Inbox</h1>
          <p className="text-gray-400 text-sm mt-0.5">Your received secret messages.</p>
        </div>
        <button className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">
          <HiOutlineFilter className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === t
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Messages list */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : messages.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-16 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-400 text-sm">No messages in this tab.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-cyan-500/30
                         rounded-2xl px-5 py-4 flex items-center gap-4 transition-all group"
            >
              {/* Avatar */}
              <Avatar
                name={msg.sender?.username ?? '?'}
                avatarUrl={msg.sender?.avatar_url}
                size="md"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-semibold text-sm">{msg.sender?.username ?? 'Unknown'}</p>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{timeAgo(msg.created_at)}</span>
                </div>
                <p className="text-gray-600 text-xs">Message ID: {shortId(msg.id)}</p>
              </div>

              {/* Status + Open */}
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={msg.status} />
                <button
                  id={`open-msg-${msg.id}`}
                  onClick={() => handleOpen(msg)}
                  className="flex items-center gap-1.5 bg-cyan-600/20 hover:bg-cyan-600 border border-cyan-500/30
                             text-cyan-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                >
                  Open
                  <HiOutlineArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
