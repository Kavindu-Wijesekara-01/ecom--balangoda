"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Footer from "@/components/Footer";
import CheckoutModal from "@/components/CheckoutModal";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // (Auth is now handled inside Navbar component)
  const isLoggedIn = !!(session?.user || (typeof window !== "undefined" && localStorage.getItem("user")));

  // Data States
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]); 
  
  // UI, Cart & Wishlist States
  const [currentSlide, setCurrentSlide] = useState(0); 
  const [cart, setCart] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]); 
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // --- SPEED OPTIMIZATION STATES ---
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);

  // --- CUSTOM TOAST STATE ---
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: "", type: "success"});

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOption, setSortOption] = useState("latest");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    const activeUser = user || (session?.user as any)?.username;
    
    if (activeUser) {
      const savedWishlist = localStorage.getItem(`wishlist_${activeUser}`);
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    }
    
    const savedCart = localStorage.getItem("cart");
    if (savedCart) setCart(JSON.parse(savedCart));

    fetchData();
  }, [session]);

  const fetchData = async () => {
    const cachedProducts = sessionStorage.getItem("mrkorea_products");
    const cachedCategories = sessionStorage.getItem("mrkorea_categories");
    const cachedBanners = sessionStorage.getItem("mrkorea_banners");

    if (cachedProducts && cachedCategories && cachedBanners) {
      setProducts(JSON.parse(cachedProducts));
      setCategories(JSON.parse(cachedCategories));
      setBanners(JSON.parse(cachedBanners));
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    try {
      const [prodRes, catRes, banRes] = await Promise.all([
        fetch("/api/products", { cache: 'no-store' }), // Added no-store to get fresh reviews
        fetch("/api/categories"),
        fetch("/api/banners")
      ]);
      
      if (prodRes.ok) {
        const newProducts = await prodRes.json();
        setProducts(newProducts);
        sessionStorage.setItem("mrkorea_products", JSON.stringify(newProducts));
      }
      if (catRes.ok) {
        const newCategories = await catRes.json();
        setCategories(newCategories);
        sessionStorage.setItem("mrkorea_categories", JSON.stringify(newCategories));
      }
      if (banRes.ok) {
        const newBanners = await banRes.json();
        setBanners(newBanners);
        sessionStorage.setItem("mrkorea_banners", JSON.stringify(newBanners));
      }
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, selectedCategory, sortOption, minPrice, maxPrice]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, toast.message]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();

    // Clothing products require size/color selection — redirect to detail page
    if ((product.sizes?.length > 0) || (product.colors?.length > 0)) {
      showToast("Please select size & color on the product page 👕", "error");
      setTimeout(() => router.push(`/product/${product._id}`), 800);
      return;
    }
    
    let newCart = [...cart];
    const existingItemIndex = cart.findIndex(item => item._id === product._id);
    if (existingItemIndex > -1) {
      newCart[existingItemIndex].quantity = (newCart[existingItemIndex].quantity || 1) + 1;
    } else {
      newCart.push({ ...product, quantity: 1 });
    }
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    
    showToast(`${product.name} added to cart!`, "success");
  };

  const handleUpdateQuantity = (index: number, change: number) => {
    let newCart = [...cart];
    const currentQty = newCart[index].quantity || 1;
    if (currentQty + change > 0) {
      newCart[index].quantity = currentQty + change;
    } else {
      newCart.splice(index, 1);
      showToast("Item removed from cart", "error");
    }
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const handleRemoveFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    showToast("Item removed from cart", "error");
  };

  const toggleWishlist = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    const user = localStorage.getItem("user") || (session?.user as any)?.username;
    if (!user) {
      showToast("Please sign in to save items!", "error");
      return;
    }

    let newWishlist = [...wishlist];
    const index = newWishlist.findIndex(item => item._id === product._id);
    
    if (index > -1) {
      newWishlist.splice(index, 1);
      showToast("Removed from wishlist", "error");
    } else {
      newWishlist.push(product);
      showToast("Saved to your wishlist ❤️", "success");
    }
    
    setWishlist(newWishlist);
    localStorage.setItem(`wishlist_${user}`, JSON.stringify(newWishlist));
  };

  const getProcessedProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(p => p.categoryId?._id === selectedCategory);
    }

    filtered = filtered.filter(p => {
      const price = Number(p.price.toString().replace(/[^0-9.-]+/g,""));
      const min = minPrice === "" ? 0 : Number(minPrice);
      const max = maxPrice === "" ? Infinity : Number(maxPrice);
      return price >= min && price <= max;
    });

    if (sortOption === "latest") {
      filtered.reverse(); 
    } else if (sortOption === "low-high") {
      filtered.sort((a, b) => Number(a.price.toString().replace(/[^0-9.-]+/g,"")) - Number(b.price.toString().replace(/[^0-9.-]+/g,"")));
    } else if (sortOption === "high-low") {
      filtered.sort((a, b) => Number(b.price.toString().replace(/[^0-9.-]+/g,"")) - Number(a.price.toString().replace(/[^0-9.-]+/g,"")));
    }

    return filtered;
  };

  const displayedProducts = getProcessedProducts();
  const currentlyVisibleProducts = displayedProducts.slice(0, visibleCount);
  
  const calculateTotal = () => cart.reduce((t, i) => t + Number(i.price.toString().replace(/[^0-9.-]+/g,"")) * (i.quantity || 1), 0);

  return (
    // 👇 මෙතන තමයි වෙනස: bg-[#FFFFFF] වෙනුවට bg-gray-50 දැම්මා මුළු පිටුවටම
    <div className="min-h-screen bg-slate-50 relative">
      {/* Premium Blurred Background Accent Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[600px] rounded-full bg-blue-100/30 blur-3xl"></div>
        <div className="absolute top-[20%] -right-[10%] w-[45%] h-[500px] rounded-full bg-red-100/20 blur-3xl"></div>
      </div>
      
      <Navbar
        cart={cart}
        onCartOpen={() => setIsCartOpen(true)}
        wishlistCount={wishlist.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Mobile-only layout section */}
      {banners.length > 0 && !searchQuery && (
        <div className="md:hidden w-full px-2 mt-4">
          {/* Banner aspect ratio correctly sized */}
          <div className="w-full aspect-[1976/688] relative overflow-hidden rounded-xl shadow-md bg-transparent">
            {banners.map((banner, index) => (
              <div
                key={banner._id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img src={banner.imageUrl} alt="Promotion Banner" loading="lazy" className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-2">
              {banners.map((_, index) => (
                <button key={index} onClick={() => setCurrentSlide(index)} className={`h-1.5 rounded-full transition-all shadow-sm cursor-pointer ${index === currentSlide ? 'bg-[#E63946] w-6' : 'bg-white/80 w-2'}`} />
              ))}
            </div>
          </div>

          {/* Marquee Badge strip under the banner in Mobile view */}
          <div className="relative w-full overflow-hidden bg-white/65 backdrop-blur border border-slate-100 rounded-2xl py-2 mt-3.5 shadow-sm">
            <div className="animate-marquee flex gap-12 items-center">
              {[
                { icon: <svg className="w-4 h-4 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>, label: 'Fast Delivery', sub: 'Island-wide' },
                { icon: <svg className="w-4 h-4 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>, label: '100% Genuine', sub: 'Authentic Products' },
                { icon: <svg className="w-4 h-4 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>, label: 'Secure Payment', sub: 'Safe & Encrypted' },
                { icon: <svg className="w-4 h-4 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5"></path></svg>, label: 'Easy Returns', sub: 'Hassle-free' },
                { icon: <svg className="w-4 h-4 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z"></path></svg>, label: 'Best Prices', sub: 'Guaranteed' },
              ].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2 shrink-0 px-3 py-0.5 cursor-default">
                  <div className="p-1 bg-[#E63946]/5 rounded-lg">
                    {badge.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-800 leading-tight">{badge.label}</p>
                    <p className="text-[8px] text-slate-400 font-bold leading-tight">{badge.sub}</p>
                  </div>
                </div>
              ))}
              {/* Clone the array for seamless marquee scrolling loop */}
              {[
                { icon: <svg className="w-4 h-4 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>, label: 'Fast Delivery', sub: 'Island-wide' },
                { icon: <svg className="w-4 h-4 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>, label: '100% Genuine', sub: 'Authentic Products' },
                { icon: <svg className="w-4 h-4 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>, label: 'Secure Payment', sub: 'Safe & Encrypted' },
                { icon: <svg className="w-4 h-4 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5"></path></svg>, label: 'Easy Returns', sub: 'Hassle-free' },
                { icon: <svg className="w-4 h-4 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z"></path></svg>, label: 'Best Prices', sub: 'Guaranteed' },
              ].map((badge, idx) => (
                <div key={`dup-${idx}`} className="flex items-center gap-2 shrink-0 px-3 py-0.5 cursor-default">
                  <div className="p-1 bg-[#E63946]/5 rounded-lg">
                    {badge.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-800 leading-tight">{badge.label}</p>
                    <p className="text-[8px] text-slate-400 font-bold leading-tight">{badge.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile App View filter/category selectors */}
      <div className="w-full px-4 mt-4 md:hidden space-y-3">
        {/* Category horizontal scrolling pills */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Explore Categories</span>
          <div className="flex overflow-x-auto gap-2 py-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 shadow-sm border ${
                selectedCategory === ""
                  ? "bg-[#E63946] border-[#E63946] text-white"
                  : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50"
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 shadow-sm border ${
                  selectedCategory === cat._id
                    ? "bg-[#E63946] border-[#E63946] text-white"
                    : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sort and price pills row */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="relative shrink-0">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-slate-100/80 border border-slate-200/50 text-slate-800 text-[11px] font-bold py-2 px-3.5 pr-8 rounded-full focus:outline-none appearance-none cursor-pointer text-left min-w-[120px]"
            >
              <option value="latest">Sort: Newest</option>
              <option value="low-high">Sort: Low - High</option>
              <option value="high-low">Sort: High - Low</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <div className="shrink-0 flex items-center bg-slate-100/80 border border-slate-200/50 rounded-full px-3 py-1.5 h-[32px]">
            <span className="text-[10px] text-slate-400 font-extrabold mr-1.5 uppercase">Price:</span>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-12 text-[11px] font-bold text-slate-800 focus:outline-none placeholder-slate-400 text-center bg-transparent"
            />
            <span className="mx-1 text-slate-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-12 text-[11px] font-bold text-slate-800 focus:outline-none placeholder-slate-400 text-center bg-transparent"
            />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-8 mt-6 mb-12 max-w-[1600px]">
        {/* Desktop: sidebar + products layout */}
        <div className="hidden md:flex gap-4 items-start">

          {/* ── LEFT SIDEBAR (sticky) ── */}
          <aside className="w-56 shrink-0 sticky top-20 self-start z-30 space-y-5">
            {/* Category list */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-6 rounded-r bg-[#E63946] block -ml-4"></span>
                <h3 className="text-[17px] font-black text-slate-800 tracking-tight">Categories</h3>
              </div>
              <hr className="border-slate-100 mb-2 -mx-4" />
              <ul className="space-y-1 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                <li>
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`w-full text-left py-1.5 px-2 rounded-lg text-sm font-semibold transition-all ${
                      selectedCategory === ""
                        ? "text-[#E63946] bg-slate-50"
                        : "text-slate-600 hover:bg-slate-50/50 hover:text-slate-900"
                    }`}
                  >
                    All Categories
                  </button>
                </li>
                {categories.map(cat => (
                  <li key={cat._id}>
                    <button
                      onClick={() => setSelectedCategory(cat._id)}
                      className={`w-full text-left py-1.5 px-2 rounded-lg text-sm font-semibold transition-all ${
                        selectedCategory === cat._id
                          ? "text-[#E63946] bg-slate-50"
                          : "text-slate-600 hover:bg-slate-50/50 hover:text-slate-900"
                      }`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sort */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-6 rounded-r bg-[#E63946] block -ml-4"></span>
                <h3 className="text-[17px] font-black text-slate-800 tracking-tight">Sort By</h3>
              </div>
              <hr className="border-slate-100 mb-3 -mx-4" />
              <div className="space-y-3">
                {[
                  { value: 'latest', label: 'Newest Arrivals' },
                  { value: 'low-high', label: 'Price: Low to High' },
                  { value: 'high-low', label: 'Price: High to Low' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortOption(opt.value)}
                    className={`w-full flex items-center gap-2.5 py-2 px-3.5 border rounded-xl text-left text-xs font-bold transition-all ${
                      sortOption === opt.value
                        ? "border-[#E63946]/30 bg-orange-50/10 text-slate-800"
                        : "border-slate-100 text-slate-500 hover:border-slate-200 hover:text-slate-700"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      sortOption === opt.value ? "border-[#E63946] text-[#E63946]" : "border-slate-300"
                    }`}>
                      {sortOption === opt.value && <span className="w-2.5 h-2.5 rounded-full bg-[#E63946]"></span>}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-6 rounded-r bg-[#E63946] block -ml-4"></span>
                <h3 className="text-[17px] font-black text-slate-800 tracking-tight">Price Range</h3>
              </div>
              <hr className="border-slate-100 mb-3 -mx-4" />
              <div className="flex items-center gap-2">
                <div className="relative w-full">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rs</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200"
                  />
                </div>
                <span className="text-slate-300 font-bold">—</span>
                <div className="relative w-full">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rs</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* ── RIGHT CONTENT ── */}
          <div className="flex-1 min-w-0">

            {/* Desktop Banner — aspect-ratio matching the banner dimensions perfectly, background transparent/white */}
            {banners.length > 0 && !searchQuery && (
              <div className="relative w-full aspect-[1976/688] rounded-2xl overflow-hidden shadow-md bg-transparent mb-4">
                {banners.map((banner, index) => (
                  <div
                    key={banner._id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    <img
                      src={banner.imageUrl}
                      alt="Promotion Banner"
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                <div className="absolute bottom-2.5 left-0 right-0 z-20 flex justify-center gap-1.5">
                  {banners.map((_, index) => (
                    <button key={index} onClick={() => setCurrentSlide(index)} className={`h-1.5 rounded-full transition-all shadow-sm cursor-pointer ${index === currentSlide ? 'bg-[#E63946] w-5' : 'bg-white/70 w-1.5'}`} />
                  ))}
                </div>
              </div>
            )}

            {/* Continuous Marquee Feature Badges */}
            {!searchQuery && (
              <div className="relative w-full overflow-hidden bg-white/65 backdrop-blur border border-slate-100 rounded-2xl py-3.5 mb-5 shadow-sm">
                <div className="animate-marquee flex gap-5 items-center">
                  {[
                    { icon: <svg className="w-5 h-5 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>, label: 'Fast Delivery', sub: 'Island-wide' },
                    { icon: <svg className="w-5 h-5 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>, label: '100% Genuine', sub: 'Authentic Products' },
                    { icon: <svg className="w-5 h-5 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>, label: 'Secure Payment', sub: 'Safe & Encrypted' },
                    { icon: <svg className="w-5 h-5 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5"></path></svg>, label: 'Easy Returns', sub: 'Hassle-free' },
                    { icon: <svg className="w-5 h-5 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z"></path></svg>, label: 'Best Prices', sub: 'Guaranteed' },
                  ].map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 shrink-0 px-4 py-1 hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                      <div className="p-1.5 bg-[#E63946]/5 rounded-lg">
                        {badge.icon}
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-800 leading-tight">{badge.label}</p>
                        <p className="text-[9px] text-slate-400 font-bold leading-tight">{badge.sub}</p>
                      </div>
                    </div>
                  ))}
                  {/* Clone the array for seamless marquee scrolling loop */}
                  {[
                    { icon: <svg className="w-5 h-5 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>, label: 'Fast Delivery', sub: 'Island-wide' },
                    { icon: <svg className="w-5 h-5 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>, label: '100% Genuine', sub: 'Authentic Products' },
                    { icon: <svg className="w-5 h-5 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>, label: 'Secure Payment', sub: 'Safe & Encrypted' },
                    { icon: <svg className="w-5 h-5 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5"></path></svg>, label: 'Easy Returns', sub: 'Hassle-free' },
                    { icon: <svg className="w-5 h-5 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z"></path></svg>, label: 'Best Prices', sub: 'Guaranteed' },
                  ].map((badge, idx) => (
                    <div key={`dup-${idx}`} className="flex items-center gap-2.5 shrink-0 px-4 py-1 hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                      <div className="p-1.5 bg-[#E63946]/5 rounded-lg">
                        {badge.icon}
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-800 leading-tight">{badge.label}</p>
                        <p className="text-[9px] text-slate-400 font-bold leading-tight">{badge.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-black text-[#111827] border-l-[4px] border-[#E63946] pl-3 tracking-tight">
                {searchQuery ? "Search Results" : "Our Collection"}
              </h2>
              <span className="bg-[#1F2937] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">{displayedProducts.length} Items</span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden animate-pulse">
                    <div className="w-full h-52 bg-slate-200"></div>
                    <div className="p-4 flex flex-col flex-1 justify-between bg-white">
                      <div className="mb-3 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-10 bg-slate-200 rounded-lg w-full mt-2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
                <span className="text-5xl block mb-4">🔍</span>
                <h3 className="text-xl font-black text-[#111827] mb-2">No products found</h3>
                <p className="text-gray-500 font-medium text-sm">Try adjusting your filters or search query.</p>
                <button onClick={() => {setSearchQuery(""); setSelectedCategory(""); setMinPrice(""); setMaxPrice("");}} className="mt-5 text-[#E63946] font-bold hover:underline text-sm transition">Clear all filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5">
              {currentlyVisibleProducts.map((product) => {
                
                // Real-time Reviews Calculate 
                const reviewCount = product.reviews ? product.reviews.length : 0;
                const realAvgRating = reviewCount > 0 
                  ? (product.reviews.reduce((acc: any, rev: any) => acc + rev.rating, 0) / reviewCount).toFixed(1)
                  : 0;

                return (
                <div 
                  key={product._id} 
                  onClick={() => router.push(`/product/${product._id}`)} 
                  className="bg-white rounded-xl md:rounded-2xl shadow-sm hover:shadow-lg border border-gray-200 hover:-translate-y-1 hover:border-gray-300 transition-all duration-300 cursor-pointer group flex flex-col overflow-hidden relative"
                >
                  <button 
                    onClick={(e) => toggleWishlist(e, product)}
                    className="absolute top-2 left-2 md:top-3 md:left-3 z-20 w-7 h-7 md:w-8 md:h-8 bg-white/90 backdrop-blur rounded-full flex justify-center items-center shadow border border-gray-100 hover:scale-110 transition-transform"
                  >
                    <svg className={`w-4 h-4 md:w-5 md:h-5 transition-colors duration-300 ${wishlist.some(item => item._id === product._id) ? 'fill-[#E63946] text-[#E63946]' : 'fill-none text-gray-400 hover:text-[#E63946]'}`} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </button>

                  <div className="w-full h-40 sm:h-48 md:h-52 bg-slate-50/50 relative flex justify-center items-center p-1.5 md:p-2 overflow-hidden border-b border-gray-200/80">
                    <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10">
                      {product.inStock !== false ? (
                        <span className="bg-green-50 text-green-700 text-[8px] md:text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">In Stock</span>
                      ) : (
                        <span className="bg-rose-50 text-rose-700 text-[8px] md:text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">Out of Stock</span>
                      )}
                    </div>
                    {product.imageUrl ? (
                       <img src={product.imageUrl} alt={product.name} loading="lazy" className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out" />
                    ) : ( 
                      <span className="text-gray-300 font-bold text-xs">No Image</span> 
                    )}
                  </div>
                  
                  <div className="p-3 md:p-4 flex flex-col flex-1 justify-between bg-white">
                    <div className="mb-3">
                       <h3 className="font-semibold text-xs md:text-sm text-slate-600 line-clamp-2 leading-tight mb-1 md:mb-1.5 transition-colors" title={product.name}>{product.name}</h3>
                      
                      <div className="flex flex-col gap-1 mt-1.5 sm:flex-row sm:items-center sm:justify-between">
                         <p className="text-[#1E3A8A] font-bold text-sm md:text-base whitespace-nowrap">Rs {Number(product.price.toString().replace(/[^0-9.-]+/g,"")).toFixed(2)}</p>
                        
                        <div className="flex items-center gap-1 md:gap-1.5">
                          <svg className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs md:text-sm font-bold text-gray-700">
                             {Number(realAvgRating) > 0 ? realAvgRating : <span className="bg-blue-50 text-blue-700 text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">New</span>} 
                            {reviewCount > 0 && <span className="text-gray-400 font-semibold ml-1">({reviewCount})</span>}
                          </span>
                        </div>
                      </div>

                    </div>

                    <button 
                      onClick={(e) => {
                        if(product.inStock === false) { e.stopPropagation(); showToast("Sorry, this item is out of stock!", "error"); return; }
                        handleAddToCart(e, product);
                      }}
                      className={`w-full py-2 md:py-2.5 rounded-lg font-bold text-[11px] md:text-[13px] transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm mt-1.5 ${product.inStock !== false ? 'bg-slate-800 text-white hover:bg-slate-700 hover:shadow-md active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                    >
                      {product.inStock !== false ? (
                        <><svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> <span className="hidden sm:inline">Add to Cart</span><span className="sm:hidden">Add</span></>
                      ) : ("Unavailable")}
                    </button>
                  </div>
                </div>
              )})}
                </div>

                {visibleCount < displayedProducts.length && (
                  <div className="flex justify-center mt-10 mb-4">
                    <button onClick={() => setVisibleCount(prev => prev + 12)} className="bg-white border-2 border-[#E63946] text-[#E63946] hover:bg-[#E63946] hover:text-white px-8 py-2.5 rounded-xl font-black text-base transition-colors shadow-sm">
                      View More Products ↓
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── MOBILE layout (separate, unchanged structure) ── */}
        <div className="md:hidden">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-black text-[#111827] border-l-[4px] border-[#E63946] pl-3 tracking-tight">
              {searchQuery ? "Search Results" : "Our Collection"}
            </h2>
            <span className="bg-[#1F2937] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">{displayedProducts.length} Items</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden animate-pulse">
                  <div className="w-full h-44 bg-slate-200"></div>
                  <div className="p-3 flex flex-col flex-1 justify-between bg-white">
                    <div className="mb-3 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-9 bg-slate-200 rounded-lg w-full mt-2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
              <span className="text-5xl block mb-4">🔍</span>
              <h3 className="text-xl font-black text-[#111827] mb-2">No products found</h3>
              <p className="text-gray-500 font-medium text-sm">Try adjusting your filters or search query.</p>
              <button onClick={() => {setSearchQuery(""); setSelectedCategory(""); setMinPrice(""); setMaxPrice("");}} className="mt-5 text-[#E63946] font-bold hover:underline text-sm transition">Clear all filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                {currentlyVisibleProducts.map((product) => {
                  const reviewCount = product.reviews ? product.reviews.length : 0;
                  const realAvgRating = reviewCount > 0
                    ? (product.reviews.reduce((acc: any, rev: any) => acc + rev.rating, 0) / reviewCount).toFixed(1)
                    : 0;
                  return (
                    <div
                      key={product._id}
                      onClick={() => router.push(`/product/${product._id}`)}
                      className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-200 hover:-translate-y-1 hover:border-gray-300 transition-all duration-300 cursor-pointer group flex flex-col overflow-hidden relative"
                    >
                      <button
                        onClick={(e) => toggleWishlist(e, product)}
                        className="absolute top-2 left-2 z-20 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex justify-center items-center shadow border border-gray-100 hover:scale-110 transition-transform"
                      >
                        <svg className={`w-4 h-4 transition-colors duration-300 ${wishlist.some(item => item._id === product._id) ? 'fill-[#E63946] text-[#E63946]' : 'fill-none text-gray-400 hover:text-[#E63946]'}`} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </button>
                      <div className="w-full h-40 bg-slate-50/50 relative flex justify-center items-center p-1.5 overflow-hidden border-b border-gray-200/80">
                        <div className="absolute top-2 right-2 z-10">
                          {product.inStock !== false ? (
                            <span className="bg-green-50 text-green-700 text-[8px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">In Stock</span>
                          ) : (
                            <span className="bg-rose-50 text-rose-700 text-[8px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">Out of Stock</span>
                          )}
                        </div>
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} loading="lazy" className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out" />
                        ) : (
                          <span className="text-gray-300 font-bold text-xs">No Image</span>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1 justify-between bg-white">
                        <div className="mb-3">
                          <h3 className="font-semibold text-xs text-slate-600 line-clamp-2 leading-tight mb-1 transition-colors" title={product.name}>{product.name}</h3>
                          <div className="flex flex-col gap-1 mt-1.5">
                            <p className="text-[#1E3A8A] font-bold text-sm whitespace-nowrap">Rs {Number(product.price.toString().replace(/[^0-9.-]+/g,"")).toFixed(2)}</p>
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-yellow-400 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-xs font-bold text-gray-700">
                                {Number(realAvgRating) > 0 ? realAvgRating : <span className="bg-blue-50 text-blue-700 text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">New</span>}
                                {reviewCount > 0 && <span className="text-gray-400 font-semibold ml-1">({reviewCount})</span>}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            if(product.inStock === false) { e.stopPropagation(); showToast("Sorry, this item is out of stock!", "error"); return; }
                            handleAddToCart(e, product);
                          }}
                          className={`w-full py-2 rounded-lg font-bold text-[11px] transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm mt-1.5 ${product.inStock !== false ? 'bg-slate-800 text-white hover:bg-slate-700 hover:shadow-md active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                        >
                          {product.inStock !== false ? (
                            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> Add</>
                          ) : ("Unavailable")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {visibleCount < displayedProducts.length && (
                <div className="flex justify-center mt-10 mb-4">
                  <button onClick={() => setVisibleCount(prev => prev + 12)} className="bg-white border-2 border-[#E63946] text-[#E63946] hover:bg-[#E63946] hover:text-white px-8 py-2.5 rounded-xl font-black text-sm transition-colors shadow-sm">
                    View More Products ↓
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {isCartOpen && (
        <div className="fixed inset-0 bg-[#111827]/70 backdrop-blur-sm flex justify-center items-end md:items-center z-50 p-0 md:p-4 transition-all">
          <div className="bg-white text-gray-900 shadow-2xl rounded-t-3xl md:rounded-2xl p-5 md:p-6 w-full max-w-lg relative border border-gray-100 max-h-[85vh] flex flex-col animate-slide-up md:animate-none">
            <button onClick={() => setIsCartOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold bg-gray-100 hover:bg-[#E63946] w-8 h-8 rounded-full flex justify-center items-center transition-colors">✕</button>
            <h3 className="font-black text-xl md:text-2xl border-b border-gray-100 pb-3 mb-4 text-[#111827]">Shopping Cart</h3>
            {cart.length === 0 ? (
              <div className="text-center py-10 flex-1 flex flex-col justify-center items-center"><span className="text-5xl mb-3">🛒</span><p className="text-gray-400 font-bold text-sm md:text-base">Your cart is empty.</p></div>
            ) : (
              <>
                <div className="space-y-3 overflow-y-auto flex-1 pr-1 max-h-[50vh]">
                  {cart.map((item, index) => (
                    <div key={item._id || index} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100 gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-lg flex justify-center items-center p-1 shrink-0 shadow-sm"><img src={item.imageUrl} alt={item.name} className="object-contain w-full h-full" /></div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs md:text-sm truncate text-[#111827]">{item.name}</p>
                          <p className="text-[#E63946] text-[11px] md:text-xs font-black">Rs {Number(item.price.toString().replace(/[^0-9.-]+/g,"")).toFixed(2)}</p>
                          {/* Size / Color badges */}
                          {(item.selectedSize || item.selectedColor) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.selectedSize && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full border border-gray-200">{item.selectedSize}</span>}
                              {item.selectedColor && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full border border-gray-200">{item.selectedColor}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center bg-white rounded-md p-1 border border-gray-200 shadow-sm">
                        <button onClick={() => handleUpdateQuantity(index, -1)} className="w-6 h-6 font-black text-gray-600 hover:text-[#E63946] hover:bg-red-50 rounded flex justify-center items-center transition">-</button>
                        <span className="font-black text-xs px-3 text-[#111827] text-center">{item.quantity || 1}</span>
                        <button onClick={() => handleUpdateQuantity(index, 1)} className="w-6 h-6 font-black text-gray-600 hover:text-green-500 hover:bg-green-50 rounded flex justify-center items-center transition">+</button>
                      </div>
                      <button onClick={() => handleRemoveFromCart(index)} className="text-gray-300 hover:text-[#E63946] p-1 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between font-black mb-4 text-lg md:text-xl text-[#111827]">
                    <span>Total Amount:</span><span className="text-[#E63946]">Rs {calculateTotal().toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => { 
                      setIsCartOpen(false); 
                      if (isLoggedIn) {
                        router.push("/checkout");
                      } else {
                        router.push("/login?callbackUrl=/checkout");
                      }
                    }} 
                    className="w-full bg-[#E63946] hover:bg-[#C1121F] text-white py-3 rounded-lg font-bold text-sm md:text-base hover:shadow-md transition active:scale-[0.98]"
                  >
                    Proceed to Secure Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        cart={cart} 
        totalAmount={calculateTotal().toFixed(2)} 
        onSuccess={() => { setCart([]); localStorage.removeItem("cart"); setIsCheckoutOpen(false); showToast("Order placed successfully!", "success"); }}
      />

      <Footer />
    </div>
  );
}