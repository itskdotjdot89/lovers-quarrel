import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Check } from 'lucide-react';
import { SpiceLevel } from '@/types/game';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const navigate = useNavigate();
  const [intensity, setIntensity] = useState<SpiceLevel>('standard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { subscribed, loading: subLoading } = useSubscription();

  useEffect(() => {
    const stored = localStorage.getItem('lq_default_intensity');
    if (stored) {
      setIntensity(stored as SpiceLevel);
    }

    // Check auth status
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  const handleIntensityChange = (level: SpiceLevel) => {
    setIntensity(level);
    localStorage.setItem('lq_default_intensity', level);
  };

  const handleReset = () => {
    if (confirm('Reset all data including favorites?')) {
      localStorage.clear();
      navigate('/');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-foreground hover:text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-3xl ml-4 text-foreground">
            Settings
          </h1>
        </div>

        <div className="space-y-4">
          {/* Subscription Management */}
          {isLoggedIn && (
            <Card className="p-6 bg-card border-2 border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-foreground" />
                  <h2 className="font-display text-lg text-foreground">
                    Subscription
                  </h2>
                </div>
                {subscribed && (
                  <Badge className="bg-green-500">
                    <Check className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {subscribed 
                  ? 'You have full access to all premium features'
                  : 'Subscribe to unlock AI insights and all game modes'}
              </p>
              <div className="flex gap-2">
                {subscribed ? (
                  <Button
                    onClick={() => navigate('/subscription')}
                    variant="outline"
                    className="flex-1"
                  >
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('/pricing')}
                    className="flex-1"
                  >
                    View Plans
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Default Intensity */}
          <Card className="p-6 bg-card border-2 border-border">
            <label className="block font-display text-lg mb-4 text-foreground">
              Default Content Intensity
            </label>
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
                  <span className="capitalize font-card">{level}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* About */}
          <Card className="p-6 bg-card border-2 border-border">
            <h2 className="font-display text-lg mb-3 text-foreground">
              About Lovers' Quarrel
            </h2>
            <div className="space-y-2 font-card text-sm text-muted-foreground">
              <p>Version 1.0.0</p>
              <p>An intimate conversation card game</p>
              <p className="pt-4 text-xs">
                18+ only • Play responsibly • Respect boundaries
              </p>
            </div>
          </Card>

          {/* Legal & Support */}
          <Card className="p-6 bg-card border-2 border-border">
            <h2 className="font-display text-lg mb-3 text-foreground">
              Legal & Support
            </h2>
            <div className="space-y-2 font-ui text-sm text-muted-foreground">
              <button 
                onClick={() => navigate('/privacy')}
                className="block hover:text-secondary transition-colors"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => navigate('/terms')}
                className="block hover:text-secondary transition-colors"
              >
                Terms of Service
              </button>
              <button 
                onClick={() => navigate('/support')}
                className="block hover:text-secondary transition-colors"
              >
                Contact Support
              </button>
              <p className="pt-2 text-xs">
                18+ only • Play responsibly • Respect boundaries
              </p>
            </div>
          </Card>

          {/* Data Management */}
          <Card className="p-6 bg-card border-2 border-border">
            <h2 className="font-display text-lg mb-3 text-foreground">
              Account Management
            </h2>
            <div className="space-y-2">
              {isLoggedIn && (
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full"
                >
                  Sign Out
                </Button>
              )}
              <Button
                onClick={handleReset}
                variant="destructive"
                className="w-full"
              >
                Reset All Data
              </Button>
              <p className="text-xs text-muted-foreground font-ui mt-2">
                This will clear all favorites and preferences
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
