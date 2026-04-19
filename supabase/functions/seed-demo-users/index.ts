import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DemoAccount {
  email: string;
  role: string;
  full_name: string;
  description: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get demo accounts from database
    const { data: demoAccounts, error: fetchError } = await supabaseAdmin
      .from("demo_accounts")
      .select("*");

    if (fetchError) {
      throw new Error(`Failed to fetch demo accounts: ${fetchError.message}`);
    }

    const results: { email: string; status: string; error?: string }[] = [];
    const defaultPassword = "simrs2024";

    for (const account of demoAccounts as DemoAccount[]) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find((u) => u.email === account.email);

        let userId: string;

        if (existingUser) {
          userId = existingUser.id;
          results.push({ email: account.email, status: "exists" });
        } else {
          // Create user
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: account.email,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: {
              full_name: account.full_name,
            },
          });

          if (createError) {
            results.push({ email: account.email, status: "error", error: createError.message });
            continue;
          }

          userId = newUser.user.id;
          results.push({ email: account.email, status: "created" });
        }

        // Assign role (upsert to avoid duplicates)
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .upsert(
            { user_id: userId, role: account.role },
            { onConflict: "user_id,role" }
          );

        if (roleError) {
          console.error(`Failed to assign role for ${account.email}: ${roleError.message}`);
        }

        // Apply menu access from template
        const { error: menuError } = await supabaseAdmin.rpc("apply_role_menu_access", {
          _user_id: userId,
          _role: account.role,
        });

        if (menuError) {
          console.error(`Failed to apply menu access for ${account.email}: ${menuError.message}`);
        }
      } catch (err) {
        results.push({ email: account.email, status: "error", error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demo users seeding completed",
        results,
        defaultPassword,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error seeding demo users:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
