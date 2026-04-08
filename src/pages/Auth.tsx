import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User, Session } from '@supabase/supabase-js';
import { Loader2, ArrowLeft, X } from 'lucide-react';
import loversQuarrelLogo from '@/assets/lovers-quarrel-logo.png';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const fromOnboarding = searchParams.get('from') === 'onboarding';
  const inviteCode = searchParams.get('invite');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        if (fromOnboarding) navigate('/pricing?from=onboarding');
        else if (inviteCode) navigate(`/pricing?invite=${inviteCode}`);
        else navigate('/home');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        if (fromOnboarding) navigate('/pricing?from=onboarding');
        else if (inviteCode) navigate(`/pricing?invite=${inviteCode}`);
        else navigate('/home');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, fromOnboarding, inviteCode]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: redirectUrl, data: { display_name: displayName } }
    });

    if (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    } else {
      toast({ title: t('auth.accountCreated'), description: t('auth.accountCreatedDesc') });
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string
    });
    if (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `https://lovers-whispers-app.lovable.app/reset-password`
    });
    if (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    } else {
      toast({ title: t('auth.checkEmail'), description: t('auth.checkEmailDesc') });
      setShowResetPassword(false);
      setResetEmail('');
    }
    setResetLoading(false);
  };

  const handleBack = () => {
    if (fromOnboarding) navigate('/onboarding');
    else navigate('/');
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setShowResetPassword(false)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={loversQuarrelLogo} alt="Lovers' Quarrel" className="w-24 h-auto logo-glow" />
              <div className="w-9" />
            </div>
            <CardDescription className="text-center pt-2">
              {t('auth.resetPasswordDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">{t('auth.email')}</Label>
                <Input id="reset-email" type="email" placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('auth.sending')}</>) : t('auth.sendResetLink')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <X className="h-5 w-5" />
            </Button>
            <img src={loversQuarrelLogo} alt="Lovers' Quarrel" className="w-32 h-auto logo-glow" />
            <div className="w-9" />
          </div>
          <CardDescription className="text-center">
            {t('auth.tagline')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={fromOnboarding ? "signup" : "signin"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t('auth.email')}</Label>
                  <Input id="signin-email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">{t('auth.password')}</Label>
                    <button type="button" onClick={() => setShowResetPassword(true)} className="text-xs text-primary hover:underline">
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                  <Input id="signin-password" name="password" type="password" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('auth.signingIn')}</>) : t('auth.signIn')}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t('auth.displayName')}</Label>
                  <Input id="signup-name" name="displayName" type="text" placeholder={t('auth.yourName')} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.email')}</Label>
                  <Input id="signup-email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.password')}</Label>
                  <Input id="signup-password" name="password" type="password" minLength={6} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('auth.creatingAccount')}</>) : t('onboarding.createAccount')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-center text-muted-foreground mt-6">
            {t('onboarding.agreeTerms')}{' '}
            <Link to="/terms" className="text-primary hover:underline">{t('auth.terms')}</Link>
            {' '}{t('onboarding.and')}{' '}
            <Link to="/privacy" className="text-primary hover:underline">{t('auth.privacy')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
