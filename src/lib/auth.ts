import { SignJWT, jwtVerify } from "jose";

// ඔයාගේ Secret Key එක (මේක වෙන කාටවත් දෙන්න එපා)
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "mrkorea_super_secret_key_2026");

// Token එකක් හදන්න (Login වෙද්දී)
export async function createToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h") // පැය 24කින් ලොග් අවුට් වෙනවා
    .sign(SECRET_KEY);
}

// Token එක චෙක් කරන්න (Admin පිටු වලට යද්දී)
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (error) {
    return null;
  }
}