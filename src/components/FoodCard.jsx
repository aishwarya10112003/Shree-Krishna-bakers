import React from "react";
import { useCart } from "../context/CartContext";

const FoodCard = ({ item }) => {
  const { addToCart, removeFromCart, cartItems } = useCart();

  // 🟢 FIX 1: Normalize the ID
  // MongoDB items have '_id'. We check for both to be safe.
  const itemId = item._id || item.id;

  // 🟢 FIX 2: Use the normalized 'itemId' for finding
  const cartItem = cartItems.find((i) => i.id === itemId);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Helper for rendering Image vs Emoji
  const renderImage = (imgString) => {
    if (!imgString) return "🍽️";
    if (imgString.startsWith("http")) {
      return (
        <img
          src={imgString}
          alt={item.name}
          className="w-full h-full object-cover rounded-xl"
        />
      );
    }
    return imgString; // It's an emoji
  };

  return (
    <div className="flex items-center justify-between p-4 mb-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <div className="flex items-center gap-4">
        {/* Image Placeholder */}
        <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center text-3xl overflow-hidden">
          {renderImage(item.image)}
        </div>

        <div>
          <h3 className="font-bold text-gray-800">{item.name}</h3>
          <p className="text-xs text-gray-400 capitalize">{item.category}</p>
          <p className="text-lg font-bold text-gray-900 mt-1">₹{item.price}</p>
        </div>
      </div>

      {/* Interactive Add Section */}
      <div className="min-w-[100px] flex justify-end">
        {quantity === 0 ? (
          <button
            onClick={() => addToCart(item)}
            className="px-6 py-2 border border-orange-200 text-orange-600 font-bold rounded-lg bg-orange-50 hover:bg-orange-100 transition-all"
          >
            ADD
          </button>
        ) : (
          <div className="flex items-center justify-between w-24 px-2 py-1 bg-orange-50 border border-orange-100 rounded-lg text-orange-600 font-bold">
            <button
              // 🟢 FIX 3: Use normalized 'itemId' when removing
              onClick={() => removeFromCart(itemId)}
              className="text-xl px-2"
            >
              -
            </button>
            <span>{quantity}</span>
            <button onClick={() => addToCart(item)} className="text-xl px-2">
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodCard;
