import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Users, User } from 'lucide-react';

interface SessionModeSelectorProps {
  onSelect: (mode: 'solo' | 'couples' | 'couples_local') => void;
}

const SessionModeSelector = ({ onSelect }: SessionModeSelectorProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center mb-6">{t('modes.choosePlayMode')}</h2>
      
      <Card 
        className="p-6 cursor-pointer hover:border-primary transition-all hover:shadow-lg"
        onClick={() => onSelect('solo')}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{t('modes.solo')}</h3>
            <p className="text-sm text-muted-foreground">{t('modes.soloDesc')}</p>
          </div>
        </div>
      </Card>

      <Card 
        className="p-6 cursor-pointer hover:border-primary transition-all hover:shadow-lg"
        onClick={() => onSelect('couples_local')}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{t('modes.couplesLocal')}</h3>
            <p className="text-sm text-muted-foreground">{t('modes.couplesLocalDesc')}</p>
          </div>
        </div>
      </Card>

      <Card 
        className="p-6 cursor-pointer hover:border-primary transition-all hover:shadow-lg"
        onClick={() => onSelect('couples')}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{t('modes.couplesRemote')}</h3>
            <p className="text-sm text-muted-foreground">{t('modes.couplesRemoteDesc')}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SessionModeSelector;
