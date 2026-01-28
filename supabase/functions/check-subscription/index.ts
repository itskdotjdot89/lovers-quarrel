import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Retry helper for transient network errors
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3, delay = 500): Promise<T> => {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isRetryable = lastError.message.includes('connection') || 
                          lastError.message.includes('reset') ||
                          lastError.message.includes('timeout');
      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }
      logStep(`Retry attempt ${attempt}/${maxRetries}`, { error: lastError.message });
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw lastError;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await withRetry(() => 
      supabaseClient.auth.getUser(token)
    );
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Whitelist for users with indefinite premium access
    const premiumWhitelist = [
      "dmpaige92@gmail.com", 
      "samuelkennethjohnsonjr@gmail.com",
      "samuelkennethjonsonjr@gmail.com",
      "dmpaige93@gmail.com"
      // "demo@loversquarrel.com" // Apple review test account - TEMPORARILY DISABLED FOR TESTING
    ];
    
    if (premiumWhitelist.includes(user.email.toLowerCase())) {
      logStep("User is whitelisted for premium access", { email: user.email });
      const farFutureDate = new Date();
      farFutureDate.setFullYear(farFutureDate.getFullYear() + 100);
      
      return new Response(JSON.stringify({
        subscribed: true,
        product_id: "premium_whitelist",
        subscription_end: farFutureDate.toISOString(),
        status: "active"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        product_id: null,
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions (including trialing)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No subscriptions found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        product_id: null,
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    const isActive = ['active', 'trialing'].includes(subscription.status);
    
    logStep("Subscription found", { 
      subscriptionId: subscription.id, 
      status: subscription.status,
      isActive 
    });

    let productId = null;
    let subscriptionEnd = null;

    if (isActive) {
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      logStep("Active subscription details", { productId, subscriptionEnd });
    }

    return new Response(JSON.stringify({
      subscribed: isActive,
      product_id: productId,
      subscription_end: subscriptionEnd,
      status: subscription.status
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
