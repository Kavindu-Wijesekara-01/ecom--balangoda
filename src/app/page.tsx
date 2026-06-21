"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import CheckoutModal from "@/components/CheckoutModal";

export default function HomePage() {
  const router = useRouter();
  
  // User & Auth States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

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
    if (user) {
      setIsLoggedIn(true);
      setUsername(user);
      
      const savedWishlist = localStorage.getItem(`wishlist_${user}`);
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    }
    
    const savedCart = localStorage.getItem("cart");
    if (savedCart) setCart(JSON.parse(savedCart));

    fetchData();
  }, []);

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
    if (!isLoggedIn) {
      showToast("Please sign in first to add items!", "error");
      setTimeout(() => router.push("/login"), 1500);
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
    if (!isLoggedIn) {
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
    localStorage.setItem(`wishlist_${username}`, JSON.stringify(newWishlist));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUsername("");
    setWishlist([]); 
    setIsMobileMenuOpen(false);
    router.push("/");
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
  const totalCartItemsCount = cart.reduce((s, i) => s + (i.quantity || 1), 0);

  return (
    // 👇 මෙතන තමයි වෙනස: bg-[#FFFFFF] වෙනුවට bg-gray-50 දැම්මා මුළු පිටුවටම
    <div className="min-h-screen bg-gray-50 relative pb-10">
      
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-out flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl bg-white border ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'} ${toast.type === 'success' ? 'border-emerald-200' : 'border-red-200'}`}>
        {toast.type === 'success' ? (
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex justify-center items-center text-sm font-black shadow-inner">✓</div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex justify-center items-center text-sm font-black shadow-inner">✕</div>
        )}
        <span className="font-bold text-[13px] md:text-sm text-[#111827] whitespace-nowrap">{toast.message}</span>
      </div>

      <nav className="bg-[#1F2937] text-white py-3 shadow-lg sticky top-0 z-50 border-b border-gray-800">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl flex justify-between items-center gap-4">
          
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-gray-300 hover:text-white focus:outline-none p-1">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
            </button>
            

            <h1 
              className="text-2xl md:text-3xl font-black tracking-widest cursor-pointer flex items-center" 
              onClick={() => router.push('/')}
              style={{
                color: '#E63946',
                //WebkitTextStroke: '1px #FFFFFF', 
                filter: 'drop-shadow(2px 3px 2px rgba(0,0,0,0.5))' 
              }}
            >
              MR.K
              <span 
                style={{
                  background: 'linear-gradient(to bottom, #E63946 50%, #1D4ED8 50%)', 
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  WebkitTextStroke: '0.5px #FFFFFF'
                }}
              >
                O
              </span>
              REA
            </h1>


          </div>

          <div className="flex-1 max-w-2xl px-4 hidden md:block">
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                onKeyDown={(e) => { if(e.key === 'Enter') router.push('/') }}
                className="w-full pl-12 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full focus:outline-none focus:border-[#E63946] text-sm text-white transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} className="md:hidden text-gray-300 hover:text-white p-2 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>

            {isLoggedIn && (
              <>
                <div className="relative">
                  <button onClick={() => setIsCartOpen(true)} className="relative text-gray-300 hover:text-white p-2 transition-colors">
                    <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    {totalCartItemsCount > 0 && <span className="absolute top-0 right-0 bg-[#E63946] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1F2937] shadow-sm">{totalCartItemsCount}</span>}
                  </button>
                </div>
              </>
            )}

            <div className="hidden md:flex items-center gap-5 border-l border-slate-700 pl-5">
              {isLoggedIn ? (
                <>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Welcome</span>
                    <span className="font-semibold text-sm">{username}</span>
                  </div>
                  {username === "mrkorea" && <button onClick={() => router.push('/admin/dashboard')} className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-500/20 transition-colors">Admin Panel</button>}
                  <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 flex items-center gap-2 text-sm font-medium transition-colors"><span className="hidden lg:inline">Sign Out</span></button>
                </>
              ) : (
                <>
                  <button onClick={() => router.push('/login')} className="text-gray-200 hover:text-white text-sm font-medium transition-colors">Sign In</button>
                  <button onClick={() => router.push('/register')} className="bg-[#E63946] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#C1121F] transition-colors">Create Account</button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={`md:hidden absolute top-full left-0 w-full bg-[#1F2937] transition-all duration-300 overflow-hidden z-40 ${isMobileSearchOpen ? 'max-h-20 py-3 border-b border-slate-800 shadow-xl' : 'max-h-0 py-0'}`}>
          <div className="px-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></span>
              <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') router.push('/') }} className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#E63946]"/>
            </div>
          </div>
        </div>

        <div className={`md:hidden absolute top-full left-0 w-full bg-[#1F2937] border-b border-slate-800 transition-all duration-300 overflow-hidden shadow-2xl z-30 ${isMobileMenuOpen ? 'max-h-[300px] py-4' : 'max-h-0 py-0'}`}>
          <div className="px-4 space-y-4">
            {isLoggedIn ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-400">Logged in as <span className="font-bold text-white">{username}</span></p>
                <button onClick={() => router.push('/wishlist')} className="w-full bg-slate-800 border border-slate-700 py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg> My Wishlist
                </button>
                {username === "mrkorea" && <button onClick={() => router.push('/admin/dashboard')} className="w-full bg-blue-600 py-2.5 rounded-lg text-sm font-bold text-white transition-colors">Go to Admin Panel</button>}
                <button onClick={handleLogout} className="w-full bg-red-600/20 text-red-500 py-2.5 rounded-lg text-sm font-bold border border-red-500/30 transition-colors">Sign Out</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-2">
                <button onClick={() => router.push('/login')} className="w-full bg-slate-800 border border-slate-700 py-2.5 rounded-lg text-sm font-bold text-white transition-colors">Sign In</button>
                <button onClick={() => router.push('/register')} className="w-full bg-[#E63946] hover:bg-[#C1121F] py-2.5 rounded-lg text-sm font-bold text-white transition-colors">Register</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {banners.length > 0 && !searchQuery && (
        <div className="container mx-auto px-4 md:px-6 mt-4 md:mt-6 max-w-7xl">
          <div className="w-full relative overflow-hidden rounded-xl md:rounded-2xl shadow-md aspect-[2.5/1] sm:aspect-[3/1] lg:aspect-[4/1]">
            {banners.map((banner, index) => (
              <div key={banner._id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <img src={banner.imageUrl} alt="Promotion Banner" loading="lazy" className="w-full h-full object-cover object-center bg-gray-100" />
              </div>
            ))}
            <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-2">
              {banners.map((_, index) => (
                <button key={index} onClick={() => setCurrentSlide(index)} className={`h-1.5 md:h-2 rounded-full transition-all shadow-sm ${index === currentSlide ? 'bg-[#E63946] w-6' : 'bg-white/80 w-2'}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-6 mt-4 max-w-7xl">
        <div className="hidden md:flex bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4 items-center justify-between border-t-2 border-t-[#E63946]">
          <div className="flex gap-4">
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-extrabold text-gray-500 mb-1 ml-1 tracking-wider">Category</label>
              <div className="relative">
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-48 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#E63946] cursor-pointer hover:bg-gray-100 transition appearance-none pr-8">
                  <option value="">All Categories</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-extrabold text-gray-500 mb-1 ml-1 tracking-wider">Sort By</label>
              <div className="relative">
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-48 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#E63946] cursor-pointer hover:bg-gray-100 transition appearance-none pr-8">
                  <option value="latest">Latest Products</option>
                  <option value="low-high">Price: Low to High</option>
                  <option value="high-low">Price: High to Low</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-extrabold text-gray-500 mb-1 ml-1 tracking-wider">Price Range (Rs)</label>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#E63946]"/>
              <span className="text-gray-400 font-bold">-</span>
              <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#E63946]"/>
            </div>
          </div>
        </div>

        <div className="md:hidden flex overflow-x-auto gap-2 items-center py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="relative shrink-0">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-white border border-gray-200 text-[#111827] text-[11px] font-bold py-2 px-4 pr-8 rounded-full shadow-sm focus:outline-none focus:border-[#E63946] appearance-none cursor-pointer text-left min-w-[130px]">
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          <div className="relative shrink-0">
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full bg-white border border-gray-200 text-[#111827] text-[11px] font-bold py-2 px-4 pr-8 rounded-full shadow-sm focus:outline-none focus:border-[#E63946] appearance-none cursor-pointer text-left min-w-[130px]">
              <option value="latest">Latest Items</option>
              <option value="low-high">Price: Low - High</option>
              <option value="high-low">Price: High - Low</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          <div className="shrink-0 flex items-center bg-white border border-gray-200 rounded-full shadow-sm px-3 py-1.5 h-[34px]">
            <span className="text-[10px] text-[#E63946] font-extrabold mr-2 uppercase tracking-wider">Price</span>
            <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-12 text-[11px] font-bold text-[#111827] focus:outline-none placeholder-gray-300 text-center bg-transparent" />
            <span className="mx-1 text-gray-300">-</span>
            <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-12 text-[11px] font-bold text-[#111827] focus:outline-none placeholder-gray-300 text-center bg-transparent" />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-6 mt-6 mb-12 max-w-7xl">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-black text-[#111827] border-l-[4px] border-[#E63946] pl-3 tracking-tight">
            {searchQuery ? "Search Results" : "Our Collection"}
          </h2>
          <span className="bg-[#1F2937] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">{displayedProducts.length} Items</span>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden animate-pulse">
                <div className="w-full h-44 sm:h-52 md:h-64 bg-slate-200"></div>
                <div className="p-3 md:p-4 flex flex-col flex-1 justify-between bg-white">
                  <div className="mb-3 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-9 md:h-10 bg-slate-200 rounded-lg w-full mt-2"></div>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
                  className="bg-white rounded-xl md:rounded-2xl shadow-sm hover:shadow-lg border border-gray-200 hover:border-gray-300 transition-all duration-300 cursor-pointer group flex flex-col overflow-hidden relative"
                >
                  <button 
                    onClick={(e) => toggleWishlist(e, product)}
                    className="absolute top-2 left-2 md:top-3 md:left-3 z-20 w-7 h-7 md:w-8 md:h-8 bg-white/90 backdrop-blur rounded-full flex justify-center items-center shadow border border-gray-100 hover:scale-110 transition-transform"
                  >
                    <svg className={`w-4 h-4 md:w-5 md:h-5 transition-colors duration-300 ${wishlist.some(item => item._id === product._id) ? 'fill-[#E63946] text-[#E63946]' : 'fill-none text-gray-400 hover:text-[#E63946]'}`} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </button>

                  <div className="w-full h-44 sm:h-52 md:h-64 bg-white relative flex justify-center items-center p-0 overflow-hidden border-b border-gray-100">
                    <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10">
                      {product.inStock !== false ? (
                        <span className="bg-emerald-500 text-white text-[8px] md:text-[9px] font-black px-2 py-0.5 md:px-2 md:py-1 rounded shadow-sm uppercase tracking-wider">In Stock</span>
                      ) : (
                        <span className="bg-[#E63946] text-white text-[8px] md:text-[9px] font-black px-2 py-0.5 md:px-2 md:py-1 rounded shadow-sm uppercase tracking-wider">Out of Stock</span>
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
                      <h3 className="font-bold text-[12px] md:text-[14px] text-[#111827] line-clamp-2 leading-tight mb-1 md:mb-1.5 group-hover:text-[#E63946] transition-colors" title={product.name}>{product.name}</h3>
                      
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-[#E63946] font-black text-sm md:text-lg">Rs {Number(product.price.toString().replace(/[^0-9.-]+/g,"")).toFixed(2)}</p>
                        
                        <div className="flex items-center gap-1 md:gap-1.5">
                          <svg className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs md:text-sm font-bold text-gray-700">
                            {Number(realAvgRating) > 0 ? realAvgRating : <span className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider">New</span>} 
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
                      className={`w-full py-2 md:py-2.5 rounded-lg font-bold text-[11px] md:text-[13px] transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm mt-1 ${product.inStock !== false ? 'bg-[#1F2937] hover:bg-[#111827] text-white hover:shadow-md active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
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
                <button onClick={() => setVisibleCount(prev => prev + 12)} className="bg-white border-2 border-[#E63946] text-[#E63946] hover:bg-[#E63946] hover:text-white px-8 py-2.5 rounded-xl font-black text-sm md:text-base transition-colors shadow-sm">
                  View More Products ↓
                </button>
              </div>
            )}
          </>
        )}
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
                  <button onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} className="w-full bg-[#E63946] hover:bg-[#C1121F] text-white py-3 rounded-lg font-bold text-sm md:text-base hover:shadow-md transition active:scale-[0.98]">Proceed to Secure Checkout</button>
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