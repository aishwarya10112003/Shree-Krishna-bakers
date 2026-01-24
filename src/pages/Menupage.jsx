import { motion } from "framer-motion";
import React, { useState, useEffect, useMemo } from "react";
import FoodCard from "../components/FoodCard";
import { useLocation } from "react-router-dom";
import api from "../utils/api"; // Your Axios instance

const MenuPage = () => {
  const location = useLocation();

  // 1. STATE
  const [products, setProducts] = useState([]); // Stores DB data
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  // 2. FETCH DATA FROM BACKEND
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // We use the new PUBLIC route we just created
        const res = await api.get("/user/menu");
        setProducts(res.data.products || []);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load menu", error);
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // 3. SET INITIAL CATEGORY (From Home Page Click)
  useEffect(() => {
    if (location.state && location.state.selectedCategory) {
      setActiveCategory(location.state.selectedCategory);
    }
  }, [location.state]);

  // 4. DYNAMIC CATEGORIES
  // Extract unique categories from the loaded products
  const categories = useMemo(() => {
    if (products.length === 0) return ["All"];

    const allCats = products.map((p) => p.category);
    // Remove duplicates and sort
    const uniqueCats = [...new Set(allCats)].sort();

    return ["All", ...uniqueCats];
  }, [products]);

  // 5. FILTER LOGIC
  const filteredItems =
    activeCategory === "All"
      ? products
      : products.filter((item) => item.category === activeCategory);

  return (
    <motion.div
      initial={{ opacity: 0, x: 5 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -5 }}
      transition={{ duration: 0.01, ease: "easeOut" }}
    >
      <div className="bg-gray-50 min-h-screen">
        <div className="w-full max-w-[600px] mx-auto bg-white min-h-screen shadow-x mb-40">
          {/* --- CATEGORY SCROLLER --- */}
          <div className="sticky top-0 bg-white z-40 border-b border-gray-100 shadow-sm">
            {loading ? (
              // Simple Skeleton Loader for Categories
              <div className="flex gap-3 p-4 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-20 bg-gray-100 rounded-full animate-pulse"
                  ></div>
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
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {activeCategory === "All"
                ? "Full Menu"
                : `${activeCategory} Items`}
            </h2>

            <div className="flex flex-col gap-2">
              {loading ? (
                <div className="text-center py-20 text-gray-400">
                  Loading delicious food... 🍕
                </div>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <FoodCard key={item._id} item={item} />
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-400">
                    No items found in this category.
                  </p>
                  <button
                    onClick={() => setActiveCategory("All")}
                    className="text-orange-600 font-bold mt-2 text-sm"
                  >
                    View All Items
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MenuPage;
