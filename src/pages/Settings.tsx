import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Check, Trash2, Loader2, Brain, Star, Globe } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { requestAppReview } from '@/lib/appReview';
import { SpiceLevel } from '@/types/game';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  loadAnalysisConfig, 
  saveAnalysisConfig, 
  DEPTH_CONFIG, 
  AnalysisDepth 
} from '@/lib/aiAnalysisConfig';
import { LANGUAGES } from '@/i18n';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [intensity, setIntensity] = useState<SpiceLevel>('standard');
  const [analysisDepth, setAnalysisDepth] = useState<AnalysisDepth>('standard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { subscribed, loading: subLoading } = useSubscription();

  useEffect(() => {
    const stored = localStorage.getItem('lq_default_intensity');
    if (stored) setIntensity(stored as SpiceLevel);
    const analysisConfig = loadAnalysisConfig();
    setAnalysisDepth(analysisConfig.depth);
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
  }, []);

  const handleIntensityChange = (level: SpiceLevel) => {
    setIntensity(level);
    localStorage.setItem('lq_default_intensity', level);
  };

  const handleDepthChange = (depth: AnalysisDepth) => {
    setAnalysisDepth(depth);
    saveAnalysisConfig({ depth });
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const handleReset = () => {
    if (confirm(t('settings.resetConfirm'))) {
      localStorage.clear();
      navigate('/');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: t('common.error'), description: "You must be logged in to delete your account", variant: "destructive" });
        return;
      }
      const response = await supabase.functions.invoke('delete-account');
      if (response.error) throw new Error(response.error.message);
      localStorage.clear();
      toast({ title: t('settings.accountDeleted'), description: t('settings.accountDeletedDesc') });
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({ title: t('common.error'), description: "Failed to delete account. Please try again.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/home')} className="text-foreground hover:text-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-3xl ml-4 text-foreground">{t('settings.title')}</h1>
        </div>

        <div className="space-y-4">
          {/* Language Selector */}
          <Card className="p-6 bg-card border-2 border-border">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-secondary" />
              <label className="block font-display text-lg text-foreground">{t('settings.language')}</label>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t('settings.languageDesc')}</p>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map((lang) => (
                <Button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  variant={i18n.language?.startsWith(lang.code) ? 'default' : 'outline'}
                  className={
                    i18n.language?.startsWith(lang.code)
                      ? 'bg-secondary hover:bg-secondary/90 text-foreground flex-col h-auto py-2'
                      : 'border-border text-muted-foreground hover:border-secondary flex-col h-auto py-2'
                  }
                  size="sm"
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-xs font-card">{lang.label}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* Account Management */}
          <Card className="p-6 bg-card border-2 border-destructive/30">
            <h2 className="font-display text-lg mb-3 text-foreground">{t('settings.accountManagement')}</h2>
            {isLoggedIn ? (
              <div className="space-y-2">
                <Button onClick={handleSignOut} variant="outline" className="w-full">{t('settings.signOut')}</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      {t('settings.deleteAccount')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('settings.deleteAccountTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>{t('settings.deleteAccountDesc')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('settings.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {t('settings.deleteAccount')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t('settings.signInToManage')}</p>
                <Button onClick={() => navigate('/auth')} className="w-full">{t('auth.signIn')}</Button>
              </div>
            )}
          </Card>

          {/* Subscription */}
          {isLoggedIn && (
            <Card className="p-6 bg-card border-2 border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-foreground" />
                  <h2 className="font-display text-lg text-foreground">{t('settings.subscription')}</h2>
                </div>
                {subscribed && (
                  <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" />{t('home.active')}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {subscribed ? t('settings.subscriptionActive') : t('settings.subscriptionInactive')}
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate('/pricing')} variant={subscribed ? 'outline' : 'default'} className="w-full">
                  {subscribed ? t('settings.manageSubscription') : t('home.viewPlans')}
                </Button>
              </div>
            </Card>
          )}

          {/* Default Intensity */}
          <Card className="p-6 bg-card border-2 border-border">
            <label className="block font-display text-lg mb-4 text-foreground">{t('settings.defaultIntensity')}</label>
            <div className="grid grid-cols-3 gap-3">
              {(['soft', 'standard', 'spicy'] as SpiceLevel[]).map((level) => (
                <Button
                  key={level}
                  onClick={() => handleIntensityChange(level)}
                  variant={intensity === level ? 'default' : 'outline'}
                  className={
                    intensity === level
                      ? 'bg-secondary hover:bg-secondary/90 text-foreground'
                      : 'border-border text-muted-foreground hover:border-secondary'
                  }
                >
                  <span className="capitalize font-card">{t(`decks.${level}`)}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* AI Analysis Depth */}
          <Card className="p-6 bg-card border-2 border-border">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-secondary" />
              <label className="block font-display text-lg text-foreground">{t('settings.aiAnalysisDepth')}</label>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t('settings.aiAnalysisDepthDesc')}</p>
            <div className="grid grid-cols-3 gap-3">
              {(['brief', 'standard', 'deep'] as AnalysisDepth[]).map((depth) => (
                <Button
                  key={depth}
                  onClick={() => handleDepthChange(depth)}
                  variant={analysisDepth === depth ? 'default' : 'outline'}
                  className={
                    analysisDepth === depth
                      ? 'bg-secondary hover:bg-secondary/90 text-foreground flex-col h-auto py-3 whitespace-normal'
                      : 'border-border text-muted-foreground hover:border-secondary flex-col h-auto py-3 whitespace-normal'
                  }
                >
                  <span className="font-card">{DEPTH_CONFIG[depth].label}</span>
                  <span className="text-xs opacity-70 mt-1 text-center">{DEPTH_CONFIG[depth].description}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* About */}
          <Card className="p-6 bg-card border-2 border-border">
            <h2 className="font-display text-lg mb-3 text-foreground">{t('settings.about')}</h2>
            <div className="space-y-2 font-card text-sm text-muted-foreground">
              <p>{t('settings.version')}</p>
              <p>{t('settings.intimateGame')}</p>
              {Capacitor.isNativePlatform() && (
                <Button
                  onClick={async () => {
                    const success = await requestAppReview();
                    if (!success) {
                      toast({ title: t('settings.rateAppThanks'), description: t('settings.rateAppDesc') });
                    }
                  }}
                  variant="outline"
                  className="w-full mt-3"
                >
                  <Star className="w-4 h-4 mr-2" />
                  {t('settings.rateApp')}
                </Button>
              )}
              <p className="pt-4 text-xs">{t('home.footer')}</p>
            </div>
          </Card>

          {/* Legal & Support */}
          <Card className="p-6 bg-card border-2 border-border">
            <h2 className="font-display text-lg mb-3 text-foreground">{t('settings.legalSupport')}</h2>
            <div className="space-y-2 font-ui text-sm text-muted-foreground">
              <button onClick={() => navigate('/privacy')} className="block hover:text-secondary transition-colors">{t('onboarding.privacyPolicy')}</button>
              <button onClick={() => navigate('/terms')} className="block hover:text-secondary transition-colors">{t('onboarding.termsOfService')}</button>
              <button onClick={() => navigate('/support')} className="block hover:text-secondary transition-colors">{t('settings.contactSupport')}</button>
              <p className="pt-2 text-xs">{t('home.footer')}</p>
            </div>
          </Card>

          {/* Data Management */}
          <Card className="p-6 bg-card border-2 border-border">
            <h2 className="font-display text-lg mb-3 text-foreground">{t('settings.dataManagement')}</h2>
            <div className="space-y-2">
              <Button onClick={handleReset} variant="outline" className="w-full">{t('settings.resetAllData')}</Button>
              <p className="text-xs text-muted-foreground font-ui mt-2">{t('settings.resetDesc')}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
