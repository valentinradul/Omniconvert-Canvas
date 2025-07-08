
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Starting deletion process for user:', userId);

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Handle companies created by this user
    // First, check if user has created any companies
    const { data: companiesCreated, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('created_by', userId);

    if (companiesError) {
      console.error('Error checking companies:', companiesError);
      throw new Error('Failed to check user companies');
    }

    console.log('Companies created by user:', companiesCreated?.length || 0);

    // For each company created by this user, either delete it or transfer ownership
    if (companiesCreated && companiesCreated.length > 0) {
      for (const company of companiesCreated) {
        console.log('Processing company:', company.name);
        
        // Find another owner/admin to transfer ownership to
        const { data: otherAdmins, error: adminsError } = await supabase
          .from('company_members')
          .select('user_id')
          .eq('company_id', company.id)
          .in('role', ['owner', 'admin'])
          .neq('user_id', userId)
          .limit(1);

        if (adminsError) {
          console.error('Error finding other admins:', adminsError);
          continue;
        }

        if (otherAdmins && otherAdmins.length > 0) {
          // Transfer ownership to another admin
          console.log('Transferring ownership of company:', company.name);
          const { error: transferError } = await supabase
            .from('companies')
            .update({ created_by: otherAdmins[0].user_id })
            .eq('id', company.id);

          if (transferError) {
            console.error('Error transferring ownership:', transferError);
            throw new Error(`Failed to transfer ownership of company: ${company.name}`);
          }
        } else {
          // No other admins found, delete the entire company and its data
          console.log('Deleting company and all its data:', company.name);
          
          // Delete company members first
          await supabase.from('company_members').delete().eq('company_id', company.id);
          
          // Delete company invitations
          await supabase.from('company_invitations').delete().eq('company_id', company.id);
          
          // Delete departments
          await supabase.from('departments').delete().eq('company_id', company.id);
          
          // Delete categories
          await supabase.from('categories').delete().eq('company_id', company.id);
          
          // Delete company content settings
          await supabase.from('company_content_settings').delete().eq('company_id', company.id);
          
          // Delete ideas, hypotheses, experiments related to this company
          await supabase.from('ideas').delete().eq('company_id', company.id);
          await supabase.from('hypotheses').delete().eq('company_id', company.id);
          await supabase.from('experiments').delete().eq('company_id', company.id);
          
          // Finally delete the company
          const { error: deleteCompanyError } = await supabase
            .from('companies')
            .delete()
            .eq('id', company.id);

          if (deleteCompanyError) {
            console.error('Error deleting company:', deleteCompanyError);
            throw new Error(`Failed to delete company: ${company.name}`);
          }
        }
      }
    }

    // Step 2: Remove user from all company memberships
    const { error: membershipError } = await supabase
      .from('company_members')
      .delete()
      .eq('user_id', userId);

    if (membershipError) {
      console.error('Error removing company memberships:', membershipError);
      throw new Error('Failed to remove company memberships');
    }

    // Step 3: Delete user's personal data
    await supabase.from('ideas').delete().eq('userid', userId);
    await supabase.from('hypotheses').delete().eq('userid', userId);
    await supabase.from('experiments').delete().eq('userid', userId);
    await supabase.from('team_members').delete().eq('user_id', userId);
    await supabase.from('user_roles').delete().eq('user_id', userId);
    await supabase.from('super_admin_users').delete().eq('user_id', userId);

    // Step 4: Delete user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      throw new Error('Failed to delete user profile');
    }

    // Step 5: Finally delete the user from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting user from auth:', authError);
      throw new Error('Failed to delete user from authentication');
    }

    console.log('Successfully deleted user:', userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully',
        userId: userId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in delete-user function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
