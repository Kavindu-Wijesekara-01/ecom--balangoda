"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Login Successful! Redirecting..." });
        localStorage.setItem("user", data.user.username);

        setTimeout(() => {
          if (data.user.role === "admin") {
            router.push("/admin/dashboard");
          } else {
            router.push(callbackUrl);
          }
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Invalid username or password." });
      }
    } catch (error) {
      console.error("Login request failed:", error);
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-[#E63946]">
        
        {/* Logo Section */}
        <div 
          className="text-center mb-8 cursor-pointer flex justify-center items-center" 
          onClick={() => router.push('/')}
        >
          <h1 
            className="text-2xl md:text-3xl font-black tracking-widest cursor-pointer flex items-center" 
            onClick={() => router.push('/')}
            style={{
              color: '#E63946',
              filter: 'drop-shadow(2px 3px 2px rgba(0,0,0,0.5))' 
            }}
          >
            MR.K
            <span 
              style={{
                background: 'linear-gradient(to bottom, #E63946 50%, #1D4ED8 50%)', 
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                WebkitTextStroke: '0.5px #FFFFFF'
              }}
            >
              O
            </span>
            REA
          </h1>
        </div>

        {message.text && (
          <div className={`p-3 rounded-lg mb-6 font-bold text-center text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Username</label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-gray-50 text-black font-medium transition"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-gray-50 text-black font-medium transition"
              placeholder="Enter password"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading} 
            className={`w-full text-white py-3 rounded-xl font-black text-lg transition shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
            style={{ backgroundColor: '#E63946' }}
          >
            {isLoading ? 'PROCESSING...' : 'SIGN IN'}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <span className="relative px-3 bg-white text-gray-400 font-bold text-xs uppercase">OR</span>
        </div>

        <button 
          type="button" 
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-bold transition shadow-md hover:shadow-lg hover:border-gray-300"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.44 7.5l3.8 2.95C6.18 7.35 8.87 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.47h6.46c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.37-4.88 3.37-8.52z"
            />
            <path
              fill="#FBBC05"
              d="M5.24 14.59c-.23-.69-.36-1.42-.36-2.19 0-.77.13-1.5.36-2.19L1.44 7.5C.52 9.35 0 11.41 0 13.6c0 2.19.52 4.25 1.44 6.1l3.8-2.95c-.23-.69-.36-1.42-.36-2.19z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.67-2.31 1.09-3.7 1.09-3.13 0-5.82-2.31-6.76-5.41L1.04 16.2C3.37 20.35 7.35 23 12 23z"
            />
          </svg>
          <span className="text-gray-800 text-base font-extrabold tracking-wide">Sign in with Google</span>
        </button>

        <p className="text-center mt-6 text-gray-500 text-sm font-semibold">
          Don't have an account? <Link href="/register" className="text-[#1D4ED8] font-bold hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex justify-center items-center font-bold text-gray-500">
        Loading...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}