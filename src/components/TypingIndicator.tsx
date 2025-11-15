import { Mic, Type } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TypingIndicatorProps {
  partnerName: string;
  status: 'typing' | 'recording';
}

const TypingIndicator = ({ partnerName, status }: TypingIndicatorProps) => {
  return (
    <Card className="p-3 bg-muted/50 border-border animate-pulse">
      <div className="flex items-center gap-2">
        {status === 'recording' ? (
          <Mic className="w-4 h-4 text-primary animate-pulse" />
        ) : (
          <Type className="w-4 h-4 text-primary" />
        )}
        <span className="text-sm text-muted-foreground">
          {partnerName} is {status === 'recording' ? 'recording' : 'typing'}...
        </span>
        <div className="flex gap-1 ml-2">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </Card>
  );
};

export default TypingIndicator;
