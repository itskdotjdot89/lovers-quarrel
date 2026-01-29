import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Check, Trash2, Loader2, Brain } from 'lucide-react';
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
  const [intensity, setIntensity] = useState<SpiceLevel>('standard');
  const [analysisDepth, setAnalysisDepth] = useState<AnalysisDepth>('standard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { subscribed, loading: subLoading } = useSubscription();

  useEffect(() => {
    const stored = localStorage.getItem('lq_default_intensity');
    if (stored) {
      setIntensity(stored as SpiceLevel);
    }
    
    // Load analysis config
    const analysisConfig = loadAnalysisConfig();
    setAnalysisDepth(analysisConfig.depth);

    // Check auth status
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  const handleIntensityChange = (level: SpiceLevel) => {
    setIntensity(level);
    localStorage.setItem('lq_default_intensity', level);
  };

  const handleDepthChange = (depth: AnalysisDepth) => {
    setAnalysisDepth(depth);
    saveAnalysisConfig({ depth });
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to delete your account",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('delete-account');
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      localStorage.clear();
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted",
      });
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/home')}
            className="text-foreground hover:text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-3xl ml-4 text-foreground">
            Settings
          </h1>
        </div>

        <div className="space-y-4">
          {/* Account Management - Moved up for better visibility per Apple guidelines */}
          {isLoggedIn && (
            <Card className="p-6 bg-card border-2 border-destructive/30">
              <h2 className="font-display text-lg mb-3 text-foreground">
                Account Management
              </h2>
              <div className="space-y-2">
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full"
                >
                  Sign Out
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data including favorites, responses,
                        and subscription information.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          )}

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
              <div className="flex flex-col gap-2">
                {subscribed ? (
                  <Button
                    onClick={() => navigate('/subscription')}
                    variant="outline"
                    className="w-full"
                  >
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('/pricing')}
                    className="w-full"
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

          {/* AI Analysis Depth */}
          <Card className="p-6 bg-card border-2 border-border">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-secondary" />
              <label className="block font-display text-lg text-foreground">
                AI Analysis Depth
              </label>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Choose how detailed you want the psychological insights to be
            </p>
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
              Data Management
            </h2>
            <div className="space-y-2">
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full"
              >
                Reset All Data
              </Button>
              <p className="text-xs text-muted-foreground font-ui mt-2">
                Reset clears local favorites and preferences
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
