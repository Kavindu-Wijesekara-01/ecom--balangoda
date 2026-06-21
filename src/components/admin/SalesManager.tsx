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
                  <p className="font-bold text-[#111827]">{order.customer.name}</p>
                  <p className="text-xs text-gray-500">WA: {order.customer.whatsapp}</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}</p>
                </td>
                <td className="p-4">
                  <ul className="list-disc pl-4 text-gray-600 text-xs font-medium">
                    {order.items.map((item: any, i: number) => (
                      <li key={i}>{item.name} <span className="font-bold text-[#E63946]">x{item.quantity}</span></li>
                    ))}
                  </ul>
                </td>
                <td className="p-4 font-black text-[#111827]">Rs {order.totalAmount.toLocaleString()}</td>
                <td className="p-4">
                  <span className={`font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border ${
                    order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                  }`}>{order.status || 'Pending'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}