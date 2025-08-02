import { createClient as createServerClient } from "@eq-ex/shared/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Invite callback unauthorized:", authError);
      return NextResponse.json(
        { error: "Failed to process invite" },
        { status: 401 }
      );
    }

    const { invited_org } = user.user_metadata || {};

    if (!invited_org) {
      console.error("Missing invited_org metadata for user:", user.id);
      return NextResponse.json(
        { error: "Failed to process invite" },
        { status: 400 }
      );
    }

    const supabaseAdmin = await createServerClient(true);

    // Activate the member
    const { error: updateError } = await supabaseAdmin
      .from("organization_members")
      .update({ is_active: true })
      .eq("organization_id", invited_org)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to activate membership:", updateError, {
        organization_id: invited_org,
        user_id: user.id,
      });
      return NextResponse.json(
        { error: "Failed to process invite" },
        { status: 500 }
      );
    }

    // Clean up invite metadata
    const { error: metadataError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          invited_org: undefined,
        },
      });

    if (metadataError) {
      console.warn("Failed to clean up invite metadata:", metadataError, {
        user_id: user.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Invite callback error:", error);
    return NextResponse.json(
      { error: "Failed to process invite" },
      { status: 500 }
    );
  }
}
