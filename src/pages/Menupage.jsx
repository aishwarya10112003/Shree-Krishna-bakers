import { motion } from "framer-motion";
import React, { useState, useEffect, useMemo } from "react";
import FoodCard from "../components/FoodCard";
import { useLocation, useNavigate } from "react-router-dom";
import { useMenu } from "../hooks/useMenu";
import { useCart } from "../context/CartContext";
import { LocationPrompt, ServiceabilityNotice } from "../components/Serviceability";

const MenuPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: products = [], isLoading: loading } = useMenu();
  const { cartItems } = useCart();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState(location.state?.searchQuery || "");

  useEffect(() => {
    if (location.state?.selectedCategory) {
      setActiveCategory(location.state.selectedCategory);
    }
  }, [location.state]);

  const categories = useMemo(() => {
    if (products.length === 0) return ["All"];
    const uniqueCats = [...new Set(products.map((p) => p.category))].sort();
    return ["All", ...uniqueCats];
  }, [products]);

  const filteredItems = products.filter((item) => {
    const matchesCat = activeCategory === "All" || item.category === activeCategory;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const cartCount = cartItems.reduce((n, i) => n + i.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 5 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -5 }}
      transition={{ duration: 0.01, ease: "easeOut" }}
    >
      <div className="bg-gray-50 min-h-screen">
        <div className="w-full max-w-[600px] mx-auto bg-white min-h-screen shadow-x mb-40 relative">
          {/* --- SEARCH + CATEGORY SCROLLER (sticky) --- */}
          <div className="sticky top-0 bg-white z-40 border-b border-gray-100 shadow-sm">
            <div className="p-4 pb-0">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                <span className="text-gray-400">🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for Pizzas, Cakes, Burgers..."
                  className="bg-transparent outline-none w-full text-sm text-gray-700"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex gap-3 p-4 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 w-20 bg-gray-100 rounded-full animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto flex py-4 px-4 gap-3 no-scrollbar">
                {categories.map((cat, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all border ${
                      activeCategory === cat
                        ? "bg-orange-600 text-white border-orange-600 shadow-md scale-105"
                        : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* --- FOOD LIST CONTAINER --- */}
          <div className="p-4 pb-24">
            {/* serviceability */}
            <div className="mb-4 space-y-3">
              <LocationPrompt />
              <ServiceabilityNotice extraText="Add button disabled until your location falls inside our delivery area." />
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {activeCategory === "All" ? "Full Menu" : `${activeCategory} Items`}
            </h2>

            <div className="flex flex-col gap-2">
              {loading ? (
                <div className="text-center py-20 text-gray-400">
                  Loading delicious food... 🍕
                </div>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => <FoodCard key={item._id} item={item} />)
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-400">No items found.</p>
                  <button
                    onClick={() => {
                      setActiveCategory("All");
                      setSearch("");
                    }}
                    className="text-orange-600 font-bold mt-2 text-sm"
                  >
                    View All Items
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* --- FLOATING "GO TO CART" BAR --- */}
          {cartCount > 0 && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[92%] max-w-[560px] z-50">
              <button
                onClick={() => navigate("/cart")}
                className="w-full bg-gray-900 text-white font-bold py-4 px-4 rounded-2xl shadow-xl flex items-center justify-between active:scale-95 transition-transform"
              >
                <span className="flex items-center gap-3">
                  <span className="bg-orange-600 w-9 h-9 rounded-lg flex items-center justify-center">
                    🛍️
                  </span>
                  Go to Cart
                </span>
                <span className="bg-white text-gray-900 text-sm font-bold px-3 py-1 rounded-full">
                  {cartCount} item{cartCount > 1 ? "s" : ""}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MenuPage;
