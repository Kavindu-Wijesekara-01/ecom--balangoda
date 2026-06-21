export default function Loading() {
  return (
    <div className="fixed inset-0 bg-[#0f172a] z-[9999] flex flex-col justify-center items-center overflow-hidden">
      
      {/* ---------------- ANIMATED SPINNER ---------------- */}
      <div className="relative flex justify-center items-center w-24 h-24 mb-8">
        {/* Outer Orange Ring (Fast Spin) */}
        <div className="absolute w-full h-full border-4 border-slate-800 border-t-[#f97316] border-r-[#f97316] rounded-full animate-spin"></div>
        
        {/* Middle White Ring (Reverse Slow Spin) */}
        <div className="absolute w-16 h-16 border-4 border-slate-800 border-b-white border-l-white rounded-full animate-[spin_1.5s_linear_reverse_infinite]"></div>
        
        {/* Inner Pulsing Core */}
        <div className="absolute w-4 h-4 bg-[#f97316] rounded-full animate-pulse shadow-[0_0_15px_#f97316]"></div>
      </div>

      {/* ---------------- LOADING TEXT ---------------- */}
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-white text-sm md:text-base font-bold tracking-[0.3em] uppercase animate-pulse">
          Preparing Experience
        </h2>
        <div className="flex gap-1.5 mt-1">
          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
      
    </div>
  );
}