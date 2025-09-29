
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

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
  console.log("=== INVITATION EMAIL FUNCTION START ===");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Method:", req.method);
    
    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);
    
    let parsedBody: InvitationEmailRequest;
    try {
      parsedBody = JSON.parse(rawBody);
      console.log("Parsed request body:", JSON.stringify(parsedBody));
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
      throw new Error("Invalid JSON in request body");
    }

    const { email, companyName, inviterName, role, invitationId } = parsedBody;

    console.log("Extracted fields:", { email, companyName, inviterName, role, invitationId });

    if (!email || !companyName || !invitationId) {
      console.error("Missing required fields:", { email, companyName, invitationId });
      throw new Error("Missing required fields: email, companyName, and invitationId are required");
    }

    const roleName = role.charAt(0).toUpperCase() + role.slice(1);
    const sender = inviterName || "Someone";
    const appUrl = "https://experiment-flow-hub.lovable.app";
    
    // Create invitation URLs with the invitation ID
    const signupUrl = `${appUrl}/signup?invitation=${invitationId}`;
    const loginUrl = `${appUrl}/login?invitation=${invitationId}`;
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Enhanced API key logging
    console.log("=== API KEY DIAGNOSTICS ===");
    console.log("RESEND_API_KEY exists:", !!resendApiKey);
    console.log("RESEND_API_KEY length:", resendApiKey?.length || 0);
    console.log("RESEND_API_KEY starts with 're_':", resendApiKey?.startsWith('re_') || false);
    console.log("RESEND_API_KEY first 10 chars:", resendApiKey?.substring(0, 10) || 'N/A');
    console.log("All environment variables:", Object.keys(Deno.env.toObject()));
    console.log("=== END API KEY DIAGNOSTICS ===");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is missing from environment variables");
      throw new Error("RESEND_API_KEY environment variable is missing");
    }

    if (!resendApiKey.startsWith('re_')) {
      console.error("RESEND_API_KEY format appears incorrect - should start with 're_'");
      throw new Error("RESEND_API_KEY format appears incorrect");
    }

    // Initialize Resend with the API key
    const resend = new Resend(resendApiKey);

    // Use your verified domain instead of the default Resend domain
    const fromAddress = "team@omniconvert.com";
    console.log("Using from address:", fromAddress);

    console.log("Attempting to send email...");
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
            <a href="${signupUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; margin-right: 10px;">
              Create Account & Join Team
            </a>
          </div>
          <p style="font-size: 14px; color: #777; margin-top: 20px;">
            Already have an account? <a href="${loginUrl}" style="color: #2563eb; text-decoration: none;">Sign in here</a> to accept your invitation.
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This invitation link is unique to you and cannot be shared with others.
          </p>
        </div>
      `,
    });

    console.log("Email response received:", JSON.stringify(emailResponse));
    
    // Check if there's an error in the response
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      throw new Error(`Email service error: ${emailResponse.error.message || 'Unknown error'}`);
    }
    
    // Check if we got a successful response with an ID
    if (!emailResponse.data || !emailResponse.data.id) {
      console.error("Unexpected response format:", emailResponse);
      throw new Error("Email service returned unexpected response format");
    }
    
    console.log("Email sent successfully with ID:", emailResponse.data.id);
    console.log("=== INVITATION EMAIL FUNCTION SUCCESS ===");
    
    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("=== INVITATION EMAIL FUNCTION ERROR ===");
    console.error("Error type:", typeof error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred",
        type: error.name || "UnknownError"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
