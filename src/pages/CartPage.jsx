import React, { useState, useRef } from "react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import OrderSuccess from "../components/OrderSuccess";
import { useAuth } from "../context/AuthContext";
import { usePlaceOrder } from "../hooks/useOrders";

const CartPage = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const placeOrder = usePlaceOrder();

  const [showSuccess, setShowSuccess] = useState(false);
  const [tableNo, setTableNo] = useState("");

  // One idempotency key per checkout; reused across retries / double-taps so the
  // server can never create a duplicate order. Reset after a successful order.
  const idempotencyKeyRef = useRef(crypto?.randomUUID?.() ?? String(Date.now()));

  const userRole = user?.role || "user";
  const loading = placeOrder.isPending;

  // Calculate Totals (display only — the server recomputes the authoritative total)
  const subtotal = getCartTotal();
  const delivery = userRole === "admin" ? 0 : subtotal > 0 ? 40 : 0;
  const total = subtotal + delivery;

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to place an order!");
      navigate("/account");
      return;
    }

    if (userRole === "admin" && !tableNo) {
      toast.error("⚠️ Please select a Table Number for this order!");
      return;
    }

    const orderData = {
      idempotencyKey: idempotencyKeyRef.current,
      items: cartItems.map((item) => {
        const payload = {
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        };
        if (item._id) payload.productId = item._id;
        return payload;
      }),
      totalAmount: total,
      address: userRole === "admin" ? "Dine-In" : "Default Address",
      tableNo: userRole === "admin" ? tableNo : "",
    };

    try {
      await placeOrder.mutateAsync(orderData);
      setShowSuccess(true);
      clearCart();
      // Fresh key so the next order isn't treated as a replay of this one.
      idempotencyKeyRef.current = crypto?.randomUUID?.() ?? String(Date.now());
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.msg ||
          "Failed to place order. Try again.",
      );
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    if (userRole === "admin") {
      navigate("/menu");
    } else {
      navigate("/account");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 max-w-[600px] mx-auto bg-white min-h-screen relative"
    >
      <h1 className="text-2xl font-bold mb-6">
        {userRole === "admin" ? "🍽️ New Table Order" : "Your Cart"}
      </h1>

      {cartItems.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-gray-500 text-lg">Your cart is empty 🛒</p>
          <button
            onClick={() => navigate("/menu")}
            className="mt-4 text-orange-600 font-bold hover:underline"
          >
            Browse Menu
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-10">
            {cartItems.map((item) => (
              <div
                key={item._id || item.id}
                className="flex justify-between items-center"
              >
                <span>
                  {item.name}{" "}
                  <span className="text-gray-400 text-sm">
                    x{item.quantity}
                  </span>
                </span>
                <span className="font-semibold">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          {/* 🟢 ADMIN ONLY: TABLE SELECTION GRID */}
          {userRole === "admin" && (
            <div className="mb-6 bg-orange-50 p-4 rounded-xl border border-orange-100">
              <label className="block text-orange-800 font-bold mb-2">
                Select Table Number
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setTableNo(String(num))}
                    className={`py-2 rounded-lg font-bold transition-all ${
                      tableNo === String(num)
                        ? "bg-orange-600 text-white shadow-md transform scale-105"
                        : "bg-white text-gray-600 border border-orange-200"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BILL DETAILS */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Item Total</span>
              <span>₹{subtotal}</span>
            </div>

            {/* Show Delivery Fee ONLY for regular users */}
            {userRole !== "admin" && (
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>₹{delivery}</span>
              </div>
            )}

            <div className="flex justify-between text-xl font-bold pt-4 border-t">
              <span>Total to Pay</span>
              <span>₹{total}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full bg-orange-600 text-white font-bold py-4 rounded-2xl mt-8 shadow-lg active:scale-95 transition-transform disabled:bg-gray-400"
          >
            {loading
              ? "Processing..."
              : userRole === "admin"
                ? "🚀 Fire Order to Kitchen"
                : "Place Order"}
          </button>
        </>
      )}

      {/* SUCCESS ANIMATION POPUP */}
      <OrderSuccess show={showSuccess} onClose={handleCloseSuccess} />
    </motion.div>
  );
};

export default CartPage;
