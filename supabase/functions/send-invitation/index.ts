
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
  console.log("=== INVITATION EMAIL FUNCTION START ===");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Method:", req.method);
    console.log("Headers:", Object.fromEntries(req.headers.entries()));
    
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

    if (!email || !companyName) {
      console.error("Missing required fields:", { email, companyName });
      throw new Error("Missing required fields: email and companyName are required");
    }

    const roleName = role.charAt(0).toUpperCase() + role.slice(1);
    const sender = inviterName || "Someone";
    const appUrl = Deno.env.get("PUBLIC_APP_URL") || "https://localhost:5173";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    console.log("Processing invitation:", {
      email,
      companyName,
      roleName,
      sender,
      appUrl,
      hasApiKey: !!resendApiKey,
      apiKeyLength: resendApiKey?.length || 0
    });

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is missing from environment variables");
      throw new Error("RESEND_API_KEY environment variable is missing");
    }

    // Try sending with the default Resend domain first
    const fromAddress = "onboarding@resend.dev";
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
