import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, ArrowLeft, Users, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Subscription {
  id: string;
  bundle_type: 'individual' | 'couple';
  plan_interval: 'monthly' | 'annual';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  trial_end: string | null;
  current_period_end: string | null;
  linked_users: string[];
}

const ManageSubscription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .or(`owner_id.eq.${user.id},linked_users.cs.{${user.id}}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        navigate('/pricing');
      }
      setLoading(false);
      return;
    }

    setSubscription(data as Subscription);
    setLoading(false);
  };

  const generateInviteCode = async () => {
    if (!subscription) return;

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('subscription_invites').insert({
      subscription_id: subscription.id,
      inviter_id: user.id,
      invite_code: code,
      expires_at: expiresAt.toISOString()
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate invite code'
      });
      return;
    }

    setInviteCode(code);
    toast({
      title: 'Invite Created!',
      description: 'Share this code with your partner'
    });
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/auth?invite=${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: 'Copied!',
      description: 'Invite link copied to clipboard'
    });
  };

  const openCustomerPortal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: 'Opening Stripe Portal',
          description: 'Manage your subscription and payment methods'
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to open customer portal'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanName = (bundleType: string) => {
    switch (bundleType) {
      case 'individual': return 'Individual';
      case 'couple': return 'Couple Bundle';
      default: return bundleType;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'trialing': return 'bg-blue-500';
      case 'canceled': return 'bg-red-500';
      case 'past_due': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading subscription...</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No Subscription Found</CardTitle>
            <CardDescription>
              You don't have an active subscription yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/pricing')} className="w-full">
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxUsers = subscription.bundle_type === 'individual' ? 1 : 2;
  const canInvite = subscription.linked_users.length < maxUsers - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4 py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Subscription</CardTitle>
              <Badge className={getStatusColor(subscription.status)}>
                {subscription.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-2xl font-bold">{getPlanName(subscription.bundle_type)}</p>
              <p className="text-muted-foreground capitalize">
                {subscription.plan_interval} billing
              </p>
            </div>

            {subscription.status === 'trialing' && subscription.trial_end && (
              <div className="p-4 bg-blue-500/10 rounded-lg">
                <p className="text-sm font-medium">Free Trial Active</p>
                <p className="text-sm text-muted-foreground">
                  Trial ends: {new Date(subscription.trial_end).toLocaleDateString()}
                </p>
              </div>
            )}

            {subscription.current_period_end && subscription.status === 'active' && (
              <div className="text-sm text-muted-foreground">
                Next billing date: {new Date(subscription.current_period_end).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>

        {subscription.bundle_type !== 'individual' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Linked Accounts
              </CardTitle>
              <CardDescription>
                {subscription.linked_users.length + 1} / {maxUsers} accounts used
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canInvite && (
                <div className="space-y-3">
                  {!inviteCode ? (
                    <Button onClick={generateInviteCode} className="w-full">
                      Generate Partner Invite
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Label>Invite Link</Label>
                      <div className="flex gap-2">
                        <Input
                          value={`${window.location.origin}/auth?invite=${inviteCode}`}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyInviteLink}
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Share this link with your partner to join your subscription
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!canInvite && (
                <p className="text-sm text-muted-foreground">
                  Maximum number of accounts reached for this plan
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Manage Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={openCustomerPortal}
              disabled={loading}
            >
              Manage Payment & Billing
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/pricing')}
            >
              Change Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManageSubscription;
