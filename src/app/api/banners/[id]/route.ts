import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Banner from "@/models/Banner";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    await Banner.findByIdAndDelete(resolvedParams.id);
    return NextResponse.json({ message: "Banner deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}