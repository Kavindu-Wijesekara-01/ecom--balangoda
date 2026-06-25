"use client";

import { useRouter } from "next/navigation";

export default function Footer() {
  const router = useRouter();

  return (
    <footer className="bg-[#1F2937] text-slate-300 pt-12 border-t border-gray-700">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* Responsive Grid: Mobile 1 column, Tablet 2, Desktop 4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-10 md:mb-16">
          
          {/* 1. Brand Section */}
          <div className="flex flex-col items-start text-left">
            <h1 
              className="text-3xl font-black tracking-widest cursor-pointer flex items-center mb-5" 
              onClick={() => router.push('/')}
              style={{ color: '#E63946', filter: 'drop-shadow(2px 3px 2px rgba(0,0,0,0.5))' }}
            >
              MR.K
              <span style={{ background: 'linear-gradient(to bottom, #E63946 50%, #1D4ED8 50%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', WebkitTextStroke: '0.5px #FFFFFF' }}>O</span>
              REA
            </h1>
            <p className="text-sm leading-relaxed text-slate-400 font-medium">
              Your ultimate online destination for premium products. Delivering excellence to your doorstep.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-6">
              <a 
                href="https://www.facebook.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-gray-600 hover:bg-[#E63946] hover:border-[#E63946] transition-all"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                  <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.45 2.91h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94Z"/>
                </svg>
              </a>
              <a 
                href="https://wa.me/94711222555" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-gray-600 hover:bg-[#E63946] hover:border-[#E63946] transition-all"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                  <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.38a9.96 9.96 0 0 0 4.79 1.22h.01c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.17c-1.5 0-2.96-.4-4.22-1.16l-.3-.18-3.12.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.26-4.36c0-4.52 3.68-8.2 8.2-8.2 2.19 0 4.25.85 5.8 2.4a8.13 8.13 0 0 1 2.4 5.8c0 4.52-3.68 8.23-8.13 8.23Zm4.48-6.15c-.25-.12-1.45-.71-1.67-.8-.22-.08-.39-.12-.55.13-.16.24-.63.79-.78.95-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.12-.12.27-.31.41-.46.14-.16.18-.27.28-.45.09-.18.05-.34-.02-.46-.08-.12-.55-1.32-.75-1.8-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01-.16 0-.42.06-.64.3-.22.25-.85.83-.85 2.01s.87 2.33 1 2.49c.13.16 1.74 2.65 4.22 3.61 2.48.96 2.48.64 2.93.6.45-.04 1.45-.59 1.65-1.16.21-.57.21-1.05.15-1.16-.06-.1-.23-.16-.48-.28Z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* 2. Contact */}
          <div className="flex flex-col items-start text-left">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-6">Get In Touch</h3>
            <ul className="space-y-4 text-sm font-semibold">
              <li className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[#E63946]/10 text-[#E63946]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/>
                  </svg>
                </span>
                <span>0711222555</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[#E63946]/10 text-[#E63946]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <a href="mailto:mrkoreabalangoda@gmail.com" className="hover:text-white transition-colors break-all">mrkoreabalangoda@gmail.com</a>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[#E63946]/10 text-[#E63946]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </span>
                <span>141/C, Barns Rathwathta Mawatha, Balangoda</span>
              </li>
            </ul>
          </div>

          {/* 3. Google Map */}
          <div className="flex flex-col items-start w-full md:col-span-2 lg:col-span-2">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Find Us</h3>
            <div className="w-full max-w-full h-48 rounded-xl overflow-hidden border border-gray-600 shadow-lg">
              
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.0020009171317!2d80.6962937744812!3d6.646671321720816!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae3f30041f9616b%3A0xad17adfb38277afe!2sMr%20korea!5e0!3m2!1sen!2slk!4v1781536435751!5m2!1sen!2slk" 
                width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
              ></iframe>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 pb-8 border-t border-gray-700 flex flex-col items-center gap-4 text-xs font-bold text-slate-500">
          <p>© {new Date().getFullYear()} Mr.Korea Online Shop. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}