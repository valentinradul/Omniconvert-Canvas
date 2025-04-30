
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  companyName: string;
  inviterName: string;
  role: string;
  invitationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received invitation email request");
    const { email, companyName, inviterName, role, invitationId }: InvitationEmailRequest = await req.json();

    if (!email || !companyName) {
      throw new Error("Missing required fields");
    }

    const roleName = role.charAt(0).toUpperCase() + role.slice(1);
    const sender = inviterName || "Someone";

    const emailResponse = await resend.emails.send({
      from: "Invitations <onboarding@resend.dev>",
      to: [email],
      subject: `You've been invited to join ${companyName}`,
      html: `
        <div style="font-family: 'Helvetica', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; font-size: 24px;">Team Invitation</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            ${sender} has invited you to join <strong>${companyName}</strong> as a <strong>${roleName}</strong>.
          </p>
          <div style="margin: 30px 0;">
            <a href="${Deno.env.get("PUBLIC_APP_URL") || "https://localhost:8080"}/invitations" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Invitation
            </a>
          </div>
          <p style="font-size: 14px; color: #777; margin-top: 30px;">
            If you don't have an account yet, you'll be prompted to create one.
          </p>
        </div>
      `,
    });

    console.log("Email sending response:", emailResponse);
    
    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
