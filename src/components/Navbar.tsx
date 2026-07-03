"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface NavbarProps {
  /** Optional: cart items from parent page */
  cart?: any[];
  onCartOpen?: () => void;
  /** Optional: wishlist count from parent page (if parent manages wishlist) */
  wishlistCount?: number;
  /** Optional: search controlled by parent (homepage only) */
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export default function Navbar({
  cart = [],
  onCartOpen,
  wishlistCount,
  searchQuery,
  onSearchChange,
}: NavbarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const [isLoggedIn,        setIsLoggedIn]        = useState(false);
  const [username,          setUsername]           = useState("");
  const [wishlist,          setWishlist]           = useState<any[]>([]);
  const [isMobileMenuOpen,  setIsMobileMenuOpen]   = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [localSearch,       setLocalSearch]        = useState("");
  const [isUserDropOpen,    setIsUserDropOpen]     = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const totalCartCount = cart.reduce((s, i) => s + (i.quantity || 1), 0);

  // External wishlist count wins if provided, otherwise use local wishlist
  const displayWishlistCount = wishlistCount !== undefined ? wishlistCount : wishlist.length;

  // ── Load auth + wishlist from storage ───────────────────────────────────────
  useEffect(() => {
    const user       = localStorage.getItem("user");
    const activeUser = user || (session?.user as any)?.username;
    if (activeUser) {
      setIsLoggedIn(true);
      setUsername(activeUser);
      const saved = localStorage.getItem(`wishlist_${activeUser}`);
      if (saved) setWishlist(JSON.parse(saved));
    } else {
      setIsLoggedIn(false);
      setUsername("");
      setWishlist([]);
    }
  }, [session]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setIsUserDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    localStorage.removeItem("user");
    localStorage.removeItem("auth_provider");
    localStorage.removeItem("user_email");
    await signOut({ redirect: false });
    setIsLoggedIn(false);
    setUsername("");
    setWishlist([]);
    setIsMobileMenuOpen(false);
    router.push("/");
  };

  const handleSearch = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setLocalSearch(val);
    }
  };

  const handleSearchSubmit = () => {
    if (!onSearchChange) {
      // Navigate to home with query if not on homepage
      if (localSearch.trim()) router.push(`/?q=${encodeURIComponent(localSearch)}`);
      else router.push("/");
    }
  };

  const currentSearchVal = onSearchChange !== undefined ? (searchQuery ?? "") : localSearch;

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <nav className="bg-[#1F2937] text-white shadow-xl fixed top-0 left-0 right-0 z-50 border-b border-gray-800/80">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* ─── LEFT: Logo ──────────────────────────────────────────── */}
            <div className="flex items-center gap-0 shrink-0">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-0 focus:outline-none"
                aria-label="Go to home"
              >
                <span
                  className="text-[22px] md:text-[26px] font-black tracking-widest leading-none"
                  style={{ color: "#E63946", filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.6))" }}
                >
                  MR.K
                </span>
                <span
                  className="text-[22px] md:text-[26px] font-black tracking-widest leading-none"
                  style={{
                    background: "linear-gradient(to bottom, #E63946 50%, #1D4ED8 50%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    WebkitTextStroke: "0.5px rgba(255,255,255,0.5)",
                    filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.6))",
                  }}
                >
                  O
                </span>
                <span
                  className="text-[22px] md:text-[26px] font-black tracking-widest leading-none"
                  style={{ color: "#E63946", filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.6))" }}
                >
                  REA
                </span>
              </button>
            </div>

            {/* ─── CENTER: Search bar (desktop) ───────────────────────── */}
            <div className="flex-1 max-w-xl hidden md:block">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={currentSearchVal}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit(); }}
                  className="w-full pl-11 pr-4 py-2 bg-slate-800/50 border border-slate-700/60 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E63946]/50 focus:border-[#E63946]/80 text-sm text-white placeholder-gray-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* ─── RIGHT: Actions ─────────────────────────────────────── */}
            <div className="flex items-center gap-1 md:gap-2">

              {/* Mobile search toggle */}
              <button
                onClick={() => { setIsMobileSearchOpen(v => !v); setIsMobileMenuOpen(false); }}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Toggle search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Cart */}
              {onCartOpen && (
                <button
                  onClick={onCartOpen}
                  className="relative flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Open cart"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {totalCartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#E63946] text-white text-[9px] font-black min-w-[17px] h-[17px] rounded-full flex items-center justify-center border-2 border-[#1F2937] shadow">
                      {totalCartCount > 99 ? "99+" : totalCartCount}
                    </span>
                  )}
                </button>
              )}

              {/* Wishlist icon (desktop) */}
              {isLoggedIn && (
                <button
                  onClick={() => router.push("/wishlist")}
                  className={`hidden md:flex items-center justify-center w-9 h-9 rounded-xl transition-all ${isActive("/wishlist") ? "text-[#E63946] bg-[#E63946]/10" : "text-gray-400 hover:text-[#E63946] hover:bg-white/10"}`}
                  aria-label="Wishlist"
                >
                  <svg className="w-5 h-5" fill={displayWishlistCount > 0 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {displayWishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#E63946] text-white text-[9px] font-black min-w-[17px] h-[17px] rounded-full flex items-center justify-center border-2 border-[#1F2937] shadow sr-only">
                      {displayWishlistCount}
                    </span>
                  )}
                </button>
              )}

              {/* Desktop: Nav links + user section */}
              <div className="hidden md:flex items-center gap-1 pl-2 ml-1 border-l border-slate-700">
                {isLoggedIn ? (
                  <>
                    {/* My Orders */}
                    <button
                      onClick={() => router.push("/my-orders")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isActive("/my-orders") ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/8"}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="hidden lg:inline">My Orders</span>
                    </button>

                    {/* Admin Panel */}
                    {username === "mrkorea" && (
                      <button
                        onClick={() => router.push("/admin/dashboard")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="hidden lg:inline">Admin</span>
                      </button>
                    )}

                    {/* User avatar / dropdown */}
                    <div className="relative ml-1" ref={dropRef}>
                      <button
                        onClick={() => setIsUserDropOpen(v => !v)}
                        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/20 transition-all group"
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E63946] to-[#1D4ED8] flex items-center justify-center text-white text-[10px] font-black shrink-0">
                          {username.charAt(0).toUpperCase()}
                        </div>
                        <span className="hidden lg:block text-xs font-semibold text-gray-200 max-w-[80px] truncate">{username}</span>
                        <svg className={`w-3 h-3 text-gray-400 transition-transform ${isUserDropOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown */}
                      {isUserDropOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a2230] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                          <div className="px-4 py-3 border-b border-white/10">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Logged in as</p>
                            <p className="text-sm font-bold text-white truncate">{username}</p>
                          </div>
                          <div className="p-2 space-y-0.5">
                            <button onClick={() => { router.push("/wishlist"); setIsUserDropOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/8 transition-all text-left">
                              <svg className="w-4 h-4 text-[#E63946] shrink-0" fill={displayWishlistCount > 0 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span>Wishlist{displayWishlistCount > 0 ? ` (${displayWishlistCount})` : ""}</span>
                            </button>
                            <button onClick={() => { router.push("/my-orders"); setIsUserDropOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/8 transition-all text-left">
                              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span>My Orders</span>
                            </button>
                          </div>
                          <div className="p-2 border-t border-white/10">
                            <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left">
                              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <button onClick={() => router.push("/login")} className="px-4 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/8 transition-all">
                      Sign In
                    </button>
                    <button onClick={() => router.push("/register")} className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#E63946] hover:bg-[#C1121F] text-white transition-all shadow-md shadow-red-900/30">
                      Register
                    </button>
                  </>
                )}
              </div>

              {/* Mobile: hamburger (RIGHT side) */}
              <button
                onClick={() => { setIsMobileMenuOpen(v => !v); setIsMobileSearchOpen(false); }}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ─── Mobile Search Dropdown ────────────────────────────────────── */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMobileSearchOpen ? "max-h-16" : "max-h-0"}`}>
          <div className="px-4 pb-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search products..."
                value={currentSearchVal}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { handleSearchSubmit(); setIsMobileSearchOpen(false); } }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E63946] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* ─── Mobile Menu Drawer ────────────────────────────────────────── */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 border-t border-slate-800 ${isMobileMenuOpen ? "max-h-[500px]" : "max-h-0"}`}>
          <div className="px-4 py-4 space-y-3 bg-[#1F2937]">
            {isLoggedIn ? (
              <>
                {/* User info header */}
                <div className="px-2 text-xs text-gray-400 font-semibold mb-1">
                  Logged in as <span className="text-white font-bold">{username}</span>
                </div>
 
                {/* Flat Navigation Links */}
                <div className="flex flex-col border-t border-slate-700/50 pt-2 space-y-1">
                  {/* Home */}
                  <button
                    onClick={() => { router.push("/"); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-slate-800 transition-all text-left"
                  >
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Home</span>
                  </button>
 
                  {/* Wishlist */}
                  <button
                    onClick={() => { router.push("/wishlist"); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-slate-800 transition-all text-left"
                  >
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Wishlist</span>
                    {displayWishlistCount > 0 && (
                      <span className="ml-auto bg-[#E63946] text-white text-[10px] font-black px-2 py-0.5 rounded-full">{displayWishlistCount}</span>
                    )}
                  </button>
 
                  {/* My Orders */}
                  <button
                    onClick={() => { router.push("/my-orders"); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-slate-800 transition-all text-left"
                  >
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>My Orders</span>
                  </button>
 
                  {/* Admin Panel */}
                  {username === "mrkorea" && (
                    <button
                      onClick={() => { router.push("/admin/dashboard"); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-blue-400 hover:text-blue-300 hover:bg-slate-800 transition-all text-left"
                    >
                      <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Admin Panel</span>
                    </button>
                  )}
                </div>
 
                {/* Sign Out */}
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded-lg text-sm font-bold border border-red-500/20 transition-all text-center mt-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                {/* Home */}
                <button
                  onClick={() => { router.push("/"); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-slate-800 transition-all text-left mb-2"
                >
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Home</span>
                </button>
 
                <div className="flex flex-col gap-2 pt-3 border-t border-slate-700/50">
                  <button onClick={() => { router.push("/login"); setIsMobileMenuOpen(false); }} className="w-full bg-slate-800 border border-slate-700 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:bg-slate-700">
                    Sign In
                  </button>
                  <button onClick={() => { router.push("/register"); setIsMobileMenuOpen(false); }} className="w-full bg-[#E63946] hover:bg-[#C1121F] py-2.5 rounded-lg text-sm font-bold text-white transition-all shadow-md shadow-red-900/30">
                    Create Account
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
      {/* Spacer to prevent page content from being hidden behind the fixed navbar */}
      <div className="h-16 shrink-0" />

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.15s ease-out both; }
      `}</style>
    </>
  );
}
