import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface PolicyLayoutProps {
  title: string;
  content: string;
}

export default function PolicyLayout({ title, content }: PolicyLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#1F2937] text-white px-8 py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#E63946]/20 to-transparent opacity-50" />
            <div className="relative z-10">
              <span className="w-12 h-1.5 rounded-full bg-[#E63946] block mb-4"></span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                {title}
              </h1>
              <p className="text-slate-400 text-sm mt-2 font-medium">
                Mr.Korea Online Store Policies & Customer Information
              </p>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-8 md:p-12 text-slate-700 leading-relaxed font-medium whitespace-pre-line text-base md:text-lg">
            {content}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
