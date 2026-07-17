import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const orderId = searchParams.get("orderId");
    
    let query: any = {};
    if (orderId) {
      query = { orderId };
    } else {
      // Exclude unpaid online payment orders from dashboard, analytics, and user lists
      const unpaidFilter = {
        $or: [
          { paymentMethod: { $ne: "payhere" } },
          { paymentMethod: "payhere", status: { $nin: ["Pending", "Cancelled"] } }
        ]
      };
      
      if (email) {
        query = {
          $and: [
            { "customer.email": email },
            unpaidFilter
          ]
        };
      } else {
        query = unpaidFilter;
      }
    }
    
    const orders = await Order.find(query).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    // මේකෙන් Order එක Database එකේ සේව් වෙනවා
    const newOrder = await Order.create(body);
    
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Order Save Error:", error);
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const orderId = searchParams.get("orderId");
    await connectToDatabase();
    
    if (orderId) {
      await Order.findOneAndDelete({ orderId });
    } else if (id) {
      await Order.findByIdAndDelete(id);
    } else {
      return NextResponse.json({ error: "Missing id or orderId parameter" }, { status: 400 });
    }
    
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const { id, status } = await req.json();
    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Order Update Error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}