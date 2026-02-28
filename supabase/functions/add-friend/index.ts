import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { type, value } = await req.json();
    if (!type || !value || !["email", "username"].includes(type)) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedValue = value.trim().toLowerCase();
    if (!trimmedValue) {
      return new Response(
        JSON.stringify({ error: "Value is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for lookup (privacy-safe)
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Prevent adding yourself
    const { data: selfProfile } = await serviceClient
      .from("profiles")
      .select("email, display_name")
      .eq("id", userId)
      .single();

    if (type === "email" && selfProfile?.email?.toLowerCase() === trimmedValue) {
      return new Response(
        JSON.stringify({ message: "Friend request sent. If they have an account, they'll appear in your list." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let friendUserId: string | null = null;
    let friendDisplayName: string | null = null;
    let friendEmail: string | null = null;

    if (type === "email") {
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("id, display_name, email")
        .eq("email", trimmedValue)
        .single();

      if (profile) {
        friendUserId = profile.id;
        friendDisplayName = profile.display_name;
        friendEmail = profile.email;
      } else {
        friendEmail = trimmedValue;
      }
    } else {
      // Username lookup (case-insensitive)
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("id, display_name, email")
        .ilike("display_name", trimmedValue)
        .single();

      if (profile) {
        if (profile.id === userId) {
          return new Response(
            JSON.stringify({ message: "Friend request sent. If they have an account, they'll appear in your list." }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        friendUserId = profile.id;
        friendDisplayName = profile.display_name;
        friendEmail = profile.email;
      } else {
        // Username not found — neutral response, no disclosure
        return new Response(
          JSON.stringify({ message: "Friend request sent. If they have an account, they'll appear in your list." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check for existing link
    if (friendUserId) {
      const { data: existing } = await serviceClient
        .from("friend_links")
        .select("id, status")
        .eq("owner_user_id", userId)
        .eq("friend_user_id", friendUserId)
        .maybeSingle();

      if (existing) {
        if (existing.status === "removed") {
          await serviceClient
            .from("friend_links")
            .update({ status: "linked", friend_display_name: friendDisplayName })
            .eq("id", existing.id);
        }
        return new Response(
          JSON.stringify({ message: "Friend added successfully!" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (friendEmail) {
      const { data: existing } = await serviceClient
        .from("friend_links")
        .select("id")
        .eq("owner_user_id", userId)
        .eq("friend_email", friendEmail)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ message: "Friend request sent. If they have an account, they'll appear in your list." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Insert new friend link
    const insertData: Record<string, unknown> = {
      owner_user_id: userId,
      status: friendUserId ? "linked" : "pending",
    };
    if (friendUserId) insertData.friend_user_id = friendUserId;
    if (friendEmail) insertData.friend_email = friendEmail;
    if (friendDisplayName) insertData.friend_display_name = friendDisplayName;

    const { error: insertError } = await serviceClient
      .from("friend_links")
      .insert(insertData);

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ message: "Friend request sent. If they have an account, they'll appear in your list." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message = friendUserId
      ? "Friend added successfully!"
      : "Friend request sent. If they have an account, they'll appear in your list.";

    return new Response(
      JSON.stringify({ message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
