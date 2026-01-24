import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import OrderSuccess from "../components/OrderSuccess";

const CartPage = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 🟢 NEW: State for Admin/Table logic
  const [tableNo, setTableNo] = useState("");
  const [userRole, setUserRole] = useState("user");

  // 1. Check User Role on Load
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) setUserRole(user.role);
  }, []);

  // 2. Calculate Totals
  const subtotal = getCartTotal();
  // Logic: Admins (Dine-in) pay 0 delivery fee, Users pay 40
  const delivery = userRole === "admin" ? 0 : subtotal > 0 ? 40 : 0;
  const total = subtotal + delivery;

  // --- HANDLE ORDER LOGIC ---
  const handlePlaceOrder = async () => {
    // 1. Check Login
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to place an order!");
      navigate("/account");
      return;
    }

    // 🟢 VALIDATION: If Admin, Table Number is mandatory
    if (userRole === "admin" && !tableNo) {
      alert("⚠️ Please select a Table Number for this order!");
      return;
    }

    setLoading(true);

    try {
      // 2. Prepare Data for Backend
      const orderData = {
        items: cartItems.map((item) => ({
          productId: item._id || item.id, // Sends ID correctly
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: total,
        // 🟢 Logic: If Admin, Address is "Dine-In", else "Default Address"
        address: userRole === "admin" ? "Dine-In" : "Default Address",
        tableNo: userRole === "admin" ? tableNo : "",
      };

      // 3. Send Request
      await api.post("/user/place-order", orderData);

      // 4. Success Handling
      setLoading(false);
      setShowSuccess(true);
      clearCart();
    } catch (error) {
      console.error("Order Failed:", error);
      alert(error.response?.data?.error || "Failed to place order. Try again.");
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    // Logic: Admin -> Back to Menu (for next order), User -> Account (to track order)
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
