import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Banner from "@/models/Banner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const banners = await Banner.find({}).sort({ createdAt: -1 });
    return NextResponse.json(banners);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { imageUrl } = await req.json();
    const newBanner = await Banner.create({ imageUrl });
    return NextResponse.json(newBanner, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}