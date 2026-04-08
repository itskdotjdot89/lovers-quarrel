import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Heart } from 'lucide-react';
import loversQuarrelLogo from '@/assets/lovers-quarrel-logo.png';

interface AgeGateProps {
  onAccept: () => void;
}

const AgeGate = ({ onAccept }: AgeGateProps) => {
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    onAccept();
  };

  return (
    <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-crimson-deep/20 rounded-full blur-3xl" />
      </div>
      
      <div className="relative w-full max-w-md glass rounded-2xl p-8 shadow-elevated animate-scale-in">
        <div className="flex flex-col items-center space-y-4 text-center mb-8">
          <img 
            src={loversQuarrelLogo} 
            alt="Lovers Quarrel" 
            className="w-28 h-auto logo-glow"
          />
          <h1 className="font-display text-3xl text-foreground text-glow-soft">
            {t('ageGate.beforeWeBegin')}
          </h1>
        </div>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-crimson-deep/20 border border-crimson-vivid/30">
            <div className="p-2 rounded-lg bg-crimson-vivid/20">
              <AlertTriangle className="w-5 h-5 text-crimson-glow" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">{t('ageGate.adultContent')}</p>
              <p className="text-sm text-muted-foreground">{t('ageGate.adultContentDesc')}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="p-2 rounded-lg bg-muted">
              <Shield className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">{t('ageGate.ageVerification')}</p>
              <p className="text-sm text-muted-foreground">{t('ageGate.ageVerificationDesc')}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="p-2 rounded-lg bg-muted">
              <Heart className="w-5 h-5 text-crimson-soft" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">{t('ageGate.consentSafety')}</p>
              <p className="text-sm text-muted-foreground">{t('ageGate.consentSafetyDesc')}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            className="w-full h-14 bg-gradient-to-r from-crimson-vivid to-crimson-deep hover:from-crimson-glow hover:to-crimson-vivid text-foreground font-semibold text-lg btn-glow transition-all duration-300"
          >
            {t('ageGate.iAmAdult')}
          </Button>
          
          <a
            href="about:blank"
            className="block w-full text-center py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('ageGate.exit')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default AgeGate;
