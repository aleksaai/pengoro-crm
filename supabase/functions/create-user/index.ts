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
    const { email, password, full_name } = await req.json();
    
    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, full_name' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Creating user account for:', email);
    
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
      email,
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: { full_name }
    });

    let targetUserId = user?.user?.id ?? null;
    let targetEmail = user?.user?.email ?? email;
    let created = true;

    if (createError) {
      const message = (createError as any)?.message || '';
      const isEmailExists = message.toLowerCase().includes('already been registered') || message.toLowerCase().includes('email') || (createError as any)?.status === 422;

      if (isEmailExists) {
        created = false;
        console.warn('User already exists, attempting to resolve by email:', email);
        // Try to find the user via admin listUsers paging
        let page = 1;
        const perPage = 100;
        let found: any = null;
        while (page <= 10 && !found) {
          const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
          if (listError) break;
          found = listData.users.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase());
          if (found) break;
          if (listData.users.length < perPage) break;
          page++;
        }
        if (!found) {
          return new Response(
            JSON.stringify({ error: 'User already exists but could not be retrieved to sync profile.' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        targetUserId = found.id;
        targetEmail = found.email;
      } else {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user', details: message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Ensure profile exists
    let profileExists = false;
    if (targetUserId) {
      const { data: existingProfiles, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', targetUserId)
        .limit(1);
      if (!checkError && existingProfiles && existingProfiles.length > 0) {
        profileExists = true;
      }

      if (!profileExists) {
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert({ user_id: targetUserId, email: targetEmail, full_name });
        if (insertError) {
          console.error('Profile insert failed:', insertError);
        } else {
          console.log('Profile created for user:', { user_id: targetUserId });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        created,
        message: created ? 'User account created successfully' : 'User already existed; profile synced',
        user: {
          id: targetUserId,
          email: targetEmail,
          full_name
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