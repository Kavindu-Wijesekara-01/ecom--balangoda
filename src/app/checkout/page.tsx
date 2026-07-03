"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import jsPDF from "jspdf";
import Footer from "@/components/Footer";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // States
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    paymentMethod: "cod"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  
  // Custom Toast State
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false, message: "", type: "success"
  });

  const SELLER_WHATSAPP = "94770086050"; 
  const STORE_CONTACT = "0711222333";

  // Check auth and load cart
  useEffect(() => {
    const user = localStorage.getItem("user");
    const activeUser = user || (session?.user as any)?.username;
    
    // If next-auth session is finished loading and neither is authenticated, redirect
    if (status !== "loading") {
      if (!activeUser) {
        router.push("/login?callbackUrl=/checkout");
      } else {
        setIsAuthChecking(false);
      }
    }
  }, [session, status, router]);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const calculateTotal = () => {
    return cart.reduce((t, i) => t + Number(i.price.toString().replace(/[^0-9.-]+/g,"")) * (i.quantity || 1), 0);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const buildWhatsAppMessage = (orderData: any) => {
    const itemLines = cart
      .map((item: any) => {
        const variation = [item.selectedSize, item.selectedColor].filter(Boolean).join(" / ");
        const variationText = variation ? ` [${variation}]` : "";
        return `  • ${item.name}${variationText} × ${item.quantity} — Rs ${(item.price * item.quantity).toLocaleString()}`;
      })
      .join("\n");

    const paymentLabel = orderData.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer";

    return (
      `🛒 *New Order - MR.KOREA*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔖 *Order ID :* ${orderData.orderId}\n` +
      `⏱️ *Time :* ${orderData.time}\n\n` +
      `👤 *Customer Details*\n` +
      `  Name     : ${orderData.name}\n` +
      `  Phone    : ${orderData.phone}\n` +
      `  WhatsApp : ${orderData.whatsapp}\n\n` +
      `📦 *Order Items*\n` +
      `${itemLines}\n\n` +
      `💰 *Total : Rs ${calculateTotal().toFixed(2)}*\n` +
      `💳 *Payment : ${paymentLabel}*\n\n` +
      `🚚 *Delivery Address*\n` +
      `  ${orderData.address}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Please confirm my order!_`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast("Your cart is empty!", "error");
      return;
    }
    setIsSubmitting(true);

    try {
      const generatedOrderId = "MRK-" + Math.floor(100000 + Math.random() * 900000);
      const currentTime = new Date().toLocaleString();

      const orderItems = cart.map(item => ({
        name: item.name,
        price: Number(item.price.toString().replace(/[^0-9.-]+/g,"")),
        quantity: item.quantity || 1,
        selectedSize: item.selectedSize || "",
        selectedColor: item.selectedColor || ""
      }));

      const newOrderData = {
        orderId: generatedOrderId,
        time: currentTime,
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          address: formData.address,
        },
        paymentMethod: formData.paymentMethod,
        items: orderItems,
        totalAmount: calculateTotal()
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrderData)
      });

      if (res.ok) {
        // Save email so My Orders page can fetch this customer's orders
        localStorage.setItem("user_email", formData.email);
        setCompletedOrder({ ...formData, orderId: generatedOrderId, time: currentTime });
      } else {
        showToast("Something went wrong. Please try again.", "error");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      showToast("Failed to place order.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadAndWhatsApp = () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      
      // Header Section
      doc.setFontSize(26);
      doc.setTextColor(230, 57, 70); // #E63946 Red
      doc.setFont("helvetica");
      doc.text("MR.KOREA", 105, 25, { align: "center" });
      
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");
      doc.text("Your Premium Store", 105, 32, { align: "center" });
      doc.text(`Contact: ${STORE_CONTACT}`, 105, 38, { align: "center" });
      
      // Divider Line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(20, 45, 190, 45);
      
      // Billed To & Order Details Section
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "bold");
      doc.text("BILLED TO:", 20, 55);
      doc.text("ORDER DETAILS:", 190, 55, { align: "right" });
      
      doc.setTextColor(17, 24, 39); // Dark Gray
      doc.setFontSize(12);
      doc.text(completedOrder.name, 20, 62);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(completedOrder.phone, 20, 68);
      const splitAddress = doc.splitTextToSize(completedOrder.address, 60);
      doc.text(splitAddress, 20, 74);
      
      doc.setFont("helvetica", "bold");
      doc.text("ID: ", 150, 62);
      doc.setTextColor(230, 57, 70);
      doc.text(completedOrder.orderId, 190, 62, { align: "right" });
      
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${completedOrder.time}`, 190, 68, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(`Payment: ${completedOrder.paymentMethod === 'cod' ? 'CASH ON DELIVERY' : 'BANK TRANSFER'}`, 190, 74, { align: "right" });
      
      // Table Header
      let y = 90;
      doc.setFillColor(31, 41, 55); // #1F2937
      doc.rect(20, y, 170, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.text("Item", 25, y + 6.5);
      doc.text("Qty", 130, y + 6.5, { align: "center" });
      doc.text("Price", 185, y + 6.5, { align: "right" });
      
      // Table Body
      y += 16;
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "normal");
      cart.forEach(item => {
        const variation = [item.selectedSize, item.selectedColor].filter(Boolean).join(" / ");
        const displayName = variation ? `${item.name} [${variation}]` : item.name;
        const splitName = doc.splitTextToSize(displayName, 90);
        doc.text(splitName, 25, y);
        doc.text((item.quantity || 1).toString(), 130, y, { align: "center" });
        doc.text(`Rs ${(item.price * (item.quantity || 1)).toLocaleString()}`, 185, y, { align: "right" });
        y += (splitName.length * 6) + 4;
      });
      
      // Total Amount
      y += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(100, y, 190, y);
      y += 8;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39); 
      doc.text("Total Amount:", 120, y); 
    
      doc.setTextColor(230, 57, 70);
      doc.text(`Rs ${calculateTotal().toFixed(2)}`, 190, y, { align: "right" });
      
      // Footer Note
      y += 25;
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("Thank you for shopping with Mr.Korea!", 105, y, { align: "center" });
      
      doc.save(`Invoice_${completedOrder.orderId}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    }

    const waMessage = buildWhatsAppMessage(completedOrder);
    const waUrl = `https://wa.me/${SELLER_WHATSAPP}?text=${encodeURIComponent(waMessage)}`;
    window.open(waUrl, '_blank');

    setTimeout(() => {
      setCompletedOrder(null);
      setCart([]);
      localStorage.removeItem("cart");
      router.push("/");
    }, 1500);
  };

  if (isAuthChecking || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center font-bold text-gray-500">
        Authenticating Secure Checkout...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Toast Alert */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-out flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl bg-white border ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'} ${toast.type === 'success' ? 'border-emerald-200' : 'border-red-200'}`}>
        {toast.type === 'success' ? (
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex justify-center items-center text-sm font-black shadow-inner">✓</div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex justify-center items-center text-sm font-black shadow-inner">✕</div>
        )}
        <span className="font-bold text-[13px] md:text-sm text-[#111827] whitespace-nowrap">{toast.message}</span>
      </div>

      {/* Nav Header */}
      <nav className="bg-[#1F2937] text-white py-3 shadow-lg sticky top-0 z-50 border-b border-gray-800">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl flex justify-between items-center">
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
          <Link href="/" className="text-sm font-bold text-gray-300 hover:text-white transition">
            ← Continue Shopping
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-5xl flex-grow">
        <h2 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Secure Checkout</h2>

        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center max-w-lg mx-auto border-t-4 border-[#E63946]">
            <div className="w-16 h-16 bg-red-50 text-[#E63946] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Your Cart is Empty</h3>
            <p className="text-gray-500 mb-6 font-medium">Please add items to your cart before proceeding to checkout.</p>
            <Link href="/" className="inline-block bg-[#E63946] hover:bg-[#C1121F] text-white px-6 py-3 rounded-xl font-bold transition hover:shadow-md">
              Go to Store
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Section */}
            <div className="lg:col-span-7 bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
              <h3 className="font-extrabold text-lg md:text-xl text-gray-900 border-b border-gray-100 pb-4 mb-6">
                Delivery & Billing Details
              </h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Full Name *</label>
                    <input 
                      required 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-sm text-black font-medium transition" 
                      placeholder="John Doe" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email Address *</label>
                    <input 
                      required 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-sm text-black font-medium transition" 
                      placeholder="john@example.com" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Phone Number *</label>
                    <input 
                      required 
                      type="tel" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange} 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-sm text-black font-medium transition" 
                      placeholder="07XXXXXXXX" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">WhatsApp Number *</label>
                    <input 
                      required 
                      type="tel" 
                      name="whatsapp" 
                      value={formData.whatsapp} 
                      onChange={handleChange} 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] text-sm text-black font-medium transition" 
                      placeholder="07XXXXXXXX" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Delivery Address *</label>
                  <textarea 
                    required 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    rows={3} 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-sm text-black font-medium transition resize-none" 
                    placeholder="No 123, Main Street, City" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Payment Method *</label>
                  <div className="flex flex-col md:flex-row gap-3">
                    <label className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-[#E63946] bg-red-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="cod" 
                        checked={formData.paymentMethod === 'cod'} 
                        onChange={handleChange} 
                        className="w-4 h-4 accent-[#E63946]" 
                      />
                      <span className="font-bold text-sm text-[#111827]">Cash on Delivery</span>
                    </label>
                    <label className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'bank' ? 'border-[#E63946] bg-red-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="bank" 
                        checked={formData.paymentMethod === 'bank'} 
                        onChange={handleChange} 
                        className="w-4 h-4 accent-[#E63946]" 
                      />
                      <span className="font-bold text-sm text-[#111827]">Bank Transfer</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full bg-[#1F2937] hover:bg-[#111827] text-white py-4 rounded-xl font-bold text-base hover:shadow-lg transition active:scale-[0.98] disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Processing..." : "Place Order"}
                  </button>
                </div>
              </form>
            </div>

            {/* Cart Summary Section */}
            <div className="lg:col-span-5 bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-24">
              <h3 className="font-extrabold text-lg text-gray-900 border-b border-gray-100 pb-4 mb-4">
                Order Summary
              </h3>
              
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto pr-2">
                {cart.map((item, index) => (
                  <div key={index} className="py-3.5 flex justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800">{item.name}</h4>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-xs font-semibold text-gray-500">Qty: {item.quantity || 1}</span>
                        {item.selectedSize && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{item.selectedSize}</span>}
                        {item.selectedColor && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{item.selectedColor}</span>}
                      </div>
                    </div>
                    <span className="font-bold text-sm text-gray-900 self-center">
                      Rs {(Number(item.price.toString().replace(/[^0-9.-]+/g,"")) * (item.quantity || 1)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between font-black text-lg text-[#111827]">
                  <span>Total Amount:</span>
                  <span className="text-[#E63946]">Rs {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Success Popup */}
      {completedOrder && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111827]/80 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center animate-pop-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500 animate-draw-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-[#111827] mb-2">Order Saved! 🎉</h2>
            <p className="text-[#E63946] font-bold text-sm mb-4">Order ID: {completedOrder.orderId}</p>
            <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium bg-gray-50 p-4 rounded-xl border border-gray-100">
              Your order has been recorded. Click the button below to download your PDF invoice and send details via WhatsApp to confirm.
            </p>

            <button
              onClick={handleDownloadAndWhatsApp}
              className="w-full bg-[#E63946] hover:bg-[#C1121F] text-white py-4 rounded-xl font-bold text-sm md:text-base flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg transition active:scale-[0.98]"
            >
              <span className="flex items-center gap-2 justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Download Invoice & Send via WhatsApp
              </span>
            </button>
          </div>
        </div>
      )}

      <Footer />

      <style>{`
        @keyframes pop-in {
          0%   { opacity: 0; transform: scale(0.85) translateY(20px); }
          70%  { transform: scale(1.03) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-pop-in { animation: pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }

        @keyframes draw-check {
          from { stroke-dashoffset: 30; opacity: 0; }
          to   { stroke-dashoffset: 0;  opacity: 1; }
        }
        .animate-draw-check {
          stroke-dasharray: 30;
          stroke-dashoffset: 30;
          animation: draw-check 0.5s 0.2s ease forwards;
        }
      `}</style>
    </div>
  );
}
