"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Registration Successful! Please login." });
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setMessage({ type: "error", text: data.error || "Registration failed. Try again." });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage({ type: "error", text: "Something went wrong. Please try again later." });
    } finally {
      setIsLoading(false);
    }
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
                //WebkitTextStroke: '1px #FFFFFF', 
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
              placeholder="Choose a username"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-gray-50 text-black font-medium transition"
              placeholder="Enter your email"
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
              placeholder="Create a strong password"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading} 
            className={`w-full text-white py-3 rounded-xl font-black text-lg transition shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
            style={{ backgroundColor: '#E63946' }}
          >
            {isLoading ? 'REGISTERING...' : 'REGISTER'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500 text-sm font-semibold">
          Already have an account? <Link href="/login" className="text-[#1D4ED8] font-bold hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
}