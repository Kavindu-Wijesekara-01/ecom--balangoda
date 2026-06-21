"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SalesManager from "@/components/admin/SalesManager";
import AnalyticsManager from "@/components/admin/AnalyticsManager";
import BannerManager from "@/components/admin/BannerManager";

export default function AdminDashboard() {
  const router = useRouter();
  
  // States
  const [activeTab, setActiveTab] = useState("products");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data States
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(true); 

  // 📄 PAGINATION STATES (අලුතින් එකතු කළ කොටස)
  const [productPage, setProductPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const ITEMS_PER_PAGE = 10; // එක පිටුවකට පෙන්නන ගාන (ඕනේ නම් 10 කරන්න)

  // ---------------- NAVIGATION ITEMS DEFINED HERE ----------------
  const navItems = [
    { id: "analytics", label: "📊 Analytics & Income" },
    { id: "sales", label: "🛒 Sales Orders" },
    { id: "products", label: "📦 Manage Products" },
    { id: "categories", label: "🏷️ Manage Categories" },
    { id: "banners", label: "🖼️ Manage Banners" },
  ];

  // ---------------- MODAL & FORM STATES ----------------
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({ name: "", price: "", categoryId: "", imageUrl: "", description: "" });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");

  // 🔒 CHANGE PASSWORD STATES
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passForm, setPassForm] = useState({ oldPassword: "", newPassword: "" });
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Security Check & Fetch Data
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/");
      return;
    }
    fetchAdminData();
  }, [router]);

  const fetchAdminData = async () => {
    setIsFetchingData(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products", { cache: 'no-store' }),
        fetch("/api/categories", { cache: 'no-store' })
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch (error) {
      console.error("Error fetching admin data", error);
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  // ---------------- PASSWORD CHANGE LOGIC ----------------
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPass(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passForm)
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("✅ Password changed successfully!");
        setIsPasswordModalOpen(false);
        setPassForm({ oldPassword: "", newPassword: "" });
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error) { 
      alert("Network error occurred.");
    } finally {
      setIsChangingPass(false);
    }
  };

  // ---------------- PRODUCT CRUD LOGIC ----------------
  const openProductModal = (product: any = null) => {
    if (product) {
      setEditingProductId(product._id);
      setProductForm({ 
        name: product.name, 
        price: product.price.toString(), 
        categoryId: product.categoryId?._id || product.categoryId || "", 
        imageUrl: product.imageUrl || "", 
        description: product.description || "" 
      });
    } else {
      setEditingProductId(null);
      setProductForm({ name: "", price: "", categoryId: "", imageUrl: "", description: "" });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProductId ? "PATCH" : "POST";
    const url = editingProductId ? `/api/products/${editingProductId}` : "/api/products";
    
    const payload = {
      name: productForm.name,
      price: Number(productForm.price),
      categoryId: productForm.categoryId || null,
      imageUrl: productForm.imageUrl,
      description: productForm.description
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsProductModalOpen(false);
        fetchAdminData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to save product: ${errorData.error || res.statusText}`);
      }
    } catch (error) { 
      console.error("Save product error:", error); 
      alert("Network error: Failed to save product.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAdminData();
        // පේජ් එකේ අන්තිම එක මැකුවොත් කලින් පේජ් එකට යන්න
        if (currentProducts.length === 1 && productPage > 1) setProductPage(productPage - 1);
      }
    } catch (error) { console.error(error); }
  };

  const handleToggleStock = async (productId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setProducts(products.map(p => p._id === productId ? { ...p, inStock: newStatus } : p));
    try {
      await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inStock: newStatus })
      });
    } catch (error) {
      console.error("Error updating stock", error);
      fetchAdminData();
    }
  };

  // ---------------- CATEGORY CRUD LOGIC ----------------
  const openCategoryModal = (category: any = null) => {
    if (category) {
      setEditingCategoryId(category._id);
      setCategoryName(category.name);
    } else {
      setEditingCategoryId(null);
      setCategoryName("");
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCategoryId ? "PATCH" : "POST";
    const url = editingCategoryId ? `/api/categories/${editingCategoryId}` : "/api/categories";
    
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName })
      });
      if (res.ok) {
        setIsCategoryModalOpen(false);
        fetchAdminData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to save category: ${errorData.error || res.statusText}`);
      }
    } catch (error) { console.error(error); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAdminData();
        if (currentCategories.length === 1 && categoryPage > 1) setCategoryPage(categoryPage - 1);
      }
    } catch (error) { console.error(error); }
  };

  // 📄 PAGINATION CALCULATIONS
  const totalProductPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const currentProducts = products.slice((productPage - 1) * ITEMS_PER_PAGE, productPage * ITEMS_PER_PAGE);

  const totalCategoryPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
  const currentCategories = categories.slice((categoryPage - 1) * ITEMS_PER_PAGE, categoryPage * ITEMS_PER_PAGE);


  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      
      {/* ---------------- MOBILE SIDEBAR OVERLAY ---------------- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* ---------------- SIDEBAR ---------------- */}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-[#0f172a] text-white z-50 transform ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl`}
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-2xl font-black tracking-widest text-white cursor-pointer" onClick={() => router.push('/')}>
            MR<span className="text-[#f97316]">ADMIN</span>
          </h2>
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-3 ${
                activeTab === item.id ? "bg-[#f97316] text-white shadow-md translate-x-1" : "text-gray-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="p-6 border-t border-slate-800">
          <button 
            onClick={() => setIsPasswordModalOpen(true)} 
            className="w-full bg-orange-500/10 text-orange-500 border border-orange-500/20 py-3 mb-3 rounded-xl font-bold text-sm hover:bg-orange-500 hover:text-white transition-all"
          >
            🔑 Change Password
          </button>
          <button onClick={handleLogout} className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-3 rounded-xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all">
            Sign Out
          </button>
        </div>
      </aside>

      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen overflow-hidden w-full relative">
        
        <header className="md:hidden bg-white shadow-sm px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#0f172a] p-1 focus:outline-none">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h1 className="text-lg font-black text-[#0f172a] capitalize truncate">{activeTab.replace('-', ' ')}</h1>
          </div>
          <div className="w-8 h-8 bg-[#0f172a] rounded-full text-white flex justify-center items-center font-bold text-xs shadow-sm">AD</div>
        </header>

        <div className="p-4 md:p-8 flex-1 overflow-y-auto w-full">
          <div className="hidden md:flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black text-[#0f172a] capitalize tracking-tight border-l-[5px] border-[#f97316] pl-4">
              {activeTab.replace('-', ' ')}
            </h1>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
              <div className="w-8 h-8 bg-[#0f172a] rounded-full text-white flex justify-center items-center font-bold text-sm">AD</div>
              <span className="font-bold text-sm text-[#0f172a]">Admin User</span>
            </div>
          </div>

          <div className="w-full max-w-full">
            {activeTab === "analytics" && <AnalyticsManager />}
            {activeTab === "sales" && <SalesManager />}
            {activeTab === "banners" && <BannerManager />}
            
            {/* ---------------- PRODUCTS TABLE ---------------- */}
            {activeTab === "products" && (
              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg md:text-xl font-bold text-[#0f172a]">Products Inventory</h2>
                    <button onClick={() => openProductModal()} className="bg-[#0f172a] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition">+ Add Product</button>
                 </div>
                 
                 <div className="overflow-x-auto w-full pb-4 scrollbar-hide">
                   <table className="w-full min-w-[700px] text-left border-collapse">
                     <thead>
                       <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                         <th className="p-4 rounded-tl-lg font-bold">Image</th>
                         <th className="p-4 font-bold">Product Name</th>
                         <th className="p-4 font-bold">Price</th>
                         <th className="p-4 font-bold text-center">Status</th>
                         <th className="p-4 rounded-tr-lg font-bold text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="text-sm">
                       {isFetchingData ? (
                         <tr>
                           <td colSpan={5} className="p-12 text-center">
                             <div className="flex flex-col items-center justify-center space-y-3">
                               <div className="w-8 h-8 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
                               <span className="text-gray-500 font-bold animate-pulse text-sm">Loading Products...</span>
                             </div>
                           </td>
                         </tr>
                       ) : currentProducts.length === 0 ? ( // 📄 products වෙනුවට currentProducts දැම්මා
                         <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-medium">No products found. Start by adding one!</td></tr>
                       ) : (
                         currentProducts.map(p => ( // 📄 products වෙනුවට currentProducts දැම්මා
                           <tr key={p._id} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                             <td className="p-4">
                               <div className="w-12 h-12 bg-white rounded-lg p-1 border border-gray-100 shadow-sm">
                                 {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" /> : <span className="text-xs text-gray-300">N/A</span>}
                               </div>
                             </td>
                             <td className="p-4">
                               <p className="font-bold text-[#0f172a]">{p.name}</p>
                               <p className="text-xs text-gray-500">{p.categoryId?.name}</p>
                             </td>
                             <td className="p-4 font-black text-[#f97316]">Rs {Number(p.price.toString().replace(/[^0-9.-]+/g,"")).toFixed(2)}</td>
                             <td className="p-4 text-center">
                               <button onClick={() => handleToggleStock(p._id, p.inStock !== false)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border shadow-sm hover:scale-105 active:scale-95 ${p.inStock !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                 {p.inStock !== false ? '✅ In Stock' : '❌ Out of Stock'}
                               </button>
                             </td>
                             <td className="p-4 text-right">
                               <button onClick={() => openProductModal(p)} className="text-blue-500 hover:text-blue-700 font-bold text-sm mr-4 transition-colors">Edit</button>
                               <button onClick={() => handleDeleteProduct(p._id)} className="text-red-500 hover:text-red-700 font-bold text-sm transition-colors">Delete</button>
                             </td>
                           </tr>
                         ))
                       )}
                     </tbody>
                   </table>
                 </div>

                 {/* 📄 PRODUCT PAGINATION UI */}
                 {!isFetchingData && totalProductPages > 1 && (
                   <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-gray-100 gap-4">
                     <span className="text-xs text-gray-500 font-medium">
                       Showing <span className="font-bold text-[#0f172a]">{(productPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-[#0f172a]">{Math.min(productPage * ITEMS_PER_PAGE, products.length)}</span> of <span className="font-bold text-[#0f172a]">{products.length}</span> entries
                     </span>
                     <div className="flex items-center gap-1">
                       <button disabled={productPage === 1} onClick={() => setProductPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[#f97316] disabled:opacity-50 transition">
                         Prev
                       </button>
                       {Array.from({ length: totalProductPages }, (_, i) => (
                         <button key={i + 1} onClick={() => setProductPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition ${productPage === i + 1 ? 'bg-[#f97316] text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                           {i + 1}
                         </button>
                       ))}
                       <button disabled={productPage === totalProductPages} onClick={() => setProductPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[#f97316] disabled:opacity-50 transition">
                         Next
                       </button>
                     </div>
                   </div>
                 )}

              </div>
            )}

            {/* ---------------- CATEGORIES TABLE ---------------- */}
            {activeTab === "categories" && (
               <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg md:text-xl font-bold text-[#0f172a]">Categories</h2>
                    <button onClick={() => openCategoryModal()} className="bg-[#f97316] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-orange-600 transition">+ Add Category</button>
                 </div>
                 <div className="overflow-x-auto w-full pb-4">
                   <table className="w-full min-w-[500px] text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="p-4 rounded-tl-lg font-bold">Category Name</th>
                          <th className="p-4 rounded-tr-lg font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isFetchingData ? (
                           <tr>
                             <td colSpan={2} className="p-12 text-center">
                               <div className="flex flex-col items-center justify-center space-y-3">
                                 <div className="w-8 h-8 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
                                 <span className="text-gray-500 font-bold animate-pulse text-sm">Loading Categories...</span>
                               </div>
                             </td>
                           </tr>
                        ) : currentCategories.length === 0 ? ( // 📄 categories වෙනුවට currentCategories
                          <tr><td colSpan={2} className="p-8 text-center text-gray-400 font-medium">No categories found...</td></tr>
                        ) : (
                          currentCategories.map(c => ( // 📄 categories වෙනුවට currentCategories
                            <tr key={c._id} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-bold text-[#0f172a]">{c.name}</td>
                              <td className="p-4 text-right">
                                <button onClick={() => openCategoryModal(c)} className="text-blue-500 hover:text-blue-700 font-bold text-sm mr-4 transition-colors">Edit</button>
                                <button onClick={() => handleDeleteCategory(c._id)} className="text-red-500 hover:text-red-700 font-bold text-sm transition-colors">Delete</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                   </table>
                 </div>

                 {/* 📄 CATEGORY PAGINATION UI */}
                 {!isFetchingData && totalCategoryPages > 1 && (
                   <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-gray-100 gap-4">
                     <span className="text-xs text-gray-500 font-medium">
                       Showing <span className="font-bold text-[#0f172a]">{(categoryPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-[#0f172a]">{Math.min(categoryPage * ITEMS_PER_PAGE, categories.length)}</span> of <span className="font-bold text-[#0f172a]">{categories.length}</span> entries
                     </span>
                     <div className="flex items-center gap-1">
                       <button disabled={categoryPage === 1} onClick={() => setCategoryPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[#f97316] disabled:opacity-50 transition">
                         Prev
                       </button>
                       {Array.from({ length: totalCategoryPages }, (_, i) => (
                         <button key={i + 1} onClick={() => setCategoryPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition ${categoryPage === i + 1 ? 'bg-[#f97316] text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                           {i + 1}
                         </button>
                       ))}
                       <button disabled={categoryPage === totalCategoryPages} onClick={() => setCategoryPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[#f97316] disabled:opacity-50 transition">
                         Next
                       </button>
                     </div>
                   </div>
                 )}

               </div>
            )}

          </div>
        </div>

        {/* ---------------- PRODUCT MODAL ---------------- */}
        {isProductModalOpen && (
          <div className="fixed inset-0 bg-[#0f172a]/70 backdrop-blur-sm z-[60] flex justify-center items-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-lg relative animate-fade-in my-auto">
              <button onClick={() => setIsProductModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold bg-gray-100 hover:bg-red-50 w-8 h-8 rounded-full flex justify-center items-center transition">✕</button>
              <h2 className="text-xl font-black text-[#0f172a] mb-6">{editingProductId ? 'Edit Product' : 'Add New Product'}</h2>
              
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Product Name</label>
                  <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#f97316] text-[#0f172a] bg-white font-medium" placeholder="Nike T-Shirt" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Price (Rs)</label>
                    <input required type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#f97316] text-[#0f172a] bg-white font-medium" placeholder="5000" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Category</label>
                    <select required value={productForm.categoryId} onChange={e => setProductForm({...productForm, categoryId: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#f97316] bg-white text-[#0f172a] font-medium">
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Image URL</label>
                  <input required type="url" value={productForm.imageUrl} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#f97316] text-[#0f172a] bg-white font-medium" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Description</label>
                  <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#f97316] resize-none h-24 text-[#0f172a] bg-white font-medium" placeholder="Product details..."></textarea>
                </div>
                <button type="submit" className="w-full bg-[#0f172a] text-white font-bold py-3 rounded-xl hover:bg-[#1e293b] transition mt-2">
                  {editingProductId ? 'Update Product' : 'Save Product'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ---------------- CATEGORY MODAL ---------------- */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-[#0f172a]/70 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-sm relative animate-fade-in">
              <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold bg-gray-100 hover:bg-red-50 w-8 h-8 rounded-full flex justify-center items-center transition">✕</button>
              <h2 className="text-xl font-black text-[#0f172a] mb-6">{editingCategoryId ? 'Edit Category' : 'Add New Category'}</h2>
              
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Category Name</label>
                  <input required type="text" value={categoryName} onChange={e => setCategoryName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#f97316] text-[#0f172a] bg-white font-medium" placeholder="Electronics" />
                </div>
                <button type="submit" className="w-full bg-[#f97316] text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition mt-2">
                  {editingCategoryId ? 'Update Category' : 'Save Category'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ---------------- CHANGE PASSWORD MODAL ---------------- */}
        {isPasswordModalOpen && (
          <div className="fixed inset-0 bg-[#0f172a]/70 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-sm relative animate-fade-in">
              <button onClick={() => setIsPasswordModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold bg-gray-100 hover:bg-red-50 w-8 h-8 rounded-full flex justify-center items-center transition">✕</button>
              <h2 className="text-xl font-black text-[#0f172a] mb-6">Change Password</h2>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Old Password</label>
                  <input required type="password" value={passForm.oldPassword} onChange={e => setPassForm({...passForm, oldPassword: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#f97316] text-[#0f172a] bg-white font-medium" placeholder="Enter current password" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">New Password</label>
                  <input required type="password" value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#f97316] text-[#0f172a] bg-white font-medium" placeholder="Enter new password" />
                </div>
                <button type="submit" disabled={isChangingPass} className={`w-full bg-[#f97316] text-white font-bold py-3 rounded-xl transition mt-2 ${isChangingPass ? 'opacity-70' : 'hover:bg-orange-600'}`}>
                  {isChangingPass ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}