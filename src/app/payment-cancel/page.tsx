"use client";

import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center border border-slate-100">

        {/* Cancel icon */}
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-[#E63946]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-[#111827] mb-2">
          Payment Cancelled
        </h1>

        <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium bg-gray-50 p-4 rounded-xl border border-gray-100">
          ඔබ payment cancel කළා. ඔබේ order save නොවුනා.
          <br />
          Cart ක eitems තවමත් ඔබේ cart ගේ ඇත. නැවත try කරන්න.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/checkout"
            className="w-full bg-[#E63946] hover:bg-[#C1121F] text-white py-3 rounded-xl font-bold transition text-sm"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition text-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
