"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); // Search State

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user !== "mrkorea") { router.push("/"); return; }
    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (res.ok) setOrders(await res.json());
    } catch (error) { console.error("Failed to fetch:", error); } 
    finally { setLoading(false); }
  };

  // Delete function (Yes/No Confirmation එකක් එක්ක)
  const deleteOrder = async (id: string) => {
    if (confirm("Are you sure you want to delete this order? This cannot be undone!")) {
      try {
        const res = await fetch(`/api/orders?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          setOrders(orders.filter(order => order._id !== id));
          alert("Order deleted!");
        }
      } catch (err) { alert("Failed to delete."); }
    }
  };

  // Filter logic
  const filteredOrders = orders.filter(o => 
    o.orderId?.toLowerCase().includes(search.toLowerCase()) || 
    o.customer?.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-[#E63946] font-bold text-xl">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-black text-[#111827]">Order Management</h1>
          <div className="flex gap-3">
             <input type="text" placeholder="Search by ID or Name..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none"/>
             <button onClick={() => router.push('/admin/dashboard')} className="bg-[#1F2937] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-black transition text-sm">Back</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1F2937] text-white text-xs uppercase">
                <th className="p-4">Date & ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-black text-[#E63946]">{order.orderId || "NO-ID"}</p>
                    <p className="text-[10px] text-gray-500 font-bold">{order.time || "NO-TIME"}</p>
                  </td>
                  <td className="p-4"><p className="font-bold">{order.customer?.name}</p><p className="text-xs text-gray-500">{order.customer?.whatsapp}</p></td>
                  <td className="p-4"><ul className="text-xs">{order.items?.map((item: any, i: number) => <li key={i}>{item.name} x{item.quantity}</li>)}</ul></td>
                  <td className="p-4 font-black">Rs {order.totalAmount?.toLocaleString()}</td>
                  <td className="p-4">
                    <button onClick={() => deleteOrder(order._id)} className="text-red-500 font-bold hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}