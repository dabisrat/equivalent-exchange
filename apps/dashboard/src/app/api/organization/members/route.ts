import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from "@eq-ex/shared/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Service role client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for adding members
const addMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(['member', 'admin', 'owner']).default('member'),
  name: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    // Get authenticated user using regular client
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an owner/admin of any organization
    const { data: userMembership, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .in('role', ['owner', 'admin'])
      .single();

    if (memberError || !userMembership) {
      return NextResponse.json({ error: "Not authorized to view members" }, { status: 403 });
    }

    // Get all members for this organization using service role
    const { data: members, error: membersError } = await supabaseAdmin
      .from('organization_members')
      .select(`
        user_id,
        email,
        name,
        role,
        is_active,
        invited_at,
        invited_by,
        created_at
      `)
      .eq('organization_id', userMembership.organization_id)
      .order('created_at', { ascending: true });

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }

    return NextResponse.json({
      members,
      organization_id: userMembership.organization_id,
      user_role: userMembership.role
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = addMemberSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid input",
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { email, role, name } = validationResult.data;

    // Verify user is owner/admin
    const { data: userMembership, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .in('role', ['owner', 'admin'])
      .single();

    if (memberError || !userMembership) {
      return NextResponse.json({ error: "Not authorized to add members" }, { status: 403 });
    }

    // Check if member already exists
    const { data: existingMember } = await supabaseAdmin
      .from('organization_members')
      .select('id')
      .eq('organization_id', userMembership.organization_id)
      .eq('email', email)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: "Member already exists" }, { status: 409 });
    }

    // Add new member using service role
    const { data: newMember, error: insertError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: userMembership.organization_id,
        user_id: null, // Will be filled when they accept invitation
        email,
        name: name || email.split('@')[0],
        role,
        is_active: false, // Inactive until they accept
        invited_by: user.id,
        invited_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding member:', insertError);
      return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
    }

    return NextResponse.json({ member: newMember }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
