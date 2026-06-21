"use client";

import { useState, useEffect } from "react";

export default function BannerManager() {
  const [banners, setBanners] = useState<any[]>([]);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    const res = await fetch("/api/banners", { cache: 'no-store' });
    if (res.ok) setBanners(await res.json());
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl })
    });
    
    if (res.ok) {
      alert("Banner Added Successfully!");
      setImageUrl("");
      fetchBanners(); 
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (confirm("Are you sure you want to delete this banner?")) {
      const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
      if (res.ok) fetchBanners();
    }
  };

  return (
    <div className="space-y-8">
      {/* Add Banner Form */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-2xl border-t-4 border-[#10b981]">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Add Promotional Banner</h3>
        <form onSubmit={handleSaveBanner} className="space-y-4">
          <div>
            <label className="block text-[#0f172a] font-semibold mb-2">Banner Image URL (Size: 1920x600 recommended)</label>
            <input type="url" required value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#10b981] text-gray-900 font-medium" placeholder="https://..." />
          </div>
          <button type="submit" className="bg-[#10b981] text-white px-6 py-2 rounded font-bold hover:bg-emerald-600 transition">
            Add Banner
          </button>
        </form>
      </div>

      {/* Banner List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-4xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-4 border-b">Banner Preview</th>
              <th className="p-4 border-b w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => (
              <tr key={banner._id} className="hover:bg-gray-50 border-b">
                <td className="p-4">
                  <img src={banner.imageUrl} alt="Banner" className="w-full h-24 object-cover rounded border" />
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDeleteBanner(banner._id)} className="text-red-600 font-bold hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {banners.length === 0 && (
              <tr><td colSpan={2} className="p-4 text-center text-gray-500">No banners found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}