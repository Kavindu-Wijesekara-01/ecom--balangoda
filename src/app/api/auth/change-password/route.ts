import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    
    if (!token) return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    
    const decoded: any = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: "Only admins can perform this action" }, { status: 403 });
    }

    const { oldPassword, newPassword } = await req.json();
    await connectToDatabase();

    const tokenUsername = decoded.username || decoded.name; 
    
    if (!tokenUsername) {
        return NextResponse.json({ error: "Invalid session. Please log out and log in again." }, { status: 400 });
    }

    const user = await User.findOne({ username: tokenUsername });
    if (!user) {
      return NextResponse.json({ error: "Admin account not found in DB" }, { status: 404 });
    }

    // 🔒 FIX 1: පාස්වර්ඩ් වල අගට/මුලට වැරදිලා Space එකක් වැදිලා තිබ්බොත් ඒක අයින් කරනවා
    const cleanOldPass = oldPassword.trim();
    const cleanNewPass = newPassword.trim();

    const isMatch = await bcrypt.compare(cleanOldPass, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect old password!" }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(cleanNewPass, 10);
    
    // 🔒 FIX 2: user.save() වෙනුවට 100% ෂුවර් updateOne ක්‍රමය පාවිච්චි කිරීම
    await User.updateOne(
      { username: tokenUsername },
      { $set: { password: hashedNewPassword } }
    );

    return NextResponse.json({ message: "Password updated successfully!" }, { status: 200 });

  } catch (error) {
    console.error("Change Password Error:", error);
    return NextResponse.json({ error: "Something went wrong on the server." }, { status: 500 });
  }
}