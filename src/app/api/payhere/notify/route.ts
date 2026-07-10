import { NextResponse } from "next/server";
import md5 from "crypto-js/md5";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/models/Order";

// PayHere will POST payment status here after payment is processed.
// This MUST be accessible from the internet (not localhost) for live payments.
// For sandbox testing with localhost, you can use ngrok or verify manually.
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const merchantId = formData.get("merchant_id") as string;
    const orderId = formData.get("order_id") as string;
    const paymentId = formData.get("payment_id") as string;
    const payhereAmount = formData.get("payhere_amount") as string;
    const payhereCurrency = formData.get("payhere_currency") as string;
    const statusCode = formData.get("status_code") as string;
    const md5sig = formData.get("md5sig") as string;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantSecret) {
      console.error("PAYHERE_MERCHANT_SECRET not configured");
      return new Response("Server configuration error", { status: 500 });
    }

    // Verify md5sig to ensure this is a genuine PayHere notification
    const hashedSecret = md5(merchantSecret).toString().toUpperCase();
    const localMd5sig = md5(
      merchantId +
        orderId +
        payhereAmount +
        payhereCurrency +
        statusCode +
        hashedSecret
    )
      .toString()
      .toUpperCase();

    if (localMd5sig !== md5sig) {
      console.error("PayHere notify: md5sig mismatch! Possible fraud attempt.");
      return new Response("Invalid signature", { status: 400 });
    }

    // Update order in MongoDB based on status_code
    // status_code: 2 = Success, 0 = Pending, -1 = Cancelled, -2 = Failed, -3 = Chargedback
    await connectToDatabase();

    let newStatus: string;
    switch (statusCode) {
      case "2":
        newStatus = "Processing"; // Payment confirmed — mark as Processing
        break;
      case "0":
        newStatus = "Pending";
        break;
      case "-1":
        newStatus = "Cancelled";
        break;
      case "-2":
      case "-3":
        newStatus = "Cancelled";
        break;
      default:
        newStatus = "Pending";
    }

    await Order.findOneAndUpdate(
      { orderId: orderId },
      {
        status: newStatus,
        paymentId: paymentId,
        paymentMethod: "payhere", // Update method to confirm online payment
      }
    );

    console.log(
      `PayHere notify: Order ${orderId} updated to "${newStatus}" (status_code: ${statusCode})`
    );

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("PayHere notify error:", error);
    return new Response("Server error", { status: 500 });
  }
}
