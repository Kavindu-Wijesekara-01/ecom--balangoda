import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // එක පාර අනවශ්‍ය විදියට connections හැදෙන එක නවත්තනවා (Limit එක 10යි)
      serverSelectionTimeoutMS: 5000, // Server එක busy නම් තත්පර 5න් අඳුරගන්නවා
      socketTimeoutMS: 45000, // සයිට් එකට කවුරුත් නැති වෙලාවට Connection එක මැරෙන එක (Idle drop) නවත්තනවා
      family: 4 // IPv4 පාවිච්චි කරන්න බල කරනවා (සමහර වෙලාවට Vercel වල IP අවුල් එන එක නවතිනවා)
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB Connected Successfully!");
      return mongoose;
    }).catch((err) => {
      console.error("❌ MongoDB Connection Error Details: ", err.message);
      throw err;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Error එකක් ආවොත් ආයේ මුල ඉඳන් ට්‍රයි කරන්න 
    throw e;
  }
  
  return cached.conn;
}

export default connectToDatabase;