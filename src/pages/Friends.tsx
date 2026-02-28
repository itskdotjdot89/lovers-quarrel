import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useFriends, FriendLink } from '@/hooks/useFriends';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserPlus, Search, SortAsc, Clock, Trash2, Ban, Users, Mail, AtSign } from 'lucide-react';

const Friends = () => {
  const navigate = useNavigate();
  const { friends, loading, adding, addFriend, removeFriend, blockFriend } = useFriends();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [inputMode, setInputMode] = useState<'email' | 'username'>('email');
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setAuthed(true);
      }
    });
  }, [navigate]);

  if (authed === null) return null;

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    addFriend(inputMode, inputValue.trim());
    setInputValue('');
  };

  const visibleFriends = friends
    .filter((f) => f.status !== 'removed')
    .filter((f) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        f.friend_display_name?.toLowerCase().includes(q) ||
        f.friend_email?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'alpha') {
        const nameA = (a.friend_display_name || a.friend_email || '').toLowerCase();
        const nameB = (b.friend_display_name || b.friend_email || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const statusBadge = (status: string) => {
    switch (status) {
      case 'linked':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Linked</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Pending</Badge>;
      case 'blocked':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Blocked</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-game p-4 flex flex-col">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-crimson-vivid/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 py-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/home')}
            className="border-border/50 hover:border-crimson-vivid/50 hover:bg-crimson-vivid/10 rounded-full w-10 h-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl text-foreground">Friends</h1>
            <p className="text-sm text-muted-foreground">Your private circle</p>
          </div>
        </div>

        {/* Add Friend */}
        <div className="glass rounded-xl border border-border/50 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-crimson-glow" />
            <h2 className="font-display text-lg text-foreground">Add a friend</h2>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setInputMode('email')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                inputMode === 'email'
                  ? 'bg-crimson-vivid/20 text-crimson-glow border border-crimson-vivid/40'
                  : 'bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </button>
            <button
              onClick={() => setInputMode('username')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                inputMode === 'username'
                  ? 'bg-crimson-vivid/20 text-crimson-glow border border-crimson-vivid/40'
                  : 'bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted'
              }`}
            >
              <AtSign className="w-3.5 h-3.5" />
              Username
            </button>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={inputMode === 'email' ? 'Enter their email...' : 'Enter their username...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="bg-background/50 border-border/50 focus:border-crimson-vivid/50"
            />
            <Button
              onClick={handleAdd}
              disabled={adding || !inputValue.trim()}
              className="bg-crimson-vivid hover:bg-crimson-deep text-white shrink-0"
            >
              {adding ? '...' : 'Add'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            {inputMode === 'email'
              ? "If they have an account, they'll appear in your list."
              : "Enter an exact username to find them."}
          </p>
        </div>

        {/* Search + Sort */}
        {friends.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 border-border/50 focus:border-crimson-vivid/50"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortBy(sortBy === 'recent' ? 'alpha' : 'recent')}
              className="border-border/50 hover:border-crimson-vivid/50 w-10 h-10"
              title={sortBy === 'recent' ? 'Sort A-Z' : 'Sort by recent'}
            >
              {sortBy === 'recent' ? <SortAsc className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </Button>
          </div>
        )}

        {/* Friends List */}
        <div className="flex-1 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : visibleFriends.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-crimson-vivid/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-crimson-glow/50" />
              </div>
              <h3 className="font-display text-xl text-foreground mb-2">No friends yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Add someone special to your circle. Your list is completely private — only you can see it.
              </p>
            </div>
          ) : (
            visibleFriends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                statusBadge={statusBadge}
                onRemove={removeFriend}
                onBlock={blockFriend}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

function FriendCard({
  friend,
  statusBadge,
  onRemove,
  onBlock,
}: {
  friend: FriendLink;
  statusBadge: (s: string) => React.ReactNode;
  onRemove: (id: string) => void;
  onBlock: (id: string) => void;
}) {
  const displayName = friend.friend_display_name || friend.friend_email || 'Unknown';

  return (
    <div className="glass rounded-xl border border-border/50 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-crimson-vivid/15 flex items-center justify-center shrink-0">
        <span className="font-display text-lg text-crimson-glow">
          {displayName[0]?.toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{displayName}</span>
          {statusBadge(friend.status)}
        </div>
        {friend.friend_email && friend.friend_display_name && (
          <p className="text-xs text-muted-foreground truncate">{friend.friend_email}</p>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        {friend.status !== 'blocked' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onBlock(friend.id)}
            className="w-8 h-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
            title="Block"
          >
            <Ban className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(friend.id)}
          className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Remove"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default Friends;
