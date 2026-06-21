import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    // name වෙනුවට username ගන්නවා
    const { username, email, password } = await req.json();

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json({ error: 'Username or Email already exists!' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword,
      role: username === 'mrkorea' ? 'admin' : 'user'
    });
    
    await newUser.save();

    return NextResponse.json({ message: 'Registration Successful!' }, { status: 201 });
  } catch (error) {
    console.error("Register API Error:", error);
    return NextResponse.json({ error: 'Something went wrong on the server.' }, { status: 500 });
  }
}