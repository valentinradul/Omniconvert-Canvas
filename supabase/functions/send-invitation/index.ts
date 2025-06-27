
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
      console.error("Missing required fields:", { email, companyName });
      throw new Error("Missing required fields");
    }

    const roleName = role.charAt(0).toUpperCase() + role.slice(1);
    const sender = inviterName || "Someone";
    const appUrl = Deno.env.get("PUBLIC_APP_URL") || "https://localhost:5173";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    console.log("Sending invitation email to:", email, "for company:", companyName, "with role:", roleName);
    console.log("Using PUBLIC_APP_URL:", appUrl);
    console.log("Using RESEND_API_KEY:", resendApiKey ? "Key exists (length: " + resendApiKey.length + ")" : "Key missing");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is missing");
    }

    // First, let's test the API key by trying to get domains
    console.log("Testing API key by fetching domains...");
    try {
      const domainsResponse = await fetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      const domainsData = await domainsResponse.json();
      console.log("Domains API response status:", domainsResponse.status);
      console.log("Domains API response:", JSON.stringify(domainsData));
      
      if (!domainsResponse.ok) {
        console.error("API key validation failed:", domainsData);
        throw new Error(`Invalid API key: ${domainsData.message || 'Unknown error'}`);
      }
    } catch (domainError) {
      console.error("Error testing API key:", domainError);
      throw new Error("Failed to validate API key with Resend");
    }

    // Using the default Resend testing domain that should work immediately
    const fromAddress = "onboarding@resend.dev";
    console.log("Using from address:", fromAddress);

    const emailResponse = await resend.emails.send({
      from: `Team Invitations <${fromAddress}>`,
      to: [email],
      subject: `You've been invited to join ${companyName}`,
      html: `
        <div style="font-family: 'Helvetica', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; font-size: 24px;">Team Invitation</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            ${sender} has invited you to join <strong>${companyName}</strong> as a <strong>${roleName}</strong>.
          </p>
          <div style="margin: 30px 0;">
            <a href="${appUrl}/invitations" 
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

    console.log("Email sending response:", JSON.stringify(emailResponse));
    
    // Check if there's an error in the response
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      
      // Handle domain verification error specifically
      if (emailResponse.error.message && emailResponse.error.message.includes("verify a domain")) {
        throw new Error("Email domain not verified. Please verify your domain at resend.com/domains to send emails to other recipients.");
      }
      
      // Handle authentication errors
      if (emailResponse.error.message && emailResponse.error.message.includes("API key")) {
        throw new Error("Invalid Resend API key. Please check your RESEND_API_KEY configuration.");
      }
      
      // Handle from address errors
      if (emailResponse.error.message && (emailResponse.error.message.includes("from") || emailResponse.error.message.includes("domain"))) {
        throw new Error(`Invalid from address. Please ensure ${fromAddress} uses your verified domain.`);
      }
      
      throw new Error(`Email service error: ${emailResponse.error.message || 'Unknown error'}`);
    }
    
    // Check if we got a successful response with an ID
    if (!emailResponse.data || !emailResponse.data.id) {
      console.error("Unexpected response format:", emailResponse);
      throw new Error("Email service returned unexpected response format");
    }
    
    console.log("Email sent successfully with ID:", emailResponse.data.id);
    
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
