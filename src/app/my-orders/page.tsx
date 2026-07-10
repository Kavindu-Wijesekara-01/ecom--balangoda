"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import jsPDF from "jspdf";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const STORE_CONTACT = "0711222555";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    Pending:      { label: "Pending",       className: "bg-yellow-150 text-yellow-800 border-yellow-200 bg-yellow-50" },
    Proceed:      { label: "Proceed",       className: "bg-blue-150 text-blue-800 border-blue-200 bg-blue-50" },
    "On the way": { label: "On the way",    className: "bg-orange-150 text-orange-800 border-orange-200 bg-orange-50" },
    Delivered:    { label: "Delivered",     className: "bg-green-150 text-green-800 border-green-200 bg-green-50" },
    Cancelled:    { label: "Cancelled",     className: "bg-red-150 text-red-800 border-red-200 bg-red-50" },
    Processing:   { label: "Proceed",       className: "bg-blue-150 text-blue-800 border-blue-200 bg-blue-50" },
    Completed:    { label: "Delivered",     className: "bg-green-150 text-green-800 border-green-200 bg-green-50" },
  };
  const cfg = config[status] ?? { label: status, className: "bg-gray-50 text-gray-700 border-gray-200" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${cfg.className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  );
}

const getStepIndex = (status: string) => {
  switch (status) {
    case "Pending": return 0;
    case "Proceed":
    case "Processing":
      return 1;
    case "On the way": return 2;
    case "Delivered":
    case "Completed":
      return 3;
    default: return 0;
  }
};

