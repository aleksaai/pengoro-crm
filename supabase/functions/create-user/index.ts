import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Creating user account...');
    
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not found');
    }
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create the user
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'aleksa@pengoro.com',
      password: 'Tijana_2011',
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: 'Aleksa Spalevic'
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user', details: createError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('User created successfully:', user.user?.email);

    // Ensure profile exists with both id and user_id
    const profileId = crypto.randomUUID();
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: profileId,
        user_id: user.user!.id,
        email: user.user!.email,
        full_name: 'Aleksa Spalevic'
      });

    if (insertError) {
      console.error('Profile insert failed (possibly already exists):', insertError);
    } else {
      console.log('Profile created with id and user_id:', { id: profileId, user_id: user.user!.id });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User account created successfully',
        user: {
          id: user.user?.id,
          email: user.user?.email,
          full_name: user.user?.user_metadata?.full_name
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});