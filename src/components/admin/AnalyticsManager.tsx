"use client";
import { useState, useEffect } from "react";

export default function AnalyticsManager() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders", { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center py-10 font-bold text-gray-500 animate-pulse">Calculating Analytics...</div>;
  }

  // --- 1. BASIC STATS CALCULATIONS ---
  const todayStr = new Date().toDateString();
  let dailyIncome = 0;
  let totalIncome = 0;
  let todayOrdersCount = 0;
  const itemSales: Record<string, number> = {};

  orders.forEach(order => {
    totalIncome += order.totalAmount;
    
    const orderDateStr = new Date(order.createdAt).toDateString();
    if (orderDateStr === todayStr) {
      dailyIncome += order.totalAmount;
      todayOrdersCount++;
    }

    order.items.forEach((item: any) => {
      itemSales[item.name] = (itemSales[item.name] || 0) + item.quantity;
    });
  });

  const sortedItems = Object.entries(itemSales).sort((a, b) => b[1] - a[1]);
  const bestSellers = sortedItems.slice(0, 5);

  // --- 2. LAST 7 DAYS REVENUE GRAPH DATA ---
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  }).reverse();

  const revenueData = last7Days.map(date => {
    const dateStr = date.toDateString();
    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    const dayTotal = orders
      .filter(o => new Date(o.createdAt).toDateString() === dateStr)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return { label: dayLabel, amount: dayTotal };
  });

  const maxRevenue = Math.max(...revenueData.map(d => d.amount), 1000);

  // SVG Line Path Generation Logic
  const chartHeight = 150;
  const chartWidth = 500;
  const points = revenueData.map((d, i) => {
    const x = (i / (revenueData.length - 1)) * chartWidth;
    const y = chartHeight - (d.amount / maxRevenue) * chartHeight;
    return `${x},${y}`;
  });
  
  const linePath = points.join(" ");
  const areaPath = points.length > 0 
    ? `0,${chartHeight} ${linePath} ${chartWidth},${chartHeight}` 
    : "";

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* ---------------- TOP INSIGHT CARDS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Today's Revenue</p>
          <h2 className="text-2xl md:text-3xl font-black text-[#0f172a]">Rs {dailyIncome.toFixed(2)}</h2>
          <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> From {todayOrdersCount} orders today
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 border-l-4 border-l-blue-500">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total All-Time Revenue</p>
          <h2 className="text-2xl md:text-3xl font-black text-[#0f172a]">Rs {totalIncome.toFixed(2)}</h2>
          <p className="text-xs font-bold text-blue-600 mt-2">Gross platform sales</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 border-l-4 border-l-orange-500 sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Items Vol.</p>
          <h2 className="text-2xl md:text-3xl font-black text-[#0f172a]">
            {orders.reduce((acc, o) => acc + o.items.reduce((s: any, i: any) => s + i.quantity, 0), 0)}
          </h2>
          <p className="text-xs font-bold text-orange-600 mt-2">Dispatched across {orders.length} orders</p>
        </div>
      </div>

      {/* ---------------- VISUAL ANALYTICS (GRAPHS) ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Graph 1: Last 7 Days Revenue Trend */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0f172a] mb-1 flex items-center gap-2">
              📊 Revenue Trend (Last 7 Days)
            </h3>
            <p className="text-xs text-gray-400 font-medium mb-6">Daily sales volume analysis</p>
          </div>

          {/* Pure SVG Responsive Line Chart */}
          <div className="w-full bg-slate-50/50 p-4 rounded-xl border border-gray-100">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
              {/* Background Grid Lines */}
              <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#e2e8f0" strokeDasharray="4" />
              <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="#e2e8f0" strokeDasharray="4" />
              
              {/* Area Under Line */}
              {areaPath && <polygon points={areaPath} fill="url(#gradient)" className="opacity-20 animate-pulse" />}
              
              {/* Main Trend Line */}
              {linePath && (
                <polyline fill="none" stroke="#f97316" strokeWidth="3" points={linePath} strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* Interactive Data Nodes */}
              {revenueData.map((d, i) => {
                const x = (i / (revenueData.length - 1)) * chartWidth;
                const y = chartHeight - (d.amount / maxRevenue) * chartHeight;
                return (
                  <g key={i} className="group cursor-pointer">
                    <circle cx={x} cy={y} r="5" fill="#0f172a" stroke="#f97316" strokeWidth="2" className="transition-all group-hover:r-7" />
                    {/* Tooltip on Node Hover */}
                    <foreignObject x={x - 35} y={y - 30} width="70" height="25" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="bg-[#0f172a] text-white text-[9px] font-bold py-0.5 rounded text-center shadow-md">
                        Rs {Math.round(d.amount)}
                      </div>
                    </foreignObject>
                  </g>
                );
              })}

              {/* Gradient Declaration */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between mt-3 px-1">
              {revenueData.map((d, i) => (
                <span key={i} className="text-[10px] font-extrabold text-gray-400 uppercase">{d.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Graph 2: Top Products Horizontal Bar Chart */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h3 className="text-base font-bold text-[#0f172a] mb-1 flex items-center gap-2">
              🔥 Best Selling Products
            </h3>
            <p className="text-xs text-gray-400 font-medium mb-6">Top performing inventory item volume</p>
          </div>

          <div className="space-y-4">
            {bestSellers.map(([name, qty], index) => {
              const maxQty = bestSellers[0][1] || 1;
              const barWidth = `${(qty / maxQty) * 100}%`;

              return (
                <div key={name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span className="truncate max-w-[200px] sm:max-w-[300px]">
                      <span className="text-gray-300 mr-1.5">#{index + 1}</span> {name}
                    </span>
                    <span className="text-[#0f172a]">{qty} Units</span>
                  </div>
                  {/* Dynamic Progress Bar */}
                  <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden border border-gray-50">
                    <div 
                      style={{ width: barWidth }} 
                      className="bg-gradient-to-r from-[#0f172a] to-slate-700 h-full rounded-full transition-all duration-1000 ease-out origin-left"
                    />
                  </div>
                </div>
              );
            })}
            
            {bestSellers.length === 0 && (
              <p className="text-sm text-gray-400 font-medium text-center py-10">No volume data to plot yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}