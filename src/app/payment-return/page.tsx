"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import jsPDF from "jspdf";

const DELIVERY_FEE = 400;
const SELLER_WHATSAPP = "94711222333";
const STORE_CONTACT = "0711222555";

function PaymentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Clear local storage cart immediately on landing
  useEffect(() => {
    localStorage.removeItem("cart");
  }, []);

  // Fetch the created order from database
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError(true);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders?orderId=${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setOrder(data[0]);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const calculateSubtotal = () => {
    if (!order || !order.items) return 0;
    return order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  };

  const buildWhatsAppMessage = () => {
    if (!order) return "";
    const itemLines = order.items
      .map((item: any) => {
        const variation = [item.selectedSize, item.selectedColor].filter(Boolean).join(" / ");
        const variationText = variation ? ` [${variation}]` : "";
        return `  • ${item.name}${variationText} × ${item.quantity} — Rs ${(item.price * item.quantity).toLocaleString()}`;
      })
      .join("\n");

    const subtotal = calculateSubtotal();
    const finalTotal = subtotal + DELIVERY_FEE;

    return (
      `🛒 *New Order (Online Paid) - MR.KOREA*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔖 *Order ID :* ${order.orderId}\n` +
      `⏱️ *Time :* ${order.time}\n\n` +
      `👤 *Customer Details*\n` +
      `  Name     : ${order.customer.name}\n` +
      `  Phone    : ${order.customer.phone}\n` +
      `  WhatsApp : ${order.customer.whatsapp}\n\n` +
      `📦 *Order Items*\n` +
      `${itemLines}\n\n` +
      `💵 *Subtotal :* Rs ${subtotal.toLocaleString()}\n` +
      `🚚 *Delivery Fee :* Rs ${DELIVERY_FEE.toLocaleString()}\n` +
      `💰 *Total Amount : Rs ${finalTotal.toLocaleString()}*\n` +
      `💳 *Payment : Online Payment (PayHere) - COMPLETED*\n\n` +
      `🚚 *Delivery Address*\n` +
      `  ${order.customer.address}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Please confirm my order!_`
    );
  };

  const handleDownloadAndWhatsApp = () => {
    if (!order) return;

    try {
      const doc = new jsPDF("p", "mm", "a4");

      // Header Section
      doc.setFontSize(26);
      doc.setTextColor(230, 57, 70);
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

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(12);
      doc.text(order.customer.name, 20, 62);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(order.customer.phone, 20, 68);
      const splitAddress = doc.splitTextToSize(order.customer.address, 60);
      doc.text(splitAddress, 20, 74);

      doc.setFont("helvetica", "bold");
      doc.text("ID: ", 150, 62);
      doc.setTextColor(230, 57, 70);
      doc.text(order.orderId, 190, 62, { align: "right" });

      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${order.time}`, 190, 68, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(`Payment: ONLINE PAID (PAYHERE)`, 190, 74, { align: "right" });

      // Table Header
      let y = 90;
      doc.setFillColor(31, 41, 55);
      doc.rect(20, y, 170, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.text("Item", 25, y + 6.5);
      doc.text("Qty", 130, y + 6.5, { align: "center" });
      doc.text("Price", 185, y + 6.5, { align: "right" });

      // Table Body
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
        y += (splitName.length * 6) + 4;
      });

      // Total Calculations
      y += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(100, y, 190, y);
      
      const subtotal = calculateSubtotal();
      const finalTotal = subtotal + DELIVERY_FEE;

      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Subtotal:", 120, y);
      doc.text(`Rs ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, y, { align: "right" });

      y += 6;
      doc.text("Delivery Fee:", 120, y);
      doc.text(`Rs ${DELIVERY_FEE.toFixed(2)}`, 190, y, { align: "right" });

      y += 8;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("Total Amount:", 120, y);

      doc.setTextColor(230, 57, 70);
      doc.text(`Rs ${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, y, { align: "right" });

      // Footer Note
      y += 25;
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("Thank you for shopping with Mr.Korea!", 105, y, { align: "center" });

      doc.save(`Invoice_${order.orderId}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    }

    // Open WhatsApp
    const waMessage = buildWhatsAppMessage();
    const waUrl = `https://wa.me/${SELLER_WHATSAPP}?text=${encodeURIComponent(waMessage)}`;
    window.open(waUrl, '_blank');

    // Redirect to orders overview after a brief delay
    setTimeout(() => {
      router.push("/my-orders");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-bold text-gray-500 gap-3">
        <div className="w-10 h-10 border-4 border-[#E63946] border-t-transparent rounded-full animate-spin" />
        <p>Verifying Payment & Retrieving Order Details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center border border-slate-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[#111827] mb-2">Order Not Found</h1>
          <p className="text-gray-500 text-sm mb-6">We could not fetch your order details. Please contact customer support.</p>
          <Link href="/" className="inline-block bg-[#E63946] hover:bg-[#C1121F] text-white px-8 py-3 rounded-xl font-bold text-sm transition-colors">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 max-w-md w-full text-center border border-slate-100">
        
        {/* Animated success check */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-[#111827] mb-2">Payment Successful! 🎉</h2>
        <p className="text-[#E63946] font-bold text-sm mb-4">Order ID: {order.orderId}</p>
        
        <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium bg-gray-50 p-4 rounded-xl border border-gray-100">
          ඔබේ payment එක සාර්ථකව සිදු විය! කරුණාකර පහත button එක ඔබා Invoice එක බාගත කර WhatsApp මඟින් අප වෙත එවන්න.
        </p>

        {/* Action Button */}
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

        <div className="mt-4 flex gap-2 justify-center">
          <Link href="/my-orders" className="text-xs font-bold text-gray-500 hover:text-gray-800 transition">
            Skip to My Orders
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-gray-500">
        Loading...
      </div>
    }>
      <PaymentReturnContent />
    </Suspense>
  );
}
