import { useState, useRef, useEffect } from 'react';
import { Card as CardType } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, Mic, Square, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isMicrophoneAvailable, requestMicrophoneAccess } from '@/lib/microphoneUtils';

interface GameCardProps {
  card: CardType;
  isFavorite: boolean;
  onChoice?: (choice: string) => void;
  onSayItSubmit?: (responseText: string) => void;
  onFavorite: () => void;
  responseInputComponent?: React.ReactNode;
  isFlipping?: boolean;
}
const GameCard = ({
  card,
  isFavorite,
  onChoice,
  onSayItSubmit,
  onFavorite,
  responseInputComponent,
  isFlipping = false
}: GameCardProps) => {
  const [showSayItInput, setShowSayItInput] = useState(false);
  const [sayItText, setSayItText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Reset say-it input when card changes
  useEffect(() => {
    setShowSayItInput(false);
    setSayItText('');
  }, [card.id]);

  const handleSayItClick = () => {
    console.log('[GameCard] Say it clicked, showing input');
    setShowSayItInput(true);
  };

  const handleSayItSubmit = () => {
    if (!sayItText.trim()) return;
    onSayItSubmit?.(sayItText.trim());
    setShowSayItInput(false);
    setSayItText('');
  };

  const hasMic = isMicrophoneAvailable();

  const startRecording = async () => {
    const stream = await requestMicrophoneAccess();
    if (!stream) {
      toast.error('Microphone is not available on this device');
      return;
    }

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      stream.getTracks().forEach(track => track.stop());
      await transcribeAudio(audioBlob);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Please sign in to use voice input'); return; }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ audio: base64Audio }),
        }
      );
      if (!response.ok) throw new Error('Transcription failed');
      const { text } = await response.json();
      setSayItText(prev => prev ? `${prev} ${text}` : text);
      toast.success('Audio transcribed');
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };
  const renderCardContent = () => {
    switch (card.subtype) {
      case 'this_or_that':
        return <div className="space-y-8">
            <p className="font-card text-2xl md:text-3xl leading-relaxed text-center text-foreground">
              {card.text}
            </p>
            <div className="grid grid-cols-1 gap-4">
              <Button onClick={() => onChoice?.('A')} variant="outline" className="h-auto py-5 px-6 text-lg font-card border-2 border-crimson-vivid/50 hover:border-crimson-glow hover:bg-crimson-vivid/10 text-foreground transition-all duration-300 group">
                <span className="group-hover:text-glow-soft transition-all">{card.choiceA}</span>
              </Button>
              <div className="flex items-center justify-center">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
              </div>
              <Button onClick={() => onChoice?.('B')} variant="outline" className="h-auto py-5 px-6 text-lg font-card border-2 border-crimson-vivid/50 hover:border-crimson-glow hover:bg-crimson-vivid/10 text-foreground transition-all duration-300 group">
                <span className="group-hover:text-glow-soft transition-all">{card.choiceB}</span>
              </Button>
            </div>
          </div>;
      case 'say_sip_strip':
        return <div className="space-y-8">
            <p className="font-card text-2xl md:text-3xl leading-relaxed text-center text-foreground">
              {card.text}
            </p>
            {showSayItInput ? (
              <div className="space-y-4 animate-slide-up">
                <div className="relative">
                  <textarea
                    value={sayItText}
                    onChange={(e) => setSayItText(e.target.value)}
                    placeholder="What do you want to say?"
                    className="w-full p-4 pr-14 rounded-xl border border-border/50 bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-crimson-vivid/50 focus:border-crimson-vivid/50 resize-none font-card text-lg transition-all"
                    rows={3}
                    disabled={isRecording || isTranscribing}
                    autoFocus
                  />
                  {hasMic && (
                    <Button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      variant={isRecording ? "destructive" : "ghost"}
                      size="icon"
                      className="absolute bottom-2 right-2 h-10 w-10 rounded-full"
                      disabled={isTranscribing}
                    >
                      {isTranscribing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isRecording ? (
                        <Square className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </Button>
                  )}
                </div>
                {isRecording && (
                  <p className="text-xs text-crimson-glow animate-pulse text-center">Recording... tap to stop</p>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => { setShowSayItInput(false); setSayItText(''); }}
                    className="flex-1 border-border/50"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSayItSubmit}
                    disabled={!sayItText.trim() || isTranscribing}
                    className="flex-1 bg-gradient-to-r from-crimson-vivid to-crimson-deep hover:from-crimson-glow hover:to-crimson-vivid btn-glow"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {[{
                label: 'Say it',
                icon: '💬'
              }, {
                label: 'Sip it',
                icon: '🍷'
              }, {
                label: 'Strip it',
                icon: '🔥'
              }].map(({
                label,
                icon
              }) => <Button key={label} onClick={() => label === 'Say it' ? handleSayItClick() : onChoice?.(label)} variant="outline" className="h-20 flex-col gap-1 text-sm font-card border-2 border-crimson-vivid/50 hover:border-crimson-glow hover:bg-crimson-vivid/10 text-foreground transition-all duration-300 group">
                    <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
                    <span className="group-hover:text-crimson-glow transition-colors">{label}</span>
                  </Button>)}
              </div>
            )}
          </div>;
      case 'open_ended':
      default:
        return <div className="space-y-6">
            <div className="flex items-center justify-center min-h-[140px]">
              <p className="font-card text-2xl md:text-3xl leading-relaxed text-center text-foreground px-2">
                {card.text}
              </p>
            </div>
            {responseInputComponent}
          </div>;
    }
  };
  const getSpiceColor = () => {
    switch (card.spice) {
      case 'soft':
        return 'text-teal bg-teal/10 border-teal/30';
      case 'standard':
        return 'text-gold bg-gold/10 border-gold/30';
      case 'spicy':
        return 'text-crimson-glow bg-crimson-vivid/10 border-crimson-vivid/30';
      default:
        return 'text-muted-foreground bg-muted/50 border-muted';
    }
  };
  return <div className="relative w-full max-w-2xl card-flip-container">
      {/* Glow effect behind card */}
      <div className="absolute inset-4 bg-crimson-vivid/10 rounded-3xl blur-2xl" />
      
      <div className={cn("relative card-flip", isFlipping && "flipping")}>
        {/* Card back (shown during flip) */}
        
        
        {/* Card front */}
        <div className="card-flip-front relative glass rounded-2xl border border-border/50 p-8 shadow-elevated">
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-crimson-vivid/30 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-crimson-vivid/30 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-crimson-vivid/30 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-crimson-vivid/30 rounded-br-2xl" />
        
        {/* Wax seal watermark */}
        <div className="absolute bottom-6 right-6 opacity-10">
          <div className="w-14 h-14 rounded-full bg-crimson-vivid flex items-center justify-center">
            <span className="font-display text-lg text-white">LQ</span>
          </div>
        </div>
        
        {/* Favorite button */}
        <button onClick={onFavorite} className={cn("absolute top-4 right-4 p-2.5 rounded-full transition-all duration-300 z-10 group", isFavorite ? "text-crimson-glow bg-crimson-vivid/20" : "text-muted-foreground hover:text-crimson-glow hover:bg-crimson-vivid/10")}>
          <Heart className={cn("w-6 h-6 transition-transform group-hover:scale-110", isFavorite && "fill-current")} />
        </button>
        
        {/* Spice indicator */}
        <div className={cn("absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border", getSpiceColor())}>
          {card.spice === 'spicy' && <Sparkles className="w-3 h-3 inline mr-1" />}
          {card.spice}
        </div>
        
          {/* Card content */}
          <div className="mt-12 mb-4">
            {renderCardContent()}
          </div>
        </div>
      </div>
    </div>;
};
export default GameCard;