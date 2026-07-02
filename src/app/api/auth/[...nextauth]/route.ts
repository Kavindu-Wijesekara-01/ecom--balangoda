import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectToDatabase();
          
          if (!user.email) return false;
          
          // Check if user already exists in MongoDB by email
          let dbUser = await User.findOne({ email: user.email });
          
          if (!dbUser) {
            // Generate a unique username from the email prefix or name
            const baseUsername = user.name 
              ? user.name.toLowerCase().replace(/\s+/g, "") 
              : user.email.split("@")[0].toLowerCase();
              
            let username = baseUsername;
            let usernameConflict = await User.findOne({ username });
            
            // Resolve conflicts if username already exists
            if (usernameConflict) {
              username = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
            }
            
            // Create user with default role 'user'
            dbUser = await User.create({
              username,
              email: user.email,
              role: "user",
            });
          }
          
          // Attach custom DB details back to the NextAuth user object
          // so they are available in subsequent callbacks (jwt, session)
          (user as any).role = dbUser.role || "user";
          (user as any).username = dbUser.username;
          return true;
        } catch (error) {
          console.error("Error checking/creating user in MongoDB during signIn:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.username = token.username;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "nextauth_secret_key_at_least_32_chars_2026",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
