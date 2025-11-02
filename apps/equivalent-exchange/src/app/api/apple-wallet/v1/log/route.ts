import { NextRequest, NextResponse } from "next/server";

/**
 * POST endpoint: Log errors from Apple Wallet
 * Required by Apple Wallet Web Service
 * https://developer.apple.com/documentation/walletpasses/log_a_message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logs } = body;

    if (!logs || !Array.isArray(logs)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Log each message - in production, send these to your logging service
    logs.forEach((log: string) => {
      console.error("[Apple Wallet Error]:", log);
    });

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Error processing wallet logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
