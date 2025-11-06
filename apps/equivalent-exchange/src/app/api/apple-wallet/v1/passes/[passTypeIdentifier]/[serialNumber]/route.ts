import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@eq-ex/shared/server";
import { generateAppleWalletPass } from "@app/data-access/actions/generate-apple-pass";

/**
 * GET endpoint: Retrieve the latest version of a pass
 * Required by Apple Wallet Web Service
 * https://developer.apple.com/documentation/walletpasses/get_the_latest_version_of_a_pass
 */
export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      passTypeIdentifier: string;
      serialNumber: string;
    }>;
  }
) {
  try {
    const { passTypeIdentifier, serialNumber } = await params;

    // Validate authentication token from headers
    const authToken = request.headers
      .get("authorization")
      ?.replace("ApplePass ", "");

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get pass from database
    const { data: pass, error } = await supabaseAdmin
      .from("apple_wallet_passes")
      .select("card_id, authentication_token, user_id, last_updated_at")
      .eq("serial_number", serialNumber)
      .single();

    if (error || !pass) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }

    // Verify authentication token
    if (pass.authentication_token !== authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if pass has been updated since the If-Modified-Since header
    const ifModifiedSince = request.headers.get("if-modified-since");
    if (ifModifiedSince) {
      const lastUpdated = new Date(pass.last_updated_at);
      const modifiedSince = new Date(ifModifiedSince);

      if (lastUpdated <= modifiedSince) {
        return new NextResponse(null, { status: 304 });
      }
    }

    // Regenerate pass with existing serial number and credentials
    const result = await generateAppleWalletPass({
      cardId: pass.card_id,
      serialNumber: serialNumber,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: "Failed to generate pass" },
        { status: 500 }
      );
    }

    // Update last_updated_at timestamp
    await supabaseAdmin
      .from("apple_wallet_passes")
      .update({ last_updated_at: new Date().toISOString() })
      .eq("serial_number", serialNumber);

    // Return the pass file
    return new NextResponse(new Uint8Array(result.data), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Last-Modified": new Date().toUTCString(),
      },
    });
  } catch (error) {
    console.error("Error retrieving pass:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
