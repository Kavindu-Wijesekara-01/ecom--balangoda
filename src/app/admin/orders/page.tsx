"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); // Search State
  const [notification, setNotification] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
    show: false, message: "", type: "success"
  });

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user !== "mrkorea") { router.push("/"); return; }
    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (res.ok) setOrders(await res.json());
    } catch (error) { 
      console.error("Failed to fetch:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Status update function
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(order => order._id === id ? { ...order, status: newStatus } : order));
        showNotification(`Order status updated to "${newStatus}"!`, "success");
      } else {
        showNotification("Failed to update status.", "error");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      showNotification("Failed to update status.", "error");
    }
  };

  // Delete function (Yes/No Confirmation)
  const deleteOrder = async (id: string) => {
    if (confirm("Are you sure you want to delete this order? This cannot be undone!")) {
      try {
        const res = await fetch(`/api/orders?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          setOrders(orders.filter(order => order._id !== id));
          showNotification("Order deleted successfully!", "success");
        }
      } catch (err) { 
        showNotification("Failed to delete.", "error"); 
      }
    }
  };

  // Filter logic
  const filteredOrders = orders.filter(o => 
    o.orderId?.toLowerCase().includes(search.toLowerCase()) || 
    o.customer?.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Proceed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "On the way":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: // Pending
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  if (loading) return <div className="p-8 text-center text-[#E63946] font-bold text-xl">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 relative">
      {/* Toast Alert */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-out flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl bg-white border ${notification.show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'} ${notification.type === 'success' ? 'border-emerald-200' : 'border-red-200'}`}>
        {notification.type === 'success' ? (
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex justify-center items-center text-sm font-black shadow-inner">✓</div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex justify-center items-center text-sm font-black shadow-inner">✕</div>
        )}
        <span className="font-bold text-[13px] md:text-sm text-[#111827] whitespace-nowrap">{notification.message}</span>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-black text-[#111827]">Order Management</h1>
          <div className="flex gap-3">
             <input 
               type="text" 
               placeholder="Search by ID or Name..." 
               value={search} 
               onChange={(e) => setSearch(e.target.value)} 
               className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#E63946] w-64"
             />
             <button onClick={() => router.push('/admin/dashboard')} className="bg-[#1F2937] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-black transition text-sm">Back</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#1F2937] text-white text-xs uppercase">
                  <th className="p-4">Date & ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status Update</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 font-bold">No orders found.</td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-black text-[#E63946]">{order.orderId || "NO-ID"}</p>
                        <p className="text-[10px] text-gray-500 font-bold">{order.time || "NO-TIME"}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-800">{order.customer?.name}</p>
                        <p className="text-xs text-gray-500 font-medium">WA: {order.customer?.whatsapp}</p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">{order.customer?.email}</p>
                      </td>
                      <td className="p-4">
                        <ul className="text-xs space-y-0.5 text-gray-700 font-semibold">
                          {order.items?.map((item: any, i: number) => {
                            const variation = [item.selectedSize, item.selectedColor].filter(Boolean).join(" / ");
                            return (
                              <li key={i}>
                                • {item.name} {variation ? `[${variation}]` : ""} x{item.quantity}
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                      <td className="p-4 font-black text-gray-900">
                        Rs {order.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <select
                          value={order.status || "Pending"}
                          onChange={(e) => updateStatus(order._id, e.target.value)}
                          className={`border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer font-sans transition-all ${getStatusStyle(order.status || "Pending")}`}
                        >
                          <option value="Pending">🕒 Pending</option>
                          <option value="Proceed">⚙️ Proceed</option>
                          <option value="On the way">🚚 On the way</option>
                          <option value="Delivered">✅ Delivered</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <button onClick={() => deleteOrder(order._id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}