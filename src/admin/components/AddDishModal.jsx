import React, { useState } from "react";
import toast from "react-hot-toast";
import { useAddProduct } from "../../hooks/useAdmin";

// PROPS:
// isOpen / onClose: control visibility.
// onProductAdded: optional callback after a successful add (list auto-refreshes
//   via React Query cache invalidation, so this is just for extra side effects).
const AddDishModal = ({ isOpen, onClose, onProductAdded, existingCategories }) => {
  const initialForm = {
    name: "",
    price: "",
    category: "",
    image: "",
    description: "",
  };

  const [formData, setFormData] = useState(initialForm);
  const addProduct = useAddProduct();
  const loading = addProduct.isPending;

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addProduct.mutateAsync(formData);
      toast.success("Dish Added Successfully! 🥘");
      onProductAdded?.();
      setFormData(initialForm);
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.msg ||
          error.response?.data?.error ||
          "Failed to add dish.",
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl p-8 shadow-2xl transform transition-all scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Dish</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Dish Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                placeholder="e.g. Truffle Burger"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Price (₹)
              </label>
              <input
                type="number"
                name="price"
                required
                value={formData.price}
                onChange={handleChange}
                className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                placeholder="450"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Category
            </label>

            <input
              type="text"
              name="category"
              list="category-options"
              required
              value={formData.category}
              onChange={handleChange}
              placeholder="Select or Type New Category..."
              className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />

            <datalist id="category-options">
              {existingCategories &&
                existingCategories.map((cat, index) => (
                  <option key={index} value={cat} />
                ))}
            </datalist>
            <p className="text-[10px] text-gray-400 mt-1">
              Type a new name to create a new category.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Image URL
            </label>
            <input
              type="text"
              name="image"
              required
              value={formData.image}
              onChange={handleChange}
              className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              placeholder="https://source.unsplash.com/..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
              placeholder="Briefly describe ingredients..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-transform active:scale-95 flex justify-center items-center"
          >
            {loading ? "Adding to Menu..." : "Add Dish to Menu"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDishModal;
