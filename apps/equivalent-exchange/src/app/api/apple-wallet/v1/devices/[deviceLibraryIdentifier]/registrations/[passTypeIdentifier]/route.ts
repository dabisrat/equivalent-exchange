import { NextRequest, NextResponse } from "next/server";
import { getSerialNumbersForDevice } from "@eq-ex/shared/apple-wallet";

/**
 * GET endpoint: Get serial numbers for passes associated with a device
 * Required by Apple Wallet Web Service
 * https://developer.apple.com/documentation/walletpasses/get_the_list_of_updatable_passes
 */
export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      deviceLibraryIdentifier: string;
      passTypeIdentifier: string;
    }>;
  }
) {
  try {
    const { deviceLibraryIdentifier, passTypeIdentifier } = await params;
    const url = new URL(request.url);
    const passesUpdatedSince = url.searchParams.get("passesUpdatedSince");

    const result = await getSerialNumbersForDevice(
      deviceLibraryIdentifier,
      passTypeIdentifier,
      passesUpdatedSince || undefined
    );

    if (result.serialNumbers.length === 0) {
      // Return 204 No Content if there are no matching passes
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(
      {
        serialNumbers: result.serialNumbers,
        lastUpdated: result.lastUpdated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting serial numbers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
