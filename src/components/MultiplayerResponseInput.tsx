import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, Send, Loader2 } from 'lucide-react';
import SimpleAudioRecorder from './SimpleAudioRecorder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MultiplayerResponseInputProps {
  sessionId: string;
  cardId: string;
  onResponseSubmitted: () => void;
}

const MultiplayerResponseInput = ({ sessionId, cardId, onResponseSubmitted }: MultiplayerResponseInputProps) => {
  const [textResponse, setTextResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  const handleTextSubmit = async () => {
    if (!textResponse.trim()) {
      toast({
        title: "Empty response",
        description: "Please enter a response first",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('session_responses')
        .insert({
          session_id: sessionId,
          card_id: cardId,
          user_id: user.id,
          response_type: 'text',
          response_text: textResponse
        });

      if (error) throw error;

      toast({
        title: "Response shared!",
        description: "Your partner can now see your answer"
      });
      
      setTextResponse('');
      onResponseSubmitted();
    } catch (error) {
      toast({
        title: "Failed to submit",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAudioComplete = async (audioBlob: Blob) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const base64Data = base64Audio.split(',')[1];

        // Transcribe audio
        const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Data }
        });

        if (transcribeError) throw transcribeError;

        // Submit transcribed text
        const { error } = await supabase
          .from('session_responses')
          .insert({
            session_id: sessionId,
            card_id: cardId,
            user_id: user.id,
            response_type: 'audio',
            response_text: transcribeData.text
          });

        if (error) throw error;

        toast({
          title: "Audio response shared!",
          description: "Your partner can now see your answer"
        });
        
        onResponseSubmitted();
        setIsSubmitting(false);
      };
    } catch (error) {
      toast({
        title: "Failed to submit audio",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4 bg-card border-border">
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text">Type</TabsTrigger>
          <TabsTrigger value="audio">Voice</TabsTrigger>
        </TabsList>
        
        <TabsContent value="text" className="space-y-3">
          <Textarea
            placeholder="Share your thoughts..."
            value={textResponse}
            onChange={(e) => setTextResponse(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={isSubmitting}
          />
          <Button
            onClick={handleTextSubmit}
            disabled={isSubmitting || !textResponse.trim()}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Share Response
              </>
            )}
          </Button>
        </TabsContent>
        
        <TabsContent value="audio" className="space-y-3">
          <div className="flex flex-col items-center gap-4 py-4">
            <SimpleAudioRecorder
              onRecordingComplete={handleAudioComplete}
              onRecordingStart={() => setIsRecording(true)}
              onRecordingStop={() => setIsRecording(false)}
            />
            <p className="text-sm text-muted-foreground text-center">
              {isRecording ? 'Recording...' : 'Tap to record your voice response'}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default MultiplayerResponseInput;
