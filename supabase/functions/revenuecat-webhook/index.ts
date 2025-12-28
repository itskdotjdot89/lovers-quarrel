import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REVENUECAT-WEBHOOK] ${step}${detailsStr}`);
};

interface RevenueCatEvent {
  type: string;
  app_user_id: string;
  original_app_user_id: string;
  product_id: string;
  entitlement_ids: string[];
  period_type: string;
  purchased_at_ms: number;
  expiration_at_ms: number;
  environment: string;
  store: string;
  is_trial_period: boolean;
  cancellation_reason?: string;
}

interface RevenueCatWebhookPayload {
  api_version: string;
  event: RevenueCatEvent;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    // Verify webhook authorization
    const authHeader = req.headers.get("Authorization");
    const expectedAuth = Deno.env.get("REVENUECAT_WEBHOOK_AUTH_HEADER");
    
    if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
      logStep("Unauthorized webhook request");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const payload: RevenueCatWebhookPayload = await req.json();
    const event = payload.event;
    
    logStep("Event received", { 
      type: event.type, 
      app_user_id: event.app_user_id,
      product_id: event.product_id,
      entitlements: event.entitlement_ids
    });

    // Initialize Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // The app_user_id should be the Supabase user ID (set during RevenueCat login)
    const userId = event.app_user_id;
    
    // Validate it's a UUID (Supabase user ID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      logStep("Invalid user ID format, might be anonymous", { userId });
      // For anonymous users, we can't sync - just acknowledge the webhook
      return new Response(JSON.stringify({ success: true, message: "Anonymous user, skipped" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Determine plan interval from product_id
    const planInterval = event.product_id?.includes("yearly") || event.product_id?.includes("annual") 
      ? "yearly" 
      : "monthly";

    // Handle different event types
    switch (event.type) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "PRODUCT_CHANGE":
      case "UNCANCELLATION": {
        logStep("Processing subscription activation", { type: event.type });
        
        const subscriptionData = {
          owner_id: userId,
          status: event.is_trial_period ? "trialing" as const : "active" as const,
          bundle_type: "individual" as const,
          plan_interval: planInterval,
          current_period_start: event.purchased_at_ms 
            ? new Date(event.purchased_at_ms).toISOString() 
            : new Date().toISOString(),
          current_period_end: event.expiration_at_ms 
            ? new Date(event.expiration_at_ms).toISOString() 
            : null,
          trial_end: event.is_trial_period && event.expiration_at_ms 
            ? new Date(event.expiration_at_ms).toISOString() 
            : null,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        };

        // Check if subscription exists
        const { data: existingSub } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("owner_id", userId)
          .single();

        if (existingSub) {
          // Update existing subscription
          const { error: updateError } = await supabaseAdmin
            .from("subscriptions")
            .update(subscriptionData)
            .eq("owner_id", userId);

          if (updateError) {
            logStep("Error updating subscription", { error: updateError.message });
            throw updateError;
          }
          logStep("Subscription updated successfully");
        } else {
          // Insert new subscription
          const { error: insertError } = await supabaseAdmin
            .from("subscriptions")
            .insert(subscriptionData);

          if (insertError) {
            logStep("Error inserting subscription", { error: insertError.message });
            throw insertError;
          }
          logStep("Subscription created successfully");
        }
        break;
      }

      case "CANCELLATION":
      case "EXPIRATION": {
        logStep("Processing subscription cancellation/expiration", { type: event.type });
        
        const { error: cancelError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "canceled" as const,
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq("owner_id", userId);

        if (cancelError) {
          logStep("Error canceling subscription", { error: cancelError.message });
          throw cancelError;
        }
        logStep("Subscription canceled successfully");
        break;
      }

      case "BILLING_ISSUE": {
        logStep("Processing billing issue");
        
        const { error: billingError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "past_due" as const,
            updated_at: new Date().toISOString(),
          })
          .eq("owner_id", userId);

        if (billingError) {
          logStep("Error updating billing status", { error: billingError.message });
          throw billingError;
        }
        logStep("Subscription marked as past_due");
        break;
      }

      case "SUBSCRIBER_ALIAS": {
        logStep("Subscriber alias event - no action needed");
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
