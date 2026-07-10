"use client";
import { useState, useEffect } from "react";

export default function SalesManager() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const res = await fetch("/api/orders", { cache: 'no-store' });
    if (res.ok) setOrders(await res.json());
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(order => order._id === id ? { ...order, status: newStatus } : order));
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status.");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Proceed":
      case "Processing":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "On the way":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Delivered":
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default: // Pending
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <h3 className="text-xl font-black mb-6 text-[#111827]">Recent Sales / Orders</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <th className="p-4 border-b font-bold">Date & ID</th>
              <th className="p-4 border-b font-bold">Customer Info</th>
              <th className="p-4 border-b font-bold">Items Purchased</th>
              <th className="p-4 border-b font-bold">Total (Rs)</th>
              <th className="p-4 border-b font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-slate-50 border-b border-gray-100">
                <td className="p-4">
                  <span className="font-black text-[#E63946] block">{order.orderId || "N/A"}</span>
                  <span className="text-[10px] text-gray-500 font-bold">{order.time || new Date(order.createdAt).toLocaleString()}</span>
                </td>
                <td className="p-4">
                  <p className="font-bold text-[#111827]">{order.customer?.name}</p>
                  <p className="text-xs text-gray-500">WA: {order.customer?.whatsapp}</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment (PayHere)'}
                  </p>
                </td>
                <td className="p-4">
                  <ul className="list-disc pl-4 text-gray-600 text-xs font-medium">
                    {order.items?.map((item: any, i: number) => (
                      <li key={i}>
                        {item.name} <span className="font-bold text-[#E63946]">x{item.quantity}</span>
                        {(item.selectedSize || item.selectedColor) && (
                          <span className="ml-1 text-[9px] font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full border border-slate-200 uppercase tracking-wide">
                            {[item.selectedSize, item.selectedColor].filter(Boolean).join(" / ")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="p-4 font-black text-[#111827]">
                  Rs {order.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4">
                  <select
                    value={order.status || "Pending"}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    className={`border rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none cursor-pointer font-sans transition-all ${getStatusStyle(order.status || "Pending")}`}
                  >
                    <option value="Pending">🕒 Pending</option>
                    <option value="Proceed">⚙️ Proceed</option>
                    <option value="On the way">🚚 On the way</option>
                    <option value="Delivered">✅ Delivered</option>
                    <option value="Cancelled">❌ Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}