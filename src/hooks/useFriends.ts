import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FriendLink {
  id: string;
  owner_user_id: string;
  friend_user_id: string | null;
  friend_email: string | null;
  friend_display_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useFriends() {
  const [friends, setFriends] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('friend_links' as any)
      .select('*')
      .in('status', ['linked', 'pending', 'blocked'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching friends:', error);
    } else {
      setFriends((data as unknown as FriendLink[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const addFriend = async (type: 'email' | 'username', value: string) => {
    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke('add-friend', {
        body: { type, value },
      });

      if (error) throw error;

      toast({
        title: 'Done!',
        description: data?.message || "Friend request sent.",
      });
      await fetchFriends();
    } catch (err) {
      console.error('Add friend error:', err);
      toast({
        title: 'Something went wrong',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const removeFriend = async (id: string) => {
    const { error } = await supabase
      .from('friend_links' as any)
      .update({ status: 'removed' } as any)
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Could not remove friend.', variant: 'destructive' });
    } else {
      toast({ title: 'Friend removed' });
      setFriends((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const blockFriend = async (id: string) => {
    const { error } = await supabase
      .from('friend_links' as any)
      .update({ status: 'blocked' } as any)
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Could not block friend.', variant: 'destructive' });
    } else {
      toast({ title: 'Friend blocked' });
      setFriends((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'blocked' } : f))
      );
    }
  };

  return { friends, loading, adding, addFriend, removeFriend, blockFriend, refetch: fetchFriends };
}