function OrderProgressBar({ status }: { status: string }) {
  const steps = [
    { label: "Pending", icon: "🕒", desc: "Placed" },
    { label: "Proceed", icon: "⚙️", desc: "Confirmed" },
    { label: "On the way", icon: "🚚", desc: "Shipped" },
    { label: "Delivered", icon: "✅", desc: "Delivered" }
  ];

  const currentStep = getStepIndex(status);
  const isCancelled = status === "Cancelled";

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 my-4">
        <span className="text-xl">❌</span>
        <div>
          <p className="font-extrabold text-red-800 text-sm">Order Cancelled</p>
          <p className="text-xs text-red-500 font-bold">This order was cancelled or returned.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 px-1 my-2 bg-slate-50/50 rounded-2xl border border-slate-100/50">
      <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-5 px-4">Delivery Progress</p>
      
      <div className="relative flex justify-between items-center w-full px-4 sm:px-8">
        {/* Progress Line */}
        <div className="absolute top-[18px] left-[10%] right-[10%] h-[3px] bg-slate-200 z-0">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700 ease-out"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step Nodes */}
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const isFuture = idx > currentStep;

          return (
            <div key={idx} className="flex flex-col items-center z-10 relative flex-1">
              {/* Circle Icon */}
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm border-2
                  ${isCompleted ? 'bg-emerald-500 text-white border-emerald-500 scale-105 shadow-emerald-100' : ''}
                  ${isActive ? 'bg-white text-emerald-600 border-emerald-500 scale-110 ring-4 ring-emerald-100/50 animate-pulse' : ''}
                  ${isFuture ? 'bg-white text-slate-400 border-slate-250' : ''}
                `}
              >
                {isCompleted ? "✓" : step.icon}
              </div>

              {/* Step Labels */}
              <p className={`text-xs font-black mt-2.5 ${isActive ? 'text-emerald-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                {step.label}
              </p>
              <p className="text-[9px] text-slate-400 font-bold mt-0.5 hidden sm:block">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isAuthChecking, setIsAuthChecking]   = useState(true);
  const [username, setUsername]               = useState("");
  const [userEmail, setUserEmail]             = useState("");
  const [orders, setOrders]                   = useState<any[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [expandedOrder, setExpandedOrder]     = useState<string | null>(null);
  const [toast, setToast]                     = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  // ── Auth Check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const user      = localStorage.getItem("user");
    const authEmail = localStorage.getItem("user_email");
    const activeUser  = user || (session?.user as any)?.username;
    const activeEmail = authEmail || session?.user?.email || "";

    if (status !== "loading") {
      if (!activeUser) {
        router.push("/login?callbackUrl=/my-orders");
      } else {
        setUsername(activeUser);
        setUserEmail(activeEmail);
        setIsAuthChecking(false);
      }
    }
  }, [session, status, router]);

  // ── Fetch Orders ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthChecking || !userEmail) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/orders?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) setOrders(await res.json());
      } catch { /* silent */ }
      finally { setIsLoading(false); }
    };
    load();
  }, [isAuthChecking, userEmail]);

  // ── Toast helper ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast(p => ({ ...p, show: false })), 3000);
    return () => clearTimeout(t);
  }, [toast.show, toast.message]);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ show: true, message, type });

  // ── PDF Download ──────────────────────────────────────────────────────────────
  const downloadReceipt = (order: any) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");

      doc.setFontSize(26);
      doc.setTextColor(230, 57, 70);
      doc.setFont("helvetica", "bold");
      doc.text("MR.KOREA", 105, 25, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text("Your Premium Store", 105, 32, { align: "center" });
      doc.text(`Contact: ${STORE_CONTACT}`, 105, 38, { align: "center" });

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(20, 45, 190, 45);

      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "bold");
      doc.text("BILLED TO:", 20, 55);
      doc.text("ORDER DETAILS:", 190, 55, { align: "right" });

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(12);
      doc.text(order.customer.name, 20, 62);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(order.customer.phone, 20, 68);
      const splitAddr = doc.splitTextToSize(order.customer.address, 60);
      doc.text(splitAddr, 20, 74);

      doc.setFont("helvetica", "bold");
      doc.text("ID: ", 150, 62);
      doc.setTextColor(230, 57, 70);
      doc.text(order.orderId, 190, 62, { align: "right" });

      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${order.time}`, 190, 68, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(`Payment: ${order.paymentMethod === "cod" ? "CASH ON DELIVERY" : "ONLINE PAYMENT (PAYHERE)"}`, 190, 74, { align: "right" });

      let y = 90;
      doc.setFillColor(31, 41, 55);
      doc.rect(20, y, 170, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.text("Item", 25, y + 6.5);
      doc.text("Qty", 130, y + 6.5, { align: "center" });
      doc.text("Price", 185, y + 6.5, { align: "right" });

      y += 16;
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "normal");
      order.items.forEach((item: any) => {
        const variation = [item.selectedSize, item.selectedColor].filter(Boolean).join(" / ");
        const displayName = variation ? `${item.name} [${variation}]` : item.name;
        const splitName = doc.splitTextToSize(displayName, 90);
        doc.text(splitName, 25, y);
        doc.text((item.quantity || 1).toString(), 130, y, { align: "center" });
        doc.text(`Rs ${(item.price * (item.quantity || 1)).toLocaleString()}`, 185, y, { align: "right" });
        y += splitName.length * 6 + 4;
      });

      y += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(100, y, 190, y);
      y += 8;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("Total Amount:", 120, y);
      doc.setTextColor(230, 57, 70);
      doc.text(`Rs ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 190, y, { align: "right" });

      y += 25;
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("Thank you for shopping with Mr.Korea!", 105, y, { align: "center" });

      doc.save(`Receipt_${order.orderId}.pdf`);
      showToast("Receipt downloaded!", "success");
    } catch (err) {
      console.error("PDF error", err);
      showToast("Failed to generate receipt", "error");
    }
  };

  // ── Loading screen ────────────────────────────────────────────────────────────
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E63946] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[600px] rounded-full bg-blue-100/30 blur-3xl" />
        <div className="absolute top-[20%] -right-[10%] w-[45%] h-[500px] rounded-full bg-red-100/20 blur-3xl" />
      </div>

      {/* Toast */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-out flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl bg-white border ${toast.show ? "translate-y-0 opacity-100" : "-translate-y-16 opacity-0 pointer-events-none"} ${toast.type === "success" ? "border-emerald-200" : "border-red-200"}`}>
        {toast.type === "success"
          ? <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex justify-center items-center text-sm font-black">✓</div>
          : <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex justify-center items-center text-sm font-black">✕</div>}
        <span className="font-bold text-[13px] text-[#111827] whitespace-nowrap">{toast.message}</span>
      </div>

      {/* ── Navbar ─────────────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Main Content ───────────────────────────────────────────────────────── */}
      <main className="container mx-auto px-4 md:px-6 mt-8 mb-16 max-w-4xl relative z-10">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#E63946] rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#111827]">My Orders</h1>
              <p className="text-sm text-gray-500 font-medium">Track and manage your purchases</p>
            </div>
          </div>
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-40" />
                    <div className="h-3 bg-slate-200 rounded w-28" />
                  </div>
                  <div className="h-6 bg-slate-200 rounded-full w-24" />
                </div>
                <div className="h-3 bg-slate-200 rounded w-full mb-2" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-100">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-[#111827] mb-2">No Orders Yet</h3>
            <p className="text-gray-500 text-sm font-medium mb-6">You haven&apos;t placed any orders yet. Start shopping!</p>
            <button
              onClick={() => router.push("/")}
              className="bg-[#E63946] hover:bg-[#C1121F] text-white px-8 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm"
            >
              Start Shopping →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-1">Total Orders</p>
                <p className="text-2xl font-black text-[#111827]">{orders.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-1">Total Spent</p>
                <p className="text-2xl font-black text-[#E63946]">
                  Rs {orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm col-span-2 md:col-span-1">
                <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-1">Delivered</p>
                <p className="text-2xl font-black text-green-600">
                  {orders.filter(o => o.status === "Delivered" || o.status === "Completed").length}
                </p>
              </div>
            </div>

            {/* Order cards */}
            {orders.map((order) => {
              const isExpanded = expandedOrder === order._id;
              return (
                <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Card header */}
                  <div
                    className="p-4 md:p-5 cursor-pointer select-none"
                    onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-black text-sm md:text-base text-[#111827]">{order.orderId}</p>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">{order.time}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""} ·{" "}
                            <span className="font-bold text-[#111827]">Rs {order.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-13 sm:ml-0">
                        <StatusBadge status={order.status || "Pending"} />
                        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 md:px-5 pb-5">
                      
                      {/* Cool Progress Tracker Stepper */}
                      <OrderProgressBar status={order.status || "Pending"} />

                      {/* Items table */}
                      <div className="mt-6 mb-4">
                        <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-3">Order Items</p>
                        <div className="space-y-2">
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                              <div>
                                <p className="font-bold text-sm text-[#111827]">{item.name}</p>
                                {(item.selectedSize || item.selectedColor) && (
                                  <div className="flex gap-1.5 mt-1">
                                    {item.selectedSize && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.selectedSize}</span>}
                                    {item.selectedColor && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.selectedColor}</span>}
                                  </div>
                                )}
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                <p className="text-xs text-gray-400 font-medium">×{item.quantity || 1}</p>
                                <p className="font-black text-sm text-[#E63946]">Rs {(item.price * (item.quantity || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Totals row */}
                      <div className="flex justify-between items-center py-3 border-t border-gray-100">
                        <span className="font-bold text-sm text-gray-600">Total Amount</span>
                        <span className="font-black text-base text-[#111827]">Rs {order.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>

                      {/* Customer details */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                        <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-3">Delivery Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400 font-medium">Name: </span>
                            <span className="font-bold text-[#111827]">{order.customer?.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-medium">Phone: </span>
                            <span className="font-bold text-[#111827]">{order.customer?.phone}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-medium">Payment: </span>
                            <span className="font-bold text-[#111827]">
                              {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment (PayHere)"}
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-gray-400 font-medium">Address: </span>
                            <span className="font-bold text-[#111827]">{order.customer?.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Download receipt button */}
                      <button
                        onClick={() => downloadReceipt(order)}
                        className="w-full flex items-center justify-center gap-2 bg-[#1F2937] hover:bg-[#111827] text-white py-3 rounded-xl font-bold text-sm transition-colors active:scale-[0.98]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Receipt (PDF)
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
