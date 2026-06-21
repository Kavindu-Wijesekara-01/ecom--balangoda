"use client";

import { useState, useEffect } from "react";

export default function CategoryManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editCategoryId ? `/api/categories/${editCategoryId}` : "/api/categories";
    const method = editCategoryId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: categoryName })
    });
    
    if (res.ok) {
      alert(`Category ${editCategoryId ? "Updated" : "Added"} Successfully!`);
      setCategoryName("");
      setEditCategoryId(null);
      fetchCategories(); 
    }
  };

  const handleEditCategory = (cat: any) => {
    setCategoryName(cat.name);
    setEditCategoryId(cat._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) fetchCategories();
    }
  };

  return (
    <div className="space-y-8">
      {/* Category Form */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md border-t-4 border-[#f97316]">
        <h3 className="text-xl font-bold mb-4 text-gray-800">{editCategoryId ? "Edit Category" : "Add New Category"}</h3>
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-[#0f172a] font-semibold mb-2">Category Name</label>
            <input type="text" required value={categoryName} onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#f97316] text-gray-900 font-medium bg-white" placeholder="Eg: Laptops" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-[#0f172a] text-white px-6 py-2 rounded font-bold hover:bg-slate-800 transition">
              {editCategoryId ? "Update" : "Create"}
            </button>
            {editCategoryId && (
              <button type="button" onClick={() => { setEditCategoryId(null); setCategoryName(""); }} className="bg-gray-400 text-white px-4 py-2 rounded font-bold hover:bg-gray-500 transition">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Category List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-4 border-b">Category Name</th>
              <th className="p-4 border-b w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat._id} className="hover:bg-gray-50 border-b">
                <td className="p-4 text-gray-900 font-medium">{cat.name}</td>
                <td className="p-4 flex gap-3">
                  <button onClick={() => handleEditCategory(cat)} className="text-blue-600 font-bold hover:underline">Edit</button>
                  <button onClick={() => handleDeleteCategory(cat._id)} className="text-red-600 font-bold hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={2} className="p-4 text-center text-gray-500">No categories found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}