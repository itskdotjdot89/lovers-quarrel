import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  user_id: string;
  status: 'idle' | 'typing' | 'recording';
  display_name: string;
}

export const usePresence = (sessionId: string | null) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [presences, setPresences] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!sessionId) return;

    const presenceChannel = supabase.channel(`presence_${sessionId}`, {
      config: { presence: { key: sessionId } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setPresences(state);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe();

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [sessionId]);

  const updateStatus = async (status: 'idle' | 'typing' | 'recording', displayName: string) => {
    if (!channel) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await channel.track({
      user_id: user.id,
      status,
      display_name: displayName
    });
  };

  return { presences, updateStatus };
};
