import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';
import { isMicrophoneAvailable, requestMicrophoneAccess } from '@/lib/microphoneUtils';

interface SimpleAudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}

const SimpleAudioRecorder = ({ onRecordingComplete, onRecordingStart, onRecordingStop }: SimpleAudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const hasMic = isMicrophoneAvailable();

  const startRecording = async () => {
    const stream = await requestMicrophoneAccess();
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      onRecordingComplete(audioBlob);
      stream.getTracks().forEach(track => track.stop());
      onRecordingStop?.();
    };

    mediaRecorder.start();
    setIsRecording(true);
    onRecordingStart?.();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      variant={isRecording ? "destructive" : "outline"}
      size="lg"
      className="h-16 w-16 rounded-full"
    >
      {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
    </Button>
  );
};

export default SimpleAudioRecorder;
