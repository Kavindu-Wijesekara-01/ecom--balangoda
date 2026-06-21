import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    
    const { username, rating, comment } = await req.json();

    if (!username || !rating || !comment) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const newReview = { username, rating, comment };
    product.reviews.push(newReview);
    await product.save();

    return NextResponse.json({ message: "Review added successfully", reviews: product.reviews }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add review" }, { status: 500 });
  }
}