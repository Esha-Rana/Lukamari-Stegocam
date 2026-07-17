import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../context/AuthContext';

export default function AppShell() {
  const { user } = useAuth();
  const [inboxCount, setInboxCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Initial count of unread (transferred = waiting to be opened)
    supabase
      .from('message_metadata')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .in('status', ['pending', 'transferred'])
      .then(({ count }) => setInboxCount(count ?? 0));

    // Realtime subscription to update badge
    const channel = supabase
      .channel('inbox-badge')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_metadata', filter: `receiver_id=eq.${user.id}` },
        () => {
          supabase
            .from('message_metadata')
            .select('id', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .in('status', ['pending', 'transferred'])
            .then(({ count }) => setInboxCount(count ?? 0));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white flex">
      <Sidebar inboxCount={inboxCount} />
      {/* Main content — offset by sidebar width */}
      <main className="flex-1 ml-64 min-h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
