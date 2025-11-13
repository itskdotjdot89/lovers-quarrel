import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AudioRecorder from './AudioRecorder';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
  questionText: string;
  onAnalysisComplete: (analysis: string, sentiment: string, themes: string[]) => void;
}

const ResponseDialog = ({
  open,
  onOpenChange,
  cardId,
  questionText,
  onAnalysisComplete,
}: ResponseDialogProps) => {
  const [responseText, setResponseText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('text');

  const handleTranscription = (text: string) => {
    setResponseText(text);
    setActiveTab('text');
  };

  const handleSubmit = async () => {
    if (!responseText.trim()) {
      toast.error('Please provide a response');
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to use AI analysis');
        return;
      }

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
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const { analysis, sentiment, keyThemes } = await response.json();
      
      onAnalysisComplete(analysis, sentiment, keyThemes);
      setResponseText('');
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error analyzing response:', error);
      toast.error('Failed to analyze response');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-card text-2xl">Share Your Thoughts</DialogTitle>
          <DialogDescription className="font-ui">
            Answer with text or voice, and get AI-powered psychological insights about your response.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="font-card text-foreground">{questionText}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="space-y-4">
              <Textarea
                placeholder="Type your response here..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="min-h-[150px] font-ui"
                disabled={isAnalyzing}
              />
            </TabsContent>
            
            <TabsContent value="audio" className="py-8">
              <AudioRecorder 
                onTranscription={handleTranscription}
                disabled={isAnalyzing}
              />
              {responseText && activeTab === 'audio' && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Transcribed:</p>
                  <p className="text-sm">{responseText}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAnalyzing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isAnalyzing || !responseText.trim()}
              className="bg-secondary hover:bg-secondary/90"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Get AI Insights'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResponseDialog;