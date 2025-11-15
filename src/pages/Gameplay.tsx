import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, SkipForward, Users } from 'lucide-react';
import GameCard from '@/components/GameCard';
import ResponseDialog from '@/components/ResponseDialog';
import AIAnalysisDialog from '@/components/AIAnalysisDialog';
import MultiplayerResponseInput from '@/components/MultiplayerResponseInput';
import PartnerResponses from '@/components/PartnerResponses';
import { SEED_CARDS } from '@/data/seedCards';
import { Card as CardType } from '@/types/game';
import { loadFavorites, saveFavorites, toggleFavorite } from '@/lib/gameLogic';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { usePresence } from '@/hooks/usePresence';

const Gameplay = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [currentCard, setCurrentCard] = useState<CardType | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [totalCards, setTotalCards] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState('');
  const { presences, updateStatus } = usePresence(sessionId);

  useEffect(() => {
    if (sessionId) {
      loadMultiplayerSession();
      subscribeToSession();
    } else {
      loadSoloSession();
    }
    setFavorites(loadFavorites());
  }, [sessionId]);

  const loadSoloSession = () => {
    const configStr = localStorage.getItem('lq_session_config');
    if (!configStr) {
      navigate('/decks');
      return;
    }
    const config = JSON.parse(configStr);
    const cards = SEED_CARDS.filter(c => config.deckIds.includes(c.deckId));
    setTotalCards(cards.length);
    setCurrentCard(cards[0]);
  };

  const loadMultiplayerSession = async () => {
    if (!sessionId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: session } = await supabase.from('game_sessions').select('*').eq('id', sessionId).single();
    if (!session) return;

    setIsHost(session.host_id === user.id);
    setCurrentIndex(session.current_card_index);

    const { data: cards } = await supabase.from('session_cards').select('*').eq('session_id', sessionId).order('card_order');
    if (cards) {
      setTotalCards(cards.length);
      const card = SEED_CARDS.find(c => c.id === cards[session.current_card_index]?.card_id);
      setCurrentCard(card || null);
    }

    const { data: parts } = await supabase.from('session_participants').select('*').eq('session_id', sessionId);
    if (parts) {
      setParticipants(parts);
      const currentParticipant = parts.find(p => p.user_id === user.id);
      if (currentParticipant?.display_name) {
        setCurrentUserDisplayName(currentParticipant.display_name);
      }
    }
    
    await loadResponses();
  };

  const loadResponses = async () => {
    if (!sessionId || !currentCard) return;
    const { data } = await supabase
      .from('session_responses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('card_id', currentCard.id)
      .order('created_at', { ascending: true });
    if (data) setResponses(data);
  };

  useEffect(() => {
    if (sessionId && currentCard) {
      loadResponses();
    }
  }, [sessionId, currentCard]);

  const subscribeToSession = () => {
    if (!sessionId) return;
    const channel = supabase.channel(`game_${sessionId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'game_sessions', 
        filter: `id=eq.${sessionId}` 
      }, () => loadMultiplayerSession())
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'session_responses', 
        filter: `session_id=eq.${sessionId}` 
      }, () => loadResponses())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const handleNext = async () => {
    if (sessionId && !isHost) {
      toast.error('Only host can advance');
      return;
    }
    if (sessionId) {
      await supabase.from('game_sessions').update({ current_card_index: currentIndex + 1 }).eq('id', sessionId);
    }
  };

  const handleFavorite = () => {
    if (!currentCard) return;
    const newFavorites = toggleFavorite(currentCard.id, favorites);
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
    toast.success(newFavorites.includes(currentCard.id) ? 'Added to favorites' : 'Removed from favorites');
  };

  if (!currentCard) return <div className="min-h-screen bg-background flex items-center justify-center"><p>Loading...</p></div>;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}><ArrowLeft className="w-5 h-5" /></Button>
          {sessionId && <Card className="px-4 py-2 flex items-center gap-2"><Users className="w-4 h-4" /><span className="text-sm">{participants.length} Players</span></Card>}
          <div className="text-sm">{currentIndex + 1} / {totalCards}</div>
        </div>
        <div className="flex flex-col items-center">
          <GameCard 
            card={currentCard} 
            isFavorite={favorites.includes(currentCard.id)} 
            onFavorite={handleFavorite}
            onChoice={currentCard.subtype === 'this_or_that' ? async (choice) => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user || !sessionId) return;
              await supabase.from('session_responses').insert({
                session_id: sessionId,
                card_id: currentCard.id,
                user_id: user.id,
                response_type: 'choice',
                choice: choice
              });
              toast.success(`You chose: ${choice === 'A' ? currentCard.choiceA : currentCard.choiceB}`);
            } : undefined}
            showResponseInput={sessionId && currentCard.subtype === 'open_ended'}
            responseInputComponent={
              sessionId && currentCard.subtype === 'open_ended' ? (
                <MultiplayerResponseInput
                  sessionId={sessionId}
                  cardId={currentCard.id}
                  onResponseSubmitted={loadResponses}
                  onStatusChange={(status) => updateStatus(status, currentUserDisplayName)}
                />
              ) : undefined
            }
          />
          
          {sessionId && (
            <div className="mt-6 w-full max-w-2xl">
              <PartnerResponses
                sessionId={sessionId}
                cardId={currentCard.id}
                responses={responses}
                participants={participants}
                presences={presences}
              />
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <Button onClick={() => handleNext()} disabled={sessionId && !isHost}>Next Card</Button>
          </div>
        </div>
      </div>
      <ResponseDialog open={showResponseDialog} onOpenChange={setShowResponseDialog} cardId={currentCard.id} questionText={currentCard.text} onAnalysisComplete={(text, sentiment, themes) => setCurrentAnalysis({ text, sentiment, themes })} />
      <AIAnalysisDialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog} analysis={currentAnalysis} />
    </div>
  );
};

export default Gameplay;
