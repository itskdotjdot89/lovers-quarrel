import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Square, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DeckMood } from '@/types/game';
import { loadAnalysisConfig, AnalysisDepth } from '@/lib/aiAnalysisConfig';
import { isMicrophoneAvailable, requestMicrophoneAccess } from '@/lib/microphoneUtils';

interface OpenEndedInputProps {
  cardId: string;
  questionText: string;
  deckId?: DeckMood;
  onAnalysisComplete: (analysis: string, sentiment: string, themes: string[]) => void;
  couplesMode?: boolean;
  onSubmitOnly?: (text: string) => void;
}

const OpenEndedInput = ({ cardId, questionText, deckId, onAnalysisComplete, couplesMode, onSubmitOnly }: OpenEndedInputProps) => {
  const [responseText, setResponseText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone');
    }
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
      if (!session) {
        toast.error('Please sign in to use voice input');
        return;
      }

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
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

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const { text } = await response.json();
      setResponseText(prev => prev ? `${prev} ${text}` : text);
      toast.success('Audio transcribed');
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSubmit = async () => {
    if (!responseText.trim()) {
      toast.error('Please provide a response');
      return;
    }

    // In couples mode, just submit the text without individual AI analysis
    if (couplesMode && onSubmitOnly) {
      onSubmitOnly(responseText.trim());
      setResponseText('');
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to use AI analysis');
        return;
      }

      const config = loadAnalysisConfig();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-response`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            responseText,
            cardId,
            questionText,
            deckId,
            depth: config.depth,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const { analysis, sentiment, keyThemes } = await response.json();
      
      onAnalysisComplete(analysis, sentiment, keyThemes);
      setResponseText('');
      toast.success('Analysis complete!');
      
    } catch (error) {
      console.error('Error analyzing response:', error);
      toast.error('Failed to analyze response');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isLoading = isRecording || isTranscribing || isAnalyzing;

  return (
    <div className="space-y-4 w-full">
      <div className="relative">
        <Textarea
          placeholder="Share your thoughts..."
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          className="min-h-[100px] pr-14 font-ui text-sm resize-none bg-background/50 border-secondary/30 focus:border-secondary"
          disabled={isLoading}
        />
        <Button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "ghost"}
          size="icon"
          className="absolute bottom-2 right-2 h-10 w-10 rounded-full"
          disabled={isAnalyzing || isTranscribing}
        >
          {isTranscribing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isRecording ? (
            <Square className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </Button>
      </div>
      
      {isRecording && (
        <p className="text-xs text-secondary animate-pulse text-center">Recording... tap to stop</p>
      )}
      
      <Button
        onClick={handleSubmit}
        disabled={isLoading || !responseText.trim()}
        className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            {couplesMode ? 'Submit Response' : 'Submit & Get AI Insights'}
          </>
        )}
      </Button>
    </div>
  );
};

export default OpenEndedInput;
