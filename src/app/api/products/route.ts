import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Product from "@/models/Product";
// පහලින් තියෙන Category import එක අනිවාර්යයි! නැත්නම් populate වෙන්නේ නෑ.
import Category from "@/models/Category"; 

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    
    // Category එකත් එක්කම products ටික ගන්නවා
    const products = await Product.find({}).populate("categoryId");
    
    return NextResponse.json(products);
  } catch (error: any) {
    // මොකක් හරි අවුලක් ගියොත් Terminal එකේ රතු පාටින් පෙන්නනවා
    console.error("❌ API Route Error (GET /products):", error.message); 
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const newProduct = await Product.create(body);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error("❌ API Route Error (POST /products):", error.message);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}