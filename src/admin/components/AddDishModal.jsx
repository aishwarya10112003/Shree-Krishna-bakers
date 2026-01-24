import React, { useState } from "react";
import api from "../../utils/api"; // Importing our central API helper (Axios)

// PROPS EXPLAINED:
// isOpen: A boolean (true/false) that tells this component whether to show up or hide.
// onClose: A function to set 'isOpen' to false (closes the modal).
// onProductAdded: A function to refresh the Menu page after we successfully add a dish.
const AddDishModal = ({ isOpen, onClose, onProductAdded ,existingCategories}) => {
  // 1. STATE: This holds the temporary data the user is typing into the form.
  // We match these keys EXACTLY to your Backend 'Product' model.
  const initialForm = {
    name: "",
    price: "",
    category: "", // Default selected value
    image: "",
    description: "",
  };

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false); // To show "Adding..." text while waiting

  // If the parent says "isOpen is false", we return null so nothing renders on screen.
  if (!isOpen) return null;

  // 2. HANDLER: Updates state whenever the user types in an input box.
  // We use [e.target.name] to dynamically update the correct field (name, price, etc.)
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. SUBMIT: The function that runs when you click "Add Dish"
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the browser from reloading the page (default HTML behavior)
    setLoading(true); // Start the loading state

    try {
      // API CALL: We send a POST request to your specific backend route.
      // Corresponds to: adminRouter.post("/add_product", ...)
      await api.post("/admin/add_product", formData);

      alert("Dish Added Successfully! 🥘");

      onProductAdded(); // Step A: Refresh the main list behind the modal
      setFormData(initialForm); // Step B: Clear the form for the next usage
      onClose(); // Step C: Close this popup
    } catch (error) {
      console.error(error);
      alert("Failed to add dish. Check console for details.");
    } finally {
      setLoading(false); // Stop loading regardless of success or failure
    }
  };

  return (
    // OVERLAY: The semi-transparent black background covering the whole screen
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      {/* MODAL BOX: The white container in the center */}
      <div className="bg-white w-full max-w-lg rounded-2xl p-8 shadow-2xl transform transition-all scale-100">
        {/* HEADER: Title and Close Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Dish</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* FORM: The inputs */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Name and Price */}
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

          {/* Row 2: Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Category
            </label>

            {/* Input with 'list' attribute connects to the datalist below */}
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

            {/* The Dropdown Options */}
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

          {/* Row 3: Image Link */}
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

          {/* Row 4: Description */}
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

          {/* SUBMIT BUTTON */}
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
