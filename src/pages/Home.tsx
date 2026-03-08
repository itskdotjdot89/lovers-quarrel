import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Settings, Heart, Sparkles, LogIn, User, Check, ChevronRight, Users } from 'lucide-react';
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

    if (searchParams.get('success') === 'true') {
      toast({
        title: 'Welcome to Premium!',
        description: 'Your subscription is now active. Enjoy all premium features!'
      });
      checkSubscription();
      window.history.replaceState({}, '', '/home');
    }

    return () => subscription.unsubscribe();
  }, [searchParams, toast, checkSubscription]);

  return (
    <div className="h-[100dvh] bg-gradient-game flex flex-col overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-crimson-vivid/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-purple/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-2xl mx-auto w-full flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="text-center py-8 relative">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(user ? '/settings' : '/auth')}
            className="absolute right-0 top-8 border-border/50 hover:border-crimson-vivid/50 hover:bg-crimson-vivid/10 transition-all rounded-full w-10 h-10"
          >
            {user ? (
              <User className="w-5 h-5" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
          </Button>
          <img 
            src={loversQuarrelLogo} 
            alt="Lovers' Quarrel" 
            className="w-44 h-auto mx-auto mb-4 logo-glow float"
          />
          <p className="font-card text-xl text-muted-foreground">
            Choose your mood. Draw your truth.
          </p>
        </div>

        {/* Main Menu */}
        <div className="flex-1 flex flex-col justify-center space-y-4 min-h-0 overflow-y-auto">
          {/* Play Button - Hero CTA */}
          <button
            onClick={() => navigate('/decks')}
            className="relative group h-24 rounded-2xl overflow-hidden transition-all duration-300 hover-lift"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-crimson-vivid via-crimson-deep to-crimson-vivid bg-[length:200%_100%] group-hover:animate-[shimmer_2s_linear_infinite]" />
            
            {/* Glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 bg-crimson-glow/20 blur-xl" />
            </div>
            
            {/* Content */}
            <div className="relative h-full flex items-center justify-center gap-4">
              <Play className="w-8 h-8 text-white group-hover:scale-110 transition-transform" fill="currentColor" />
              <span className="font-display text-3xl text-white">Play Now</span>
              <ChevronRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Secondary actions */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/favorites')}
              className="group p-3 sm:p-5 glass rounded-xl border border-border/50 hover:border-crimson-vivid/50 transition-all duration-300 hover-lift text-left overflow-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-crimson-vivid/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Heart className="w-5 h-5 text-crimson-glow" />
              </div>
              <h3 className="font-display text-sm sm:text-base text-foreground mb-0.5">Favorites</h3>
              <p className="text-xs text-muted-foreground">Saved cards</p>
            </button>

            <button
              onClick={() => navigate('/friends')}
              className="group p-3 sm:p-5 glass rounded-xl border border-border/50 hover:border-crimson-vivid/50 transition-all duration-300 hover-lift text-left overflow-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-crimson-vivid/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-crimson-glow" />
              </div>
              <h3 className="font-display text-sm sm:text-base text-foreground mb-0.5">Friends</h3>
              <p className="text-xs text-muted-foreground">Your circle</p>
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="group p-3 sm:p-5 glass rounded-xl border border-border/50 hover:border-muted-foreground/50 transition-all duration-300 hover-lift text-left overflow-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="font-display text-sm sm:text-base text-foreground mb-0.5">Settings</h3>
              <p className="text-xs text-muted-foreground">Preferences</p>
            </button>
          </div>

          {/* AI Add-on Card */}
          <div className="relative glass rounded-xl border border-crimson-vivid/30 overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-crimson-glow/50 to-transparent shimmer" />
            
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-crimson-vivid/30 to-purple/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-crimson-glow" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-display text-xl text-foreground">
                      AI Insights
                    </h3>
                    {subscribed && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                        <Check className="w-3.5 h-3.5" />
                        Active
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Deep psychological insights powered by AI. Understand your choices and deepen your connection.
                  </p>
                  {!subscribed && (
                    <Button
                      onClick={() => navigate('/pricing')}
                      variant="outline"
                      size="sm"
                      className="border-crimson-vivid/50 text-crimson-glow hover:bg-crimson-vivid/10 hover:text-crimson-soft"
                    >
                      View Plans
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
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