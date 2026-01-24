import React, { useState, useEffect, useMemo } from "react";
import api from "../../utils/api";
import AddDishModal from "../components/AddDishModal"; // Import your Modal

const MenuManagement = () => {
  // --- 1. STATE MANAGEMENT ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls the popup
  const [activeCategory, setActiveCategory] = useState("All");

  // --- 2. FETCH DATA (READ) ---
  const fetchProducts = async () => {
    try {
      const res = await api.get("/admin/products");
      // Handle response structure { products: [...] }
      const data = res.data.products || res.data || [];
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching menu:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- 3. TOGGLE STOCK (UPDATE) ---
  const handleToggleStock = async (id) => {
    try {
      // A. Optimistic Update: Update UI immediately so it feels instant
      const updatedProducts = products.map((p) =>
        p._id === id ? { ...p, isAvailable: !p.isAvailable } : p
      );
      setProducts(updatedProducts);

      // B. API Call: Tell Backend to flip the switch
      await api.put(`/admin/toggle-stock/${id}`);
    } catch (error) {
      console.error("Stock update failed", error);
      alert("Failed to update stock");
      fetchProducts(); // Revert changes if server fails
    }
  };

  // --- 4. DELETE PRODUCT (DELETE) ---
  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to permanently delete this item?")
    )
      return;

    try {
      // A. API Call
      await api.delete(`/admin/remove-product/${id}`);

      // B. UI Update: Remove item from list without reloading
      setProducts(products.filter((p) => p._id !== id));
    } catch (error) {
      console.error("Delete failed", error);
      alert("Could not delete product");
    }
  };

  // --- 5. DYNAMIC CATEGORIES ---
  const dynamicCategories = useMemo(() => {
    if (!products.length) return ["All"];
    const allCats = products.map((p) => p.category);
    // Remove duplicates and sort
    return ["All", ...[...new Set(allCats)].sort()];
  }, [products]);

  // --- 6. FILTER LOGIC ---
  const filteredProducts =
    activeCategory === "All"
      ? products
      : products.filter((p) => p.category === activeCategory);

  // --- 7. IMAGE HELPER (URL vs EMOJI) ---
  const renderImage = (imgString) => {
    if (!imgString)
      return (
        <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-400">
          No Image
        </div>
      );

    // Check if it's a URL (http/https)
    if (imgString.startsWith("http")) {
      return (
        <img
          src={imgString}
          alt="Dish"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      );
    }
    // Assume it's an Emoji
    return (
      <div className="bg-orange-50 w-full h-full flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500">
        {imgString}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Menu Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage {products.length} items across your menu.
          </p>
        </div>

        {/* ADD BUTTON (Opens Modal) */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-200 flex items-center gap-2 transition-transform active:scale-95"
        >
          <span>+</span> Add New Dish
        </button>
      </div>

      {/* CATEGORY TABS */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm  overflow-x-auto">
        <div className="flex gap-2 min-w-max p-1">
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeCategory === cat
                  ? "bg-gray-800 text-white shadow-md"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCT GRID */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 animate-pulse">
          Loading Menu...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
            >
              {/* IMAGE CONTAINER */}
              <div className="h-36 rounded-xl overflow-hidden relative mb-4 shadow-inner bg-gray-50">
                {renderImage(product.image)}

                {/* 'SOLD OUT' OVERLAY */}
                {!product.isAvailable && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                      Sold Out
                    </span>
                  </div>
                )}
              </div>

              {/* DETAILS */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-md font-bold text-gray-800 leading-tight line-clamp-1">
                  {product.name}
                </h3>
                <span className="text-orange-600 font-bold text-lg">
                  ₹{product.price}
                </span>
              </div>

              <p className="text-gray-400 text-xs line-clamp-2 h-8 mb-4">
                {product.description || "No description available."}
              </p>

              {/* ACTION FOOTER */}
              <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                {/* 1. TOGGLE SWITCH */}
                <div
                  onClick={() => handleToggleStock(product._id)}
                  className="flex items-center gap-3 cursor-pointer group/toggle"
                >
                  <div
                    className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${
                      product.isAvailable ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${
                        product.isAvailable ? "left-5.5" : "left-0.5"
                      }`}
                    ></div>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      product.isAvailable ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {product.isAvailable ? "In Stock" : "Hidden"}
                  </span>
                </div>

                {/* 2. DELETE BUTTON */}
                <button
                  onClick={() => handleDelete(product._id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete Dish"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD DISH MODAL --- */}
      {/* When successful, calls fetchProducts to update the grid instantly */}
      <AddDishModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductAdded={fetchProducts}
        existingCategories={dynamicCategories.filter((c) => c !== "All")}
      />
    </div>
  );
};

export default MenuManagement;
