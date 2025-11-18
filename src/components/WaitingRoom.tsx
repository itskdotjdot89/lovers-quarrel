import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Check, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WaitingRoomProps {
  sessionCode: string;
  sessionId: string;
  isHost: boolean;
  onStart: () => void;
  onCancel: () => void;
}

const WaitingRoom = ({ sessionCode, sessionId, isHost, onStart, onCancel }: WaitingRoomProps) => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadParticipants();

    const channel = supabase
      .channel(`session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          loadParticipants();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          // When session status changes to 'active', navigate to gameplay
          if (payload.new.status === 'active') {
            window.location.href = `/gameplay?session=${sessionId}`;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const loadParticipants = async () => {
    const { data } = await supabase
      .from('session_participants')
      .select('*')
      .eq('session_id', sessionId);
    
    if (data) {
      setParticipants(data);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    toast({
      title: "Code Copied!",
      description: "Share this code with your partner"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const canStart = participants.length >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Waiting Room</h2>
          <p className="text-muted-foreground">
            {isHost ? 'Share this code with your partner' : 'Waiting for host to start...'}
          </p>
        </div>

        <Card 
          className="p-6 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
          onClick={copyCode}
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Session Code (Click to Copy)</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold font-mono tracking-wider">{sessionCode}</span>
              <div className="h-8 w-8 flex items-center justify-center">
                {copied ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-2">
          <p className="text-sm font-medium">Participants ({participants.length}/2)</p>
          <div className="space-y-2">
            {participants.map((p) => (
              <Card key={p.id} className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {p.display_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <span className="text-sm">{p.display_name || 'Player'}</span>
                </div>
              </Card>
            ))}
            {participants.length < 2 && (
              <Card className="p-3 border-dashed">
                <div className="flex items-center gap-2 opacity-50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Waiting for partner...</span>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {isHost && (
            <Button
              onClick={onStart}
              disabled={!canStart}
              className="w-full"
            >
              {canStart ? 'Start Game' : 'Waiting for partner...'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default WaitingRoom;
