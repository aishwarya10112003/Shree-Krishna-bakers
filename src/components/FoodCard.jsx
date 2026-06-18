import React from "react";
import { useCart } from "../context/CartContext";
import { useDelivery } from "../context/DeliveryContext";
import { useAuth } from "../context/AuthContext";

const FoodCard = ({ item }) => {
  const { addToCart, removeFromCart, cartItems } = useCart();
  const { serviceable, withinHours } = useDelivery();
  const { isAdmin } = useAuth();

  const itemId = item._id || item.id;
  const cartItem = cartItems.find((i) => i.id === itemId);
  const quantity = cartItem ? cartItem.quantity : 0;

  const comingSoon = Boolean(item.comingSoon);
  // Admins (in-store POS / dine-in) bypass the delivery geofence.
  const geofenceBlocked = !isAdmin && (!serviceable || !withinHours);
  const blocked = comingSoon || geofenceBlocked;

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
    return imgString; // emoji
  };

  return (
    <div className="flex items-center justify-between p-4 mb-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <div className="flex items-center gap-4">
        {/* Image Placeholder */}
        <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center text-3xl overflow-hidden">
          {renderImage(item.image)}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-800">{item.name}</h3>
            {comingSoon && (
              <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 capitalize">{item.category}</p>
          <p className="text-lg font-bold text-gray-900 mt-1">₹{item.price}</p>
          {blocked && (
            <p className="text-xs text-orange-600 mt-1">
              {comingSoon ? "Coming soon" : "We are not serviceable in your area"}
            </p>
          )}
        </div>
      </div>

      {/* Interactive Add Section */}
      <div className="min-w-[100px] flex justify-end">
        {blocked ? (
          <button
            disabled
            className="px-5 py-2 bg-gray-100 text-gray-400 font-bold rounded-lg cursor-not-allowed"
          >
            BLOCKED
          </button>
        ) : quantity === 0 ? (
          <button
            onClick={() => addToCart(item)}
            className="px-6 py-2 border border-orange-200 text-orange-600 font-bold rounded-lg bg-orange-50 hover:bg-orange-100 transition-all"
          >
            ADD
          </button>
        ) : (
          <div className="flex items-center justify-between w-24 px-2 py-1 bg-orange-50 border border-orange-100 rounded-lg text-orange-600 font-bold">
            <button onClick={() => removeFromCart(itemId)} className="text-xl px-2">
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
