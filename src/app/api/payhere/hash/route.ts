import { NextResponse } from "next/server";
import md5 from "crypto-js/md5";

// Server-side hash generation for PayHere
// Hash MUST be generated server-side to keep PAYHERE_MERCHANT_SECRET safe
export async function POST(req: Request) {
  try {
    const { orderId, amount, currency } = await req.json();

    const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantId || !merchantSecret) {
      return NextResponse.json(
        { error: "PayHere credentials not configured in .env.local" },
        { status: 500 }
      );
    }

    // Amount MUST be formatted as "1245.00" — no commas, 2 decimal places
    // toFixed(2) is server-safe unlike toLocaleString which is locale-dependent
    const amountFormatted = parseFloat(amount).toFixed(2);

    // PayHere hash formula:
    // md5(merchantId + orderId + amount + currency + md5(merchantSecret).toUpperCase()).toUpperCase()
    const hashedSecret = md5(merchantSecret).toString().toUpperCase();
    const hash = md5(
      merchantId + orderId + amountFormatted + currency + hashedSecret
    )
      .toString()
      .toUpperCase();

    return NextResponse.json({ hash, amountFormatted, merchantId });
  } catch (error) {
    console.error("PayHere hash generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate hash" },
      { status: 500 }
    );
  }
}
