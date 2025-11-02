import { NextRequest, NextResponse } from "next/server";
import { registerDevice, unregisterDevice } from "@eq-ex/shared/apple-wallet";

/**
 * POST endpoint: Register a device to receive push notifications for a pass
 * Required by Apple Wallet Web Service
 * https://developer.apple.com/documentation/walletpasses/register_a_pass_for_update_notifications
 */
export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      deviceLibraryIdentifier: string;
      passTypeIdentifier: string;
      serialNumber: string;
    }>;
  }
) {
  try {
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } =
      await params;

    // Parse request body
    const body = await request.json();
    const { pushToken } = body;

    if (!pushToken) {
      return NextResponse.json(
        { error: "pushToken is required" },
        { status: 400 }
      );
    }

    // Validate authentication token from headers
    const authToken = request.headers
      .get("authorization")
      ?.replace("ApplePass ", "");

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Register the device (validates token internally)
    const result = await registerDevice({
      deviceLibraryIdentifier,
      passTypeIdentifier,
      serialNumber,
      pushToken,
      authenticationToken: authToken,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Registration failed" },
        { status: 500 }
      );
    }

    // Return 201 if newly registered, 200 if already registered
    return new NextResponse(null, { status: 201 });
  } catch (error) {
    console.error("Error registering device:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint: Unregister a device from receiving push notifications
 * Required by Apple Wallet Web Service
 * https://developer.apple.com/documentation/walletpasses/unregister_a_pass_for_update_notifications
 */
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      deviceLibraryIdentifier: string;
      passTypeIdentifier: string;
      serialNumber: string;
    }>;
  }
) {
  try {
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } =
      await params;

    // Validate authentication token from headers
    const authToken = request.headers
      .get("authorization")
      ?.replace("ApplePass ", "");

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Unregister the device (validates token internally)
    const result = await unregisterDevice({
      deviceLibraryIdentifier,
      passTypeIdentifier,
      serialNumber,
      authenticationToken: authToken,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Unregistration failed" },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Error unregistering device:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
