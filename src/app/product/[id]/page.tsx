"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Footer from "@/components/Footer";
import CheckoutModal from "@/components/CheckoutModal";
import Navbar from "@/components/Navbar";

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  // Data States
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review States
  const [rating, setRating] = useState(0); 
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1) : 0;
  
  // User, Cart & Nav States
  const [username, setUsername] = useState("Customer");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Product Page Specific State
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [displayImage, setDisplayImage] = useState("");

  // --- CUSTOM TOAST STATE ---
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: "", type: "success"});

  const calculateTotal = () => cart.reduce((t, i) => t + Number(i.price.toString().replace(/[^0-9.-]+/g,"")) * (i.quantity || 1), 0);

  useEffect(() => {
    const user = localStorage.getItem("user");
    const activeUser = user || (session?.user as any)?.username;
    if (activeUser) {
      setIsLoggedIn(true);
      setUsername(activeUser);
    } else {
      setIsLoggedIn(false);
      setUsername("Customer");
    }
    const savedCart = localStorage.getItem("cart");
    if (savedCart) setCart(JSON.parse(savedCart));

    fetchProductData();
  }, [productId, session]);

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

  const fetchProductData = async () => {
    try {
      const res = await fetch("/api/products", { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const currentProduct = data.find((p: any) => p._id === productId);
        
        if (currentProduct) {
          setProduct(currentProduct);
          setReviews(currentProduct.reviews ? [...currentProduct.reviews].reverse() : []);
          setDisplayImage(currentProduct.imageUrl); // Default image
          setSelectedSize("");
          setSelectedColor("");

          const related = data.filter((p: any) => 
            p.categoryId?._id === currentProduct.categoryId?._id && p._id !== productId
          );
          setRelatedProducts(related.slice(0, 4));
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching product", error);
      setLoading(false);
    }
  };

  // ---------------- CART LOGIC ----------------
  const handleAddToCart = (e?: React.MouseEvent, productToAdd?: any) => {
    if (e) e.stopPropagation();
    
    const targetProduct = productToAdd || product;
    if(targetProduct.inStock === false) {
      showToast("Sorry, this item is currently out of stock!", "error");
      return;
    }

    // Validate size/color selection for the MAIN product (not related products)
    if (!productToAdd) {
      if (product.sizes?.length > 0 && !selectedSize) {
        showToast("Please select a size before adding to cart! 👕", "error");
        return;
      }
      if (product.colors?.length > 0 && !selectedColor) {
        showToast("Please select a color before adding to cart! 🎨", "error");
        return;
      }
    }
    
    let newCart = [...cart];
    // For clothing items, uniqueness is per product+size+color combination
    const cartKey = productToAdd
      ? (item: any) => item._id === targetProduct._id
      : (item: any) => item._id === targetProduct._id && item.selectedSize === selectedSize && item.selectedColor === selectedColor;

    const existingItemIndex = cart.findIndex(cartKey);

    if (existingItemIndex > -1) {
      const qtyToAdd = productToAdd ? 1 : orderQuantity;
      newCart[existingItemIndex].quantity = (newCart[existingItemIndex].quantity || 1) + qtyToAdd;
    } else {
      const qtyToAdd = productToAdd ? 1 : orderQuantity;
      const cartItem: any = { ...targetProduct, quantity: qtyToAdd };
      if (!productToAdd) {
        cartItem.selectedSize = selectedSize;
        cartItem.selectedColor = selectedColor;
      }
      newCart.push(cartItem);
    }

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    setIsCartOpen(true);
    setOrderQuantity(1); 
  };

  const handleUpdateQuantity = (index: number, change: number) => {
    let newCart = [...cart];
    const currentQty = newCart[index].quantity || 1;
    if (currentQty + change > 0) {
      newCart[index].quantity = currentQty + change;
    } else {
      newCart.splice(index, 1);
    }
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const handleRemoveFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };


  // ---------------- REVIEW LOGIC ----------------
  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return showToast("Please select a star rating!", "error");

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, rating, comment })
      });

      if (res.ok) {
        setRating(0);
        setComment("");
        fetchProductData(); 
        showToast("Review posted successfully!", "success");
      }
    } catch (error) {
      console.error("Review submit error", error);
      showToast("Something went wrong!", "error");
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-gray-50 text-[#E63946] font-bold text-xl"><div className="animate-spin text-4xl mr-3">⏳</div> Loading Product...</div>;
  if (!product) return <div className="min-h-screen flex justify-center items-center bg-gray-50 text-red-500 font-bold text-xl">Product not found!</div>;

  return (
    // 👇 පිටුවෙ Background එක Gray කළා 
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Premium Blurred Background Accent Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[600px] rounded-full bg-blue-100/30 blur-3xl"></div>
        <div className="absolute top-[20%] -right-[10%] w-[45%] h-[500px] rounded-full bg-red-100/20 blur-3xl"></div>
      </div>

      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-out flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl bg-white border ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'} ${toast.type === 'success' ? 'border-emerald-200' : 'border-red-200'}`}>
        {toast.type === 'success' ? (
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex justify-center items-center text-sm font-black shadow-inner">✓</div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex justify-center items-center text-sm font-black shadow-inner">✕</div>
        )}
        <span className="font-bold text-[13px] md:text-sm text-[#111827] whitespace-nowrap">{toast.message}</span>
      </div>
      
      <Navbar
        cart={cart}
        onCartOpen={() => setIsCartOpen(true)}
      />

      {/* ---------------- MAIN PRODUCT CONTENT ---------------- */}
      <main className="container mx-auto px-4 md:px-6 mt-4 md:mt-8 max-w-7xl">
        
        {/* 👇 අලුත් Breadcrumbs (සයිස් එක ලොකු කරලා, Home එක Click කරන්න පුළුවන්) */}
        <div className="flex items-center gap-2 text-sm md:text-base text-gray-500 font-bold mb-6">
          <span onClick={() => router.push('/')} className="hover:text-[#E63946] cursor-pointer transition flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Home
          </span>
          <span className="text-gray-400">/</span>
          <span className="uppercase text-gray-600 cursor-default">{product.categoryId?.name || "Category"}</span>
          <span className="text-gray-400">/</span>
          <span className="text-[#111827] font-black truncate max-w-[200px] md:max-w-md cursor-default">{product.name}</span>
        </div>

        {/* ---------------- PRODUCT DETAILS SECTION ---------------- */}
        {/* 👇 සුදු පාට කොටුව (White Card) */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-200 p-5 md:p-10 flex flex-col lg:flex-row gap-8 lg:gap-12 mb-10 md:mb-14">
          
          {/* Image Area */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="w-full bg-white rounded-2xl p-6 md:p-12 border border-gray-100 relative group overflow-hidden flex justify-center items-center">
              {displayImage ? (
                <img src={displayImage} alt={product.name} className="object-contain w-full max-h-[300px] md:max-h-[450px] group-hover:scale-105 transition-transform duration-500" />
              ) : product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="object-contain w-full max-h-[300px] md:max-h-[450px] group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <span className="text-gray-400 font-medium">No Image</span>
              )}
              <div className="absolute top-3 right-3 md:top-4 md:right-4 flex flex-col gap-2">
                 <span className="bg-white/90 backdrop-blur text-gray-800 text-[10px] md:text-sm font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm flex items-center gap-1 border border-gray-200">
                    <span className="text-yellow-500 text-sm md:text-base">★</span> {Number(averageRating) > 0 ? averageRating : 'New'}
                 </span>
              </div>
            </div>
          </div>
          
          {/* Details Area */}
          <div className="lg:w-1/2 flex flex-col justify-start">
            <span className="text-[11px] md:text-sm text-[#E63946] font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-8 h-[3px] bg-[#E63946] rounded-full"></span>
              {product.categoryId?.name || "Category"}
            </span>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#111827] mb-3 md:mb-4 leading-tight tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 md:gap-4 mb-5 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`text-lg md:text-xl ${star <= Math.round(Number(averageRating)) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                ))}
              </div>
              <span className="text-xs md:text-sm font-bold text-gray-500 underline cursor-pointer">{reviews.length} Customer Reviews</span>
            </div>
            
            <div className="flex items-center gap-4 md:gap-6 mb-6">
              <p className="text-3xl md:text-4xl text-[#E63946] font-black">Rs {Number(product.price.toString().replace(/[^0-9.-]+/g,"")).toFixed(2)}</p>
              
              {product.inStock !== false ? (
                <span className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[11px] md:text-sm w-max border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> IN STOCK
                </span>
              ) : (
                <span className="bg-red-50 text-red-700 font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[11px] md:text-sm w-max border border-red-200">
                  OUT OF STOCK
                </span>
              )}
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed text-[13px] md:text-base font-medium whitespace-pre-wrap">
              {product.description}
            </p>

            {/* ── SIZE SELECTOR ── */}
            {product.sizes?.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-extrabold text-[#111827] uppercase tracking-widest">Size</span>
                  {selectedSize && <span className="text-xs font-bold text-[#E63946] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">{selectedSize}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size === selectedSize ? "" : size)}
                      className={`min-w-[44px] h-10 px-4 rounded-lg border-2 font-bold text-sm transition-all duration-200 ${
                        selectedSize === size
                          ? 'border-[#E63946] bg-[#E63946] text-white shadow-md scale-105'
                          : 'border-gray-200 bg-white text-[#111827] hover:border-[#E63946] hover:text-[#E63946]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── COLOR SELECTOR ── */}
            {product.colors?.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-extrabold text-[#111827] uppercase tracking-widest">Color</span>
                  {selectedColor && <span className="text-xs font-bold text-[#E63946] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">{selectedColor}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color: any) => {
                    const colorName = color.name || color;
                    const colorImage = color.image || "";
                    const isSelected = selectedColor === colorName;
                    return (
                      <button
                        key={colorName}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedColor("");
                            setDisplayImage(product.imageUrl); // Reset to default
                          } else {
                            setSelectedColor(colorName);
                            if (colorImage) setDisplayImage(colorImage);
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 font-bold text-sm transition-all duration-200 ${
                          isSelected
                            ? 'border-[#E63946] bg-red-50 text-[#E63946] shadow-md scale-105'
                            : 'border-gray-200 bg-white text-[#111827] hover:border-[#E63946]'
                        }`}
                      >
                        {colorImage ? (
                          <span className="w-5 h-5 rounded-full border border-gray-300 shadow-inner shrink-0 overflow-hidden">
                            <img src={colorImage} alt={colorName} className="w-full h-full object-cover" />
                          </span>
                        ) : (
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300 shadow-inner shrink-0"
                            style={{ backgroundColor: colorName.toLowerCase() }}
                          />
                        )}
                        {colorName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* 👇 අලුත් Button සහ Quantity Sizes */}
            <div className="flex flex-row items-center gap-3 md:gap-5 mb-8">
               <div className="flex items-center bg-gray-50 rounded-xl p-1 md:p-1.5 border border-gray-200 shrink-0 shadow-inner">
                  <button onClick={() => setOrderQuantity(q => q > 1 ? q - 1 : 1)} className="w-10 h-10 font-black text-xl text-gray-500 hover:text-[#E63946] bg-white rounded-lg shadow-sm transition active:scale-95">-</button>
                  <span className="font-black text-base md:text-lg px-5 md:px-8 text-[#111827] text-center">{orderQuantity}</span>
                  <button onClick={() => setOrderQuantity(q => q + 1)} className="w-10 h-10 font-black text-xl text-gray-500 hover:text-green-600 bg-white rounded-lg shadow-sm transition active:scale-95">+</button>
               </div>
               
               <button 
                onClick={(e) => handleAddToCart(e)} 
                disabled={product.inStock === false}
                className={`py-3 md:py-3.5 px-5 md:px-8 rounded-xl transition-all duration-300 font-bold text-sm md:text-base flex-1 flex justify-center items-center gap-2 md:gap-3 shadow-md ${
                  product.inStock !== false 
                  ? 'bg-[#1F2937] hover:bg-[#111827] text-white hover:shadow-lg active:scale-[0.98]' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                {product.inStock !== false ? (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> Add to Cart</>
                ) : (
                  "Unavailable"
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:flex sm:gap-8 pt-6 border-t border-gray-100">
               <div className="flex items-center gap-3 bg-gray-50 sm:bg-transparent p-3 md:p-0 rounded-xl sm:rounded-none border border-gray-100 sm:border-transparent">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-50 text-[#E63946] flex justify-center items-center text-lg md:text-xl shrink-0">🚚</div>
                  <div className="flex flex-col"><p className="font-bold text-[#111827] text-[11px] md:text-sm">Fast Delivery</p><p className="text-[10px] md:text-xs font-medium text-gray-500">Island-wide</p></div>
               </div>
               <div className="flex items-center gap-3 bg-gray-50 sm:bg-transparent p-3 md:p-0 rounded-xl sm:rounded-none border border-gray-100 sm:border-transparent">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 text-blue-600 flex justify-center items-center text-lg md:text-xl shrink-0">✅</div>
                  <div className="flex flex-col"><p className="font-bold text-[#111827] text-[11px] md:text-sm">100% Authentic</p><p className="text-[10px] md:text-xs font-medium text-gray-500">Genuine items</p></div>
               </div>
            </div>
            
          </div>
        </div>

        {/* ---------------- REVIEWS SECTION ---------------- */}
        <div className="mb-12 bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-black text-[#111827]">Customer Reviews</h2>
            <span className="bg-gray-100 text-[#111827] text-xs md:text-sm font-black px-3 py-1 rounded-full">{reviews.length}</span>
          </div>
          
          <form onSubmit={submitReview} className="mb-8 md:mb-10 bg-gray-50 p-5 md:p-8 rounded-2xl border border-gray-200">
            <h3 className="font-bold text-[#111827] mb-3 md:mb-4 text-sm md:text-base">Share your experience</h3>
            <div className="flex gap-1 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} onClick={() => setRating(star)} className={`cursor-pointer text-3xl md:text-4xl hover:scale-110 transition-all ${rating >= star ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300'}`}>★</span>
              ))}
            </div>
            <textarea required value={comment} onChange={(e) => setComment(e.target.value)} className="w-full px-4 md:px-5 py-3 md:py-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] text-[#111827] text-sm md:text-base font-medium mb-5 bg-white resize-none shadow-sm" rows={3} placeholder="What do you think about this product?"></textarea>
            <button type="submit" className="w-full md:w-auto bg-[#E63946] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#C1121F] transition shadow-md active:scale-95">Post Review</button>
          </form>

          <div className="space-y-4 md:space-y-6">
            {reviews.length === 0 ? (
              <div className="text-center py-8"><p className="text-gray-400 font-bold text-sm md:text-lg">No reviews yet. Be the first to review!</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {reviews.map((review, index) => (
                  <div key={review._id || index} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1F2937] text-white flex justify-center items-center font-bold text-lg shadow-sm">{review.username.charAt(0).toUpperCase()}</div>
                        <span className="font-bold text-sm md:text-base text-[#111827]">{review.username}</span>
                      </div>
                      <span className="text-yellow-400 text-sm md:text-base tracking-widest bg-gray-50 px-2 py-1 rounded shadow-inner border border-gray-100">
                        {"★".repeat(review.rating)}<span className="text-gray-200">{"★".repeat(5-review.rating)}</span>
                      </span>
                    </div>
                    <p className="text-gray-600 font-medium pl-13 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---------------- RELATED PRODUCTS ---------------- */}
        {relatedProducts.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
               <h2 className="text-xl md:text-2xl font-black text-[#111827] border-l-[5px] border-[#E63946] pl-3">More from {product.categoryId?.name}</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {relatedProducts.map((item) => {
                const reviewCount = item.reviews ? item.reviews.length : 0;
                const realAvgRating = reviewCount > 0 
                  ? (item.reviews.reduce((acc: any, rev: any) => acc + rev.rating, 0) / reviewCount).toFixed(1)
                  : 0;

                return (
                <div key={item._id} onClick={() => router.push(`/product/${item._id}`)} className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-gray-200 hover:-translate-y-1 hover:border-gray-300 transition-all duration-300 cursor-pointer group flex flex-col overflow-hidden">
                  <div className="w-full h-40 md:h-48 bg-slate-50/50 relative flex justify-center items-center p-1.5 md:p-2 overflow-hidden border-b border-gray-200/85">
                    <div className="absolute top-3 right-3 z-10">
                      {item.inStock !== false ? (
                        <span className="bg-green-50 text-green-700 text-[8px] md:text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">In Stock</span>
                      ) : (
                        <span className="bg-rose-50 text-rose-700 text-[8px] md:text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">Out of Stock</span>
                      )}
                    </div>
                    {item.imageUrl ? (
                       <img src={item.imageUrl} alt={item.name} className="object-contain w-full h-full drop-shadow-sm group-hover:scale-105 transition-transform duration-500 ease-out" />
                    ) : ( <span className="text-gray-300 font-bold text-xs">No Image</span> )}
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1 justify-between bg-white">
                    <div className="mb-3">
                      <h3 className="font-semibold text-xs md:text-sm text-slate-600 line-clamp-2 leading-tight mb-2 transition-colors" title={item.name}>{item.name}</h3>
                      
                      <div className="flex flex-col gap-1 mt-1.5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[#1E3A8A] font-bold text-sm md:text-base whitespace-nowrap">Rs {Number(item.price.toString().replace(/[^0-9.-]+/g,"")).toFixed(2)}</p>
                        
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-bold text-gray-700">
                             {Number(realAvgRating) > 0 ? realAvgRating : <span className="bg-blue-50 text-blue-700 text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">New</span>} 
                          </span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        if(item.inStock === false) { e.stopPropagation(); showToast("Sorry, out of stock!", "error"); return; }
                        handleAddToCart(e, item);
                      }}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm ${item.inStock !== false ? 'bg-slate-800 text-white hover:bg-slate-700 hover:shadow-md active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                    >
                      {item.inStock !== false ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> Add to Cart</> : "Unavailable"}
                    </button>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}
      </main>

      {/* ---------------- CART MODAL ---------------- */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-[#111827]/70 backdrop-blur-sm flex justify-center items-end md:items-center z-50 p-0 md:p-4 transition-all">
          <div className="bg-white text-gray-900 shadow-2xl rounded-t-3xl md:rounded-3xl p-5 md:p-8 w-full max-w-lg relative border border-gray-100 max-h-[85vh] flex flex-col animate-slide-up md:animate-none">
            <button onClick={() => setIsCartOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-white font-bold bg-gray-100 hover:bg-[#E63946] w-8 h-8 rounded-full flex justify-center items-center transition-colors">✕</button>
            <h3 className="font-black text-xl md:text-3xl border-b border-gray-100 pb-4 mb-5 text-[#111827]">Shopping Cart</h3>
            {cart.length === 0 ? (
              <div className="text-center py-12 flex-1 flex flex-col justify-center items-center"><span className="text-6xl mb-4">🛒</span><p className="text-gray-400 font-bold text-lg">Your cart is empty.</p></div>
            ) : (
              <>
                <div className="space-y-4 overflow-y-auto flex-1 pr-2 max-h-[50vh]">
                  {cart.map((item, index) => (
                    <div key={item._id || index} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 gap-3 md:gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-xl flex justify-center items-center p-1 shrink-0 shadow-sm"><img src={item.imageUrl} alt={item.name} className="object-contain w-full h-full" /></div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm md:text-base truncate text-[#111827]">{item.name}</p>
                          <p className="text-[#E63946] text-[12px] md:text-sm font-black">Rs {Number(item.price.toString().replace(/[^0-9.-]+/g,"")).toFixed(2)}</p>
                          {/* Size / Color badges */}
                          {(item.selectedSize || item.selectedColor) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.selectedSize && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full border border-gray-200">{item.selectedSize}</span>}
                              {item.selectedColor && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full border border-gray-200">{item.selectedColor}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                        <button onClick={() => handleUpdateQuantity(index, -1)} className="w-6 h-6 md:w-8 md:h-8 font-black text-gray-600 hover:text-[#E63946] hover:bg-red-50 rounded md:rounded-md flex justify-center items-center transition">-</button>
                        <span className="font-black text-sm px-3 md:px-4 text-[#111827] text-center">{item.quantity || 1}</span>
                        <button onClick={() => handleUpdateQuantity(index, 1)} className="w-6 h-6 md:w-8 md:h-8 font-black text-gray-600 hover:text-green-500 hover:bg-green-50 rounded md:rounded-md flex justify-center items-center transition">+</button>
                      </div>
                      <button onClick={() => handleRemoveFromCart(index)} className="text-gray-300 hover:text-[#E63946] p-2 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="flex justify-between font-black mb-5 text-xl md:text-2xl text-[#111827]">
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
                    className="w-full bg-[#E63946] hover:bg-[#C1121F] text-white py-3.5 md:py-4 rounded-xl font-bold text-base md:text-lg hover:shadow-lg transition active:scale-[0.98]"
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