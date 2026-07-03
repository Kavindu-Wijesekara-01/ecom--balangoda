"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function WishlistPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [username, setUsername]             = useState("");
  const [wishlist, setWishlist]             = useState<any[]>([]);
  const [cart, setCart]                     = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen]         = useState(false);
  const [toast, setToast]                   = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const user      = localStorage.getItem("user");
    const activeUser = user || (session?.user as any)?.username;

    if (status !== "loading") {
      if (!activeUser) {
        router.push("/login?callbackUrl=/wishlist");
      } else {
        setUsername(activeUser);
        setIsAuthChecking(false);
        const saved = localStorage.getItem(`wishlist_${activeUser}`);
        if (saved) setWishlist(JSON.parse(saved));
        const savedCart = localStorage.getItem("cart");
        if (savedCart) setCart(JSON.parse(savedCart));
      }
    }
  }, [session, status, router]);

  // ── Toast auto-dismiss ────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast(p => ({ ...p, show: false })), 3000);
    return () => clearTimeout(t);
  }, [toast.show, toast.message]);

  const showToast = (msg: string, type: "success" | "error" = "success") =>
    setToast({ show: true, message: msg, type });

  // ── Remove from wishlist ─────────────────────────────────────────────────
  const removeFromWishlist = (productId: string) => {
    const updated = wishlist.filter(item => item._id !== productId);
    setWishlist(updated);
    localStorage.setItem(`wishlist_${username}`, JSON.stringify(updated));
    showToast("Removed from wishlist", "error");
  };

  const clearWishlist = () => {
    setWishlist([]);
    localStorage.setItem(`wishlist_${username}`, JSON.stringify([]));
    showToast("Wishlist cleared", "error");
  };

  // ── Add to cart ──────────────────────────────────────────────────────────
  const addToCart = (product: any) => {
    if (product.inStock === false) {
      showToast("Sorry, this item is out of stock!", "error");
      return;
    }
    if (product.sizes?.length > 0 || product.colors?.length > 0) {
      showToast("Select size/color on product page 👕", "error");
      setTimeout(() => router.push(`/product/${product._id}`), 800);
      return;
    }
    let newCart = [...cart];
    const idx = newCart.findIndex(i => i._id === product._id);
    if (idx > -1) {
      newCart[idx].quantity = (newCart[idx].quantity || 1) + 1;
    } else {
      newCart.push({ ...product, quantity: 1 });
    }
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    showToast(`${product.name} added to cart!`, "success");
  };

  const totalCartCount = cart.reduce((s, i) => s + (i.quantity || 1), 0);

  // ── Loading screen ────────────────────────────────────────────────────────
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E63946] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Background blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[600px] rounded-full bg-red-100/25 blur-3xl" />
        <div className="absolute top-[30%] -right-[10%] w-[40%] h-[500px] rounded-full bg-blue-100/20 blur-3xl" />
      </div>

      {/* Toast */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-out flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl bg-white border ${toast.show ? "translate-y-0 opacity-100" : "-translate-y-16 opacity-0 pointer-events-none"} ${toast.type === "success" ? "border-emerald-200" : "border-red-200"}`}>
        {toast.type === "success"
          ? <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex justify-center items-center text-xs font-black">✓</div>
          : <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex justify-center items-center text-xs font-black">✕</div>}
        <span className="font-bold text-[13px] text-[#111827] whitespace-nowrap">{toast.message}</span>
      </div>

      {/* Navbar */}
      <Navbar
        cart={cart}
        onCartOpen={() => setIsCartOpen(true)}
        wishlistCount={wishlist.length}
      />

      {/* Main */}
      <main className="flex-1 container mx-auto px-4 md:px-6 mt-8 mb-16 max-w-5xl relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-[#E63946] to-[#C1121F] rounded-2xl flex items-center justify-center shadow-lg shadow-red-200/60">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#111827] leading-tight">My Wishlist</h1>
              <p className="text-sm text-gray-500 font-medium">
                {wishlist.length === 0 ? "Your saved items" : `${wishlist.length} saved item${wishlist.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          {wishlist.length > 0 && (
            <button
              onClick={clearWishlist}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All
            </button>
          )}
        </div>

        {/* Empty state */}
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 md:p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
              <svg className="w-12 h-12 text-red-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-[#111827] mb-2">Nothing saved yet</h3>
            <p className="text-gray-500 font-medium text-sm mb-8">
              Tap the ❤️ on any product to save it here for later.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-[#E63946] hover:bg-[#C1121F] text-white px-8 py-3 rounded-2xl font-bold text-sm transition-colors shadow-md shadow-red-200"
            >
              Browse Products →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlist.map((product) => {
              const isOutOfStock = product.inStock === false;
              return (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  {/* Image */}
                  <div
                    className="relative w-full aspect-square bg-slate-50 flex items-center justify-center p-3 cursor-pointer border-b border-gray-100 overflow-hidden"
                    onClick={() => router.push(`/product/${product._id}`)}
                  >
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
                        <span className="text-[10px] font-black text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full uppercase tracking-widest">Out of Stock</span>
                      </div>
                    )}
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-gray-300 text-xs font-bold">No Image</span>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFromWishlist(product._id); }}
                      className="absolute top-2 right-2 z-20 w-7 h-7 bg-white/95 shadow rounded-full flex items-center justify-center text-[#E63946] hover:bg-[#E63946] hover:text-white transition-all"
                      title="Remove from wishlist"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col flex-1 justify-between">
                    <div className="mb-3">
                      <h3
                        className="font-semibold text-xs text-slate-700 line-clamp-2 leading-snug mb-1.5 cursor-pointer hover:text-[#E63946] transition-colors"
                        onClick={() => router.push(`/product/${product._id}`)}
                      >
                        {product.name}
                      </h3>
                      <p className="text-[#1E3A8A] font-black text-sm">
                        Rs {Number(product.price.toString().replace(/[^0-9.-]+/g, "")).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => addToCart(product)}
                        disabled={isOutOfStock}
                        className={`w-full py-2 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                          isOutOfStock
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-[#1F2937] text-white hover:bg-[#111827] active:scale-95 shadow-sm"
                        }`}
                      >
                        {isOutOfStock ? (
                          "Unavailable"
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => router.push(`/product/${product._id}`)}
                        className="w-full py-1.5 rounded-xl font-bold text-[11px] text-gray-500 hover:text-[#111827] hover:bg-gray-50 border border-gray-100 transition-all"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Cart Sidebar ───────────────────────────────────────────────── */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-[#111827]/70 backdrop-blur-sm flex justify-center items-end md:items-center z-50 p-0 md:p-4">
          <div className="bg-white text-gray-900 shadow-2xl rounded-t-3xl md:rounded-2xl p-5 md:p-6 w-full max-w-lg relative border border-gray-100 max-h-[85vh] flex flex-col">
            <button onClick={() => setIsCartOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold bg-gray-100 hover:bg-[#E63946] w-8 h-8 rounded-full flex justify-center items-center transition-colors">✕</button>
            <h3 className="font-black text-xl border-b border-gray-100 pb-3 mb-4 text-[#111827]">Shopping Cart</h3>
            {cart.length === 0 ? (
              <div className="text-center py-10 flex-1 flex flex-col justify-center items-center">
                <span className="text-5xl mb-3">🛒</span>
                <p className="text-gray-400 font-bold text-sm">Your cart is empty.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 overflow-y-auto flex-1 pr-1 max-h-[50vh]">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100 gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-white rounded-lg flex justify-center items-center p-1 shrink-0 shadow-sm">
                          <img src={item.imageUrl} alt={item.name} className="object-contain w-full h-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs truncate text-[#111827]">{item.name}</p>
                          <p className="text-[#E63946] text-[11px] font-black">Rs {Number(item.price.toString().replace(/[^0-9.-]+/g, "")).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center bg-white rounded-md p-1 border border-gray-200 shadow-sm">
                        <button
                          onClick={() => {
                            const nc = [...cart];
                            if ((nc[idx].quantity || 1) <= 1) nc.splice(idx, 1);
                            else nc[idx].quantity = (nc[idx].quantity || 1) - 1;
                            setCart(nc);
                            localStorage.setItem("cart", JSON.stringify(nc));
                          }}
                          className="w-6 h-6 font-black text-gray-600 hover:text-[#E63946] rounded flex justify-center items-center"
                        >-</button>
                        <span className="font-black text-xs px-3 text-[#111827]">{item.quantity || 1}</span>
                        <button
                          onClick={() => {
                            const nc = [...cart];
                            nc[idx].quantity = (nc[idx].quantity || 1) + 1;
                            setCart(nc);
                            localStorage.setItem("cart", JSON.stringify(nc));
                          }}
                          className="w-6 h-6 font-black text-gray-600 hover:text-green-500 rounded flex justify-center items-center"
                        >+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between font-black mb-4 text-lg text-[#111827]">
                    <span>Total:</span>
                    <span className="text-[#E63946]">Rs {cart.reduce((t, i) => t + Number(i.price.toString().replace(/[^0-9.-]+/g, "")) * (i.quantity || 1), 0).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => { setIsCartOpen(false); router.push("/checkout"); }}
                    className="w-full bg-[#E63946] hover:bg-[#C1121F] text-white py-3 rounded-lg font-bold text-sm hover:shadow-md transition active:scale-[0.98]"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
