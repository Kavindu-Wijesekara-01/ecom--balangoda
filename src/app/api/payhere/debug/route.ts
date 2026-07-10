import { NextResponse } from "next/server";
import md5 from "crypto-js/md5";

// Debug endpoint to verify credentials are loading correctly
export async function GET() {
  const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const mode = process.env.NEXT_PUBLIC_PAYHERE_MODE;

  if (!merchantId || merchantId === "YOUR_SANDBOX_MERCHANT_ID") {
    return NextResponse.json({ error: "NEXT_PUBLIC_PAYHERE_MERCHANT_ID not set!" }, { status: 500 });
  }
  if (!merchantSecret || merchantSecret === "YOUR_SANDBOX_MERCHANT_SECRET") {
    return NextResponse.json({ error: "PAYHERE_MERCHANT_SECRET not set!" }, { status: 500 });
  }

  // Test hash with sample values
  const testOrderId = "TEST-123";
  const testAmount = "1000.00";
  const currency = "LKR";

  const hashedSecret = md5(merchantSecret).toString().toUpperCase();
  const hash = md5(merchantId + testOrderId + testAmount + currency + hashedSecret).toString().toUpperCase();

  return NextResponse.json({
    status: "OK",
    mode,
    merchantId,
    secretLength: merchantSecret.length,
    secretPreview: merchantSecret.substring(0, 6) + "..." + merchantSecret.substring(merchantSecret.length - 4),
    sampleHash: hash,
  });
}
