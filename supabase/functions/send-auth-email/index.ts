import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { ConfirmEmail } from "./_templates/confirm-email.tsx";
import { ResetPassword } from "./_templates/reset-password.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
      };
    };

    console.log("Processing email for:", user.email, "Type:", email_action_type);

    let html: string;
    let subject: string;

    if (email_action_type === "signup") {
      html = await renderAsync(
        React.createElement(ConfirmEmail, {
          supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
          token,
          token_hash,
          redirect_to,
          email_action_type,
        })
      );
      subject = "Confirm your email - Eazy Loan";
    } else if (email_action_type === "recovery") {
      html = await renderAsync(
        React.createElement(ResetPassword, {
          supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
          token,
          token_hash,
          redirect_to,
          email_action_type,
        })
      );
      subject = "Reset your password - Eazy Loan";
    } else {
      console.log("Unknown email action type:", email_action_type);
      return new Response("Unknown email type", { status: 400, headers: corsHeaders });
    }

    const { error } = await resend.emails.send({
      from: "Eazy Loan <noreply@eazy-loans.com>",
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Email sent successfully to:", user.email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});