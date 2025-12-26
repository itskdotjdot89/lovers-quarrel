import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Settings, Heart, Sparkles, LogIn, User, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';
import loversQuarrelLogo from '@/assets/lovers-quarrel-logo.png';

const Home = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { subscribed, loading, checkSubscription } = useSubscription();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    // Check if redirected from successful checkout
    if (searchParams.get('success') === 'true') {
      toast({
        title: 'Welcome to Premium!',
        description: 'Your subscription is now active. Enjoy all premium features!'
      });
      
      // Refresh subscription status
      checkSubscription();
      
      // Clear the success param
      window.history.replaceState({}, '', '/home');
    }

    return () => subscription.unsubscribe();
  }, [searchParams, toast, checkSubscription]);

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center py-8 relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(user ? '/settings' : '/auth')}
            className="absolute right-0 top-8"
          >
            {user ? (
              <>
                <User className="w-4 h-4 mr-2" />
                Profile
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </>
            )}
          </Button>
          <img 
            src={loversQuarrelLogo} 
            alt="Lovers' Quarrel" 
            className="w-48 h-auto mx-auto mb-3"
          />
          <p className="font-card text-lg text-muted-foreground">
            Choose your mood. Draw your truth.
          </p>
        </div>

        {/* Main Menu */}
        <div className="flex-1 flex flex-col justify-center space-y-4">
          <Button
            onClick={() => navigate('/decks')}
            className="h-20 bg-secondary hover:bg-secondary/90 text-foreground font-display text-2xl card-shadow group"
          >
            <Play className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
            Play Now
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <Card
              onClick={() => navigate('/favorites')}
              className="p-6 bg-card border-2 border-border hover:border-secondary cursor-pointer transition-all card-shadow hover:scale-105"
            >
              <Heart className="w-8 h-8 text-secondary mb-3" />
              <h3 className="font-display text-lg text-foreground">Favorites</h3>
              <p className="text-sm text-muted-foreground font-ui mt-1">
                Saved cards
              </p>
            </Card>

            <Card
              onClick={() => navigate('/settings')}
              className="p-6 bg-card border-2 border-border hover:border-secondary cursor-pointer transition-all card-shadow hover:scale-105"
            >
              <Settings className="w-8 h-8 text-muted-foreground mb-3" />
              <h3 className="font-display text-lg text-foreground">Settings</h3>
              <p className="text-sm text-muted-foreground font-ui mt-1">
                Preferences
              </p>
            </Card>
          </div>

          {/* Coming Soon - AI Add-on teaser */}
          <Card className="p-6 bg-gradient-to-br from-crimson-deep/20 to-crimson-vivid/20 border-2 border-crimson-vivid/30">
            <div className="flex items-start space-x-4">
              <Sparkles className="w-6 h-6 text-crimson-glow mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-xl text-foreground">
                    AI Add-On
                  </h3>
                  {subscribed && (
                    <div className="flex items-center gap-1 text-green-500 text-sm">
                      <Check className="w-4 h-4" />
                      <span>Active</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-card leading-relaxed">
                  Heat Ups, Deep Cuts, and Deep Insights powered by AI.
                  <span className="text-crimson-glow font-semibold ml-1">
                    {subscribed ? 'Available now!' : 'Subscribe to unlock'}
                  </span>
                </p>
                {!subscribed && (
                  <Button
                    onClick={() => navigate('/pricing')}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    View Plans
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="py-6 text-center">
          <p className="text-xs text-muted-foreground font-ui">
            18+ only • Play responsibly • Respect boundaries
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
