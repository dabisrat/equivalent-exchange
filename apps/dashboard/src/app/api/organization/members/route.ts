import {
  createClient as createServerClient,
  supabaseAdmin,
} from "@eq-ex/shared/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Service role client (bypasses RLS)

// Validation schema for adding members
const addMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["member", "admin"]).default("member"),
  name: z.string().optional(),
  organization_id: z.string().min(1, "organization_id is required"),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const organization_id = url.searchParams.get("organization_id");

    if (!organization_id) {
      return NextResponse.json(
        { error: "organization_id is required" },
        { status: 400 }
      );
    }

    // Get authenticated user using regular client
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is owner/admin in the requested organization
    const { data: userMembership, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .in("role", ["owner", "admin"])
      .maybeSingle();

    if (memberError || !userMembership) {
      return NextResponse.json(
        { error: "Not authorized to view members" },
        { status: 403 }
      );
    }

    // Get all members for this organization using service role
    const { data: members, error: membersError } = await supabaseAdmin
      .from("organization_members")
      .select(
        `
        user_id,
        email,
        name,
        role,
        is_active,
        invited_at,
        invited_by,
        created_at
      `
      )
      .eq("organization_id", organization_id)
      .order("created_at", { ascending: true });

    if (membersError) {
      console.error("Error fetching members:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      members,
      organization_id,
      user_role: userMembership.role,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = addMemberSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, role, name, organization_id } = validationResult.data;

    // Verify user is owner/admin in the specified organization
    const { data: userMembership, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .in("role", ["owner", "admin"])
      .maybeSingle();

    if (memberError || !userMembership) {
      return NextResponse.json(
        { error: "Not authorized to add members" },
        { status: 403 }
      );
    }

    // Check if member already exists in the specified organization
    const { data: existingMember } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("organization_id", organization_id)
      .eq("email", email)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        { error: "Member already exists" },
        { status: 409 }
      );
    }

    // Check if user exists in Supabase Auth
    const { data: userList, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error("Error listing users:", listError);
      return NextResponse.json(
        { error: "Failed to check user existence" },
        { status: 500 }
      );
    }
    const existingUser = userList?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      // Add active member with user_id
      const { data: newMember, error: insertError } = await supabaseAdmin
        .from("organization_members")
        .insert({
          organization_id,
          user_id: existingUser.id,
          email,
          name: name || email.split("@")[0],
          role,
          is_active: true,
          invited_by: user.id,
          invited_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (insertError) {
        console.error("Error adding member:", insertError);
        return NextResponse.json(
          { error: "Failed to add member" },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { member: newMember, status: "added" },
        { status: 201 }
      );
    } else {
      // Invite user via Supabase Auth Admin
      const reqUrl = new URL(request.url);
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || reqUrl.origin;
      const callbackUrl = `${baseUrl}/login`;
      const invitedAt = new Date().toISOString();
      const { data: inviteData, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: callbackUrl,
          data: {
            invited_org: organization_id,
          },
        });
      if (inviteError) {
        console.error("Error inviting user:", inviteError);
        return NextResponse.json(
          { error: "Failed to send invite" },
          { status: 500 }
        );
      }
      // Use inviteData.user.id to insert a member row with is_active: false
      const invitedUserId = inviteData?.user?.id;
      if (invitedUserId) {
        const { error: insertPendingError } = await supabaseAdmin
          .from("organization_members")
          .insert({
            organization_id,
            user_id: invitedUserId,
            email,
            name: name || email.split("@")[0],
            role,
            is_active: false,
            invited_by: user.id,
            invited_at: invitedAt,
          });
        if (insertPendingError) {
          console.error("Error inserting pending member:", insertPendingError);
          // Not a hard failure, but log for audit
        }
      }
      return NextResponse.json({ status: "invited" }, { status: 201 });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
