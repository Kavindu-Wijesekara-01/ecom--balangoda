import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { createToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // 1. Admin Auto-Create Logic:
    const adminExists = await User.findOne({ username: 'mrkorea' });
    if (!adminExists) {
      const hashedAdminPassword = await bcrypt.hash('mrkorea1234', 10);
      await User.create({
        username: 'mrkorea',
        email: 'admin@mrkorea.com',
        password: hashedAdminPassword,
        role: 'admin'
      });
    }

    // 2. Normal Login Logic:
    const { username, password } = await req.json();

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password!' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid password!' }, { status: 401 });
    }

    // 3. Token එකට username එක දානවා
    const token = await createToken({ 
      id: user._id, 
      username: user.username, 
      role: user.role 
    });

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return NextResponse.json({
      message: 'Login Successful!',
      user: { username: user.username, role: user.role, email: user.email }
    }, { status: 200 });
    
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}