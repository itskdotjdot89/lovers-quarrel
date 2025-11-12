import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Users, User, UsersRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User as SupabaseUser } from '@supabase/supabase-js';

type BundleType = 'individual' | 'couple' | 'family';

interface PricingPlan {
  id: BundleType;
  name: string;
  icon: React.ReactNode;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  maxUsers: number;
  popular?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'individual',
    name: 'Individual',
    icon: <User className="h-6 w-6" />,
    monthlyPrice: 5,
    annualPrice: 30,
    description: 'Perfect for solo exploration',
    maxUsers: 1,
    features: [
      'All 3 decks (600 cards)',
      'Unlimited AI analyses',
      'Solo mode',
      'Favorites & custom sessions',
      'New cards quarterly'
    ]
  },
  {
    id: 'couple',
    name: 'Couple Bundle',
    icon: <Users className="h-6 w-6" />,
    monthlyPrice: 8,
    annualPrice: 48,
    description: 'Best value for partners',
    maxUsers: 2,
    popular: true,
    features: [
      'Everything in Individual',
      '2 accounts included',
      'Long-distance mode',
      'Date night mode',
      'Couple insights',
      'Save $2/month vs 2 individual plans'
    ]
  },
  {
    id: 'family',
    name: 'Family Plan',
    icon: <UsersRound className="h-6 w-6" />,
    monthlyPrice: 12,
    annualPrice: 72,
    description: 'For friend groups & families',
    maxUsers: 4,
    features: [
      'Everything in Couple',
      'Up to 4 accounts',
      'Party mode (3-10 players)',
      'Group insights',
      'Family-friendly content filter'
    ]
  }
];

const Pricing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<BundleType>('couple');
  const [isAnnual, setIsAnnual] = useState(false);
  const inviteCode = searchParams.get('invite');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) {
        navigate(`/auth${inviteCode ? `?invite=${inviteCode}` : ''}`);
      }
    });

    if (inviteCode) {
      setSelectedPlan('couple');
      toast({
        title: 'Partner Invitation',
        description: 'Your partner has invited you to join their subscription!'
      });
    }
  }, [navigate, inviteCode, toast]);

  const handleSubscribe = async (planId: BundleType) => {
    if (!user) {
      navigate(`/auth${inviteCode ? `?invite=${inviteCode}` : ''}`);
      return;
    }

    setLoading(true);

    try {
      // Create trial subscription
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);

      const { error } = await supabase.from('subscriptions').insert({
        owner_id: user.id,
        bundle_type: planId,
        plan_interval: isAnnual ? 'annual' : 'monthly',
        status: 'trialing',
        trial_end: trialEnd.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEnd.toISOString()
      });

      if (error) throw error;

      toast({
        title: 'Trial Started!',
        description: `Your 7-day free trial has begun. Enjoy full access to all features.`
      });

      navigate('/home');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            Start your 7-day free trial. Cancel anytime.
          </p>
          
          <div className="inline-flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button
              variant={!isAnnual ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setIsAnnual(false)}
            >
              Monthly
            </Button>
            <Button
              variant={isAnnual ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setIsAnnual(true)}
            >
              Annual
              <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative transition-all hover:shadow-lg ${
                plan.popular ? 'border-primary shadow-md scale-105' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ${(plan.annualPrice / 12).toFixed(2)}/month billed annually
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading}
                >
                  Start 7-Day Free Trial
                </Button>

                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>All plans include a 7-day free trial. No credit card required to start.</p>
          <p className="mt-2">Cancel anytime from your account settings.</p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
