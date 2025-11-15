import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mic, Type } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import TypingIndicator from './TypingIndicator';

interface Response {
  id: string;
  user_id: string;
  response_type: string;
  response_text: string;
  created_at: string;
}

interface Participant {
  user_id: string;
  display_name: string;
}

interface PartnerResponsesProps {
  sessionId: string;
  cardId: string;
  responses: Response[];
  participants: Participant[];
  presences: Record<string, any[]>;
}

const PartnerResponses = ({ sessionId, cardId, responses, participants, presences }: PartnerResponsesProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const getParticipantName = (userId: string) => {
    const participant = participants.find(p => p.user_id === userId);
    return participant?.display_name || 'Player';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredResponses = responses.filter(r => r.user_id !== currentUserId);

  // Get partner's current status from presences
  const partnerPresence = Object.values(presences)
    .flat()
    .find(p => p.user_id !== currentUserId);
  
  const showTypingIndicator = partnerPresence && 
    (partnerPresence.status === 'typing' || partnerPresence.status === 'recording');

  if (filteredResponses.length === 0) {
    return (
      <Card className="p-4 bg-muted/30 border-border">
        <p className="text-sm text-muted-foreground text-center">
          Waiting for your partner's response...
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg text-foreground">Partner's Response</h3>
      
      {showTypingIndicator && (
        <TypingIndicator 
          partnerName={getParticipantName(partnerPresence.user_id)}
          status={partnerPresence.status}
        />
      )}
      {filteredResponses.map((response) => {
        const name = getParticipantName(response.user_id);
        return (
          <Card key={response.id} className="p-4 bg-card border-border">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {response.response_type === 'audio' ? (
                      <>
                        <Mic className="w-3 h-3 mr-1" />
                        Voice
                      </>
                    ) : (
                      <>
                        <Type className="w-3 h-3 mr-1" />
                        Text
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {response.response_text}
                </p>
                <span className="text-xs text-muted-foreground">
                  {new Date(response.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default PartnerResponses;
