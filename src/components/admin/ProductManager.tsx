"use client";

import { useState, useEffect } from "react";

export default function ProductManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [productData, setProductData] = useState({
    name: "", price: "", description: "", imageUrl: "", categoryId: "", inStock: true
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // cache: 'no-store' dapu nisa dan real-time update wenawa
  const fetchProducts = async () => {
    const res = await fetch("/api/products", { cache: 'no-store' });
    if (res.ok) setProducts(await res.json());
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/categories", { cache: 'no-store' });
    if (res.ok) setCategories(await res.json());
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editProductId ? `/api/products/${editProductId}` : "/api/products";
    const method = editProductId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData)
    });

    if (res.ok) {
      alert(`Product ${editProductId ? "Updated" : "Added"} Successfully!`);
      setProductData({ name: "", price: "", description: "", imageUrl: "", categoryId: "", inStock: true });
      setEditProductId(null);
      fetchProducts();
    }
  };

  // Stock status eka update karana function eka
  // Stock status eka tarat j update karva mate (Optimistic Update)
  const handleUpdateStock = async (id: string, status: boolean) => {
    // 1. UI ne tarat j update karo (Jethi button tarat change thai jaay)
    setProducts(products.map(p => p._id === id ? { ...p, inStock: status } : p));

    try {
      // 2. Database ma update moklo
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inStock: status })
      });
      
      if (!res.ok) {
        alert("Stock update fail thayu chhe!");
        fetchProducts(); // Jo API fail thay to parana data pacha lavo
      }
    } catch (error) {
      console.error("Stock update error:", error);
      fetchProducts();
    }
  };

  const handleEditProduct = (prod: any) => {
    setProductData({
      name: prod.name,
      price: prod.price,
      description: prod.description,
      imageUrl: prod.imageUrl,
      categoryId: prod.categoryId?._id || "",
      inStock: prod.inStock !== false 
    });
    setEditProductId(prod._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) fetchProducts();
    }
  };

  return (
    <div className="space-y-8">
      {/* Product Form */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 border-t-4 border-[#0f172a]">
        <h3 className="text-xl font-bold mb-4 text-gray-800">{editProductId ? "Edit Product" : "Add New Product"}</h3>
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#0f172a] font-semibold mb-2">Product Name</label>
              <input type="text" required value={productData.name} onChange={(e) => setProductData({...productData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#f97316] text-gray-900 font-medium bg-white" placeholder="Enter product name" />
            </div>
            <div>
              <label className="block text-[#0f172a] font-semibold mb-2">Price (Rs.)</label>
              <input type="text" required value={productData.price} onChange={(e) => setProductData({...productData, price: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#f97316] text-gray-900 font-medium bg-white" placeholder="Eg: 5500" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#0f172a] font-semibold mb-2">Category</label>
              <select required value={productData.categoryId} onChange={(e) => setProductData({...productData, categoryId: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#f97316] text-gray-900 font-medium bg-white">
                <option value="" className="text-gray-500">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#0f172a] font-semibold mb-2">Image URL</label>
              <input type="url" required value={productData.imageUrl} onChange={(e) => setProductData({...productData, imageUrl: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#f97316] text-gray-900 font-medium bg-white" placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className="block text-[#0f172a] font-semibold mb-2">Description</label>
            <textarea required rows={3} value={productData.description} onChange={(e) => setProductData({...productData, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#f97316] text-gray-900 font-medium bg-white" placeholder="Product details..."></textarea>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="bg-[#f97316] text-white px-8 py-3 rounded font-bold hover:bg-orange-600 transition">
              {editProductId ? "Update Product" : "Add Product"}
            </button>
            {editProductId && (
              <button type="button" onClick={() => { setEditProductId(null); setProductData({ name: "", price: "", description: "", imageUrl: "", categoryId: "", inStock: true }); }} 
                className="bg-gray-400 text-white px-8 py-3 rounded font-bold hover:bg-gray-500 transition">
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-4 border-b">Image</th>
              <th className="p-4 border-b">Details</th>
              <th className="p-4 border-b">Stock Status</th>
              <th className="p-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => (
              <tr key={prod._id} className="hover:bg-gray-50 border-b">
                <td className="p-4">
                  <img src={prod.imageUrl} alt={prod.name} className="w-16 h-16 object-contain rounded-md border border-gray-300 bg-white" />
                </td>
                <td className="p-4">
                  <p className="text-gray-900 font-bold">{prod.name}</p>
                  <p className="text-gray-600 text-sm">{prod.categoryId?.name || "N/A"}</p>
                  <p className="text-[#f97316] font-bold">Rs {prod.price}</p>
                </td>
                <td className="p-4">
                  {/* Stock Buttons */}
                  <div className="flex flex-col gap-2 w-max">
                    <button 
                      onClick={() => handleUpdateStock(prod._id, true)} 
                      className={`px-3 py-1 rounded text-sm font-bold border transition ${prod.inStock !== false ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'}`}
                    >
                      In Stock
                    </button>
                    <button 
                      onClick={() => handleUpdateStock(prod._id, false)} 
                      className={`px-3 py-1 rounded text-sm font-bold border transition ${prod.inStock === false ? 'bg-red-100 text-red-700 border-red-300' : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'}`}
                    >
                      Out of Stock
                    </button>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-3">
                    <button onClick={() => handleEditProduct(prod)} className="text-blue-600 font-bold hover:underline">Edit</button>
                    <button onClick={() => handleDeleteProduct(prod._id)} className="text-red-600 font-bold hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}