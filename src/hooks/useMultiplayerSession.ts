import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DeckMood, CardSubtype, SpiceLevel } from '@/types/game';

export const useMultiplayerSession = (sessionId: string | null) => {
  const [session, setSession] = useState<any>(null);
  const [currentCard, setCurrentCard] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    loadSession();
    subscribeToSession();
  }, [sessionId]);

  const loadSession = async () => {
    if (!sessionId) return;

    const { data: sessionData } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionData) {
      setSession(sessionData);
      await loadCurrentCard(sessionData.current_card_index);
      await loadResponses();
    }
    setLoading(false);
  };

  const loadCurrentCard = async (cardIndex: number) => {
    if (!sessionId) return;

    const { data } = await supabase
      .from('session_cards')
      .select('*')
      .eq('session_id', sessionId)
      .eq('card_order', cardIndex)
      .single();

    if (data) {
      setCurrentCard(data);
    }
  };

  const loadResponses = async () => {
    if (!sessionId || !currentCard) return;

    const { data } = await supabase
      .from('session_responses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('card_id', currentCard.card_id);

    if (data) {
      setResponses(data);
    }
  };

  const subscribeToSession = () => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`game_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          setSession(payload.new);
          loadCurrentCard(payload.new.current_card_index);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_responses',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          loadResponses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const submitResponse = async (responseData: {
    response_type: string;
    response_text?: string;
    choice?: string;
  }) => {
    if (!sessionId || !currentCard) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('session_responses')
      .insert({
        session_id: sessionId,
        card_id: currentCard.card_id,
        user_id: user.id,
        ...responseData
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit response",
        variant: "destructive"
      });
    }
  };

  const nextCard = async () => {
    if (!sessionId || !session) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== session.host_id) return;

    const { error } = await supabase
      .from('game_sessions')
      .update({ current_card_index: session.current_card_index + 1 })
      .eq('id', sessionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to advance to next card",
        variant: "destructive"
      });
    }
  };

  return {
    session,
    currentCard,
    responses,
    loading,
    submitResponse,
    nextCard
  };
};
