import React, { useState, useRef } from "react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import OrderSuccess from "../components/OrderSuccess";
import { useAuth } from "../context/AuthContext";
import { useDelivery } from "../context/DeliveryContext";
import { usePlaceOrder } from "../hooks/useOrders";
import { useCoupons } from "../hooks/useCoupons";

// Client-side preview of a coupon's discount (server stays authoritative).
const couponDiscount = (coupon, itemTotal) => {
  if (!coupon || itemTotal < (coupon.minOrderAmount || 0)) return 0;
  let d =
    coupon.type === "PERCENT"
      ? Math.floor((itemTotal * coupon.value) / 100)
      : coupon.value;
  if (coupon.maxDiscount != null) d = Math.min(d, coupon.maxDiscount);
  return Math.min(d, itemTotal);
};

const CartPage = () => {
  const { cartItems, getCartTotal, clearCart, addToCart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    hasLocation,
    coords,
    requestLocation,
    locating,
    distanceKm,
    serviceable,
    withinHours,
    deliveryFee,
    settings,
  } = useDelivery();
  const placeOrder = usePlaceOrder();
  const { data: coupons = [] } = useCoupons();

  const isAdminPOS = user?.role === "admin";

  const [showSuccess, setShowSuccess] = useState(false);
  const [tableNo, setTableNo] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [showOffers, setShowOffers] = useState(false);
  const idempotencyKeyRef = useRef(crypto?.randomUUID?.() ?? String(Date.now()));

  const loading = placeOrder.isPending;
  const subtotal = getCartTotal();

  // Coupon preview: a valid manual code wins; otherwise best auto-offer.
  const manualCoupon = coupons.find((c) => c.code === couponCode.trim().toUpperCase());
  const autoBest = coupons
    .filter((c) => c.isAuto)
    .map((c) => ({ c, d: couponDiscount(c, subtotal) }))
    .sort((a, b) => b.d - a.d)[0];
  const effectiveCoupon =
    manualCoupon && couponDiscount(manualCoupon, subtotal) > 0
      ? manualCoupon
      : autoBest && autoBest.d > 0
        ? autoBest.c
        : null;
  const discount = effectiveCoupon ? couponDiscount(effectiveCoupon, subtotal) : 0;

  const fee = isAdminPOS ? 0 : serviceable ? deliveryFee : 0;
  const total = Math.max(0, subtotal + fee - discount);

  const buildItems = () =>
    cartItems.map((item) => {
      const payload = { name: item.name, quantity: item.quantity, price: item.price };
      if (item._id) payload.productId = item._id;
      return payload;
    });

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to place an order!");
      navigate("/account");
      return;
    }

    let orderData;
    if (isAdminPOS) {
      if (!tableNo) {
        toast.error("⚠️ Please select a Table Number for this order!");
        return;
      }
      orderData = {
        idempotencyKey: idempotencyKeyRef.current,
        items: buildItems(),
        address: "Dine-In",
        tableNo,
        deliveryType: "DINE_IN",
      };
    } else {
      if (!withinHours) return toast.error("We're closed right now.");
      if (!hasLocation) return toast.error("Please add your delivery location.");
      if (!serviceable) return toast.error("We don't deliver to your area yet.");
      if (!phone.trim()) return toast.error("Please enter your phone number.");
      if (!address.trim()) return toast.error("Please enter your delivery address.");
      orderData = {
        idempotencyKey: idempotencyKeyRef.current,
        items: buildItems(),
        address: address.trim(),
        deliveryType: "DELIVERY",
        deliveryLat: coords.lat,
        deliveryLng: coords.lng,
        phone: phone.trim(),
        couponCode: couponCode.trim() || undefined,
      };
    }

    try {
      await placeOrder.mutateAsync(orderData);
      setShowSuccess(true);
      clearCart();
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
    navigate(isAdminPOS ? "/menu" : "/account");
  };

  // Customer checkout button state
  let buttonLabel = isAdminPOS ? "🚀 Fire Order to Kitchen" : "Place Order";
  let buttonDisabled = loading;
  if (!isAdminPOS) {
    if (!withinHours) {
      buttonLabel = "Closed";
      buttonDisabled = true;
    } else if (!hasLocation) {
      buttonLabel = "Add your location";
      buttonDisabled = true;
    } else if (!serviceable) {
      buttonLabel = "Not Serviceable Yet";
      buttonDisabled = true;
    }
  }
  if (loading) buttonLabel = "Processing...";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 max-w-[600px] mx-auto bg-white min-h-screen relative pb-24"
    >
      <h1 className="text-2xl font-bold mb-6">
        {isAdminPOS ? "🍽️ New Table Order" : "Your Cart"}
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
          {/* CART ITEMS with steppers */}
          <div className="space-y-3 mb-8">
            {cartItems.map((item) => (
              <div
                key={item._id || item.id}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-1">₹{item.price} each</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">₹{item.price * item.quantity}</span>
                  <div className="flex items-center bg-orange-600 text-white rounded-lg font-bold">
                    <button onClick={() => removeFromCart(item.id)} className="px-3 py-2">
                      −
                    </button>
                    <span className="px-2">{item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="px-3 py-2">
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ADMIN: TABLE SELECTION */}
          {isAdminPOS && (
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

          {/* CUSTOMER: DELIVERY DETAILS */}
          {!isAdminPOS && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-orange-600">📍</span> Delivery Details
              </h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-gray-400">👤</span>
                  <span className="text-gray-800">{user?.name || "Guest"}</span>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-gray-400">✉️</span>
                  <span className="text-gray-800">{user?.email || "—"}</span>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-gray-400">📞</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="bg-transparent outline-none w-full"
                  />
                </div>
                <div className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-gray-400 mt-1">📍</span>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Complete Delivery Address"
                    rows={3}
                    className="bg-transparent outline-none w-full resize-none"
                  />
                </div>
              </div>

              {/* LOCATION */}
              <button
                onClick={requestLocation}
                disabled={locating}
                className="w-full mt-3 bg-orange-50 border border-orange-200 text-orange-700 font-bold rounded-xl py-3 disabled:opacity-60"
              >
                {locating
                  ? "Locating…"
                  : hasLocation
                    ? `Location Added (${coords.lat}, ${coords.lng})`
                    : "📍 Use my location"}
              </button>

              {/* DISTANCE + FEE */}
              {hasLocation && settings && (
                <div className="mt-3 bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <div className="flex justify-between font-bold text-gray-800">
                    <span>Distance from bakery</span>
                    <span>{distanceKm} km</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-800 mt-1">
                    <span>Delivery fee</span>
                    <span className="text-orange-600">₹{fee}</span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Free delivery within {settings.freeDeliveryRadiusKm} km
                  </p>
                </div>
              )}

              <div className="mt-3">
                <ServiceabilityInline />
              </div>
            </div>
          )}

          {/* OFFERS / COUPON (customer) */}
          {!isAdminPOS && (
            <div className="mb-6">
              <button
                onClick={() => setShowOffers((v) => !v)}
                className="w-full border border-dashed border-orange-300 bg-orange-50/60 rounded-xl py-3 px-4 text-left font-bold text-orange-700"
              >
                View Offers • Apply coupon or auto offer
              </button>
              {showOffers && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none uppercase"
                    />
                  </div>
                  {coupons.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setCouponCode(c.code)}
                      className="w-full text-left bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm hover:border-orange-300"
                    >
                      <span className="font-bold text-orange-600">{c.code}</span>
                      <span className="text-gray-500"> — {c.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BILL */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Item Total</span>
              <span>₹{subtotal}</span>
            </div>
            {!isAdminPOS && (
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>₹{fee}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount {effectiveCoupon ? `(${effectiveCoupon.code})` : ""}</span>
                <span>−₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-4 border-t">
              <span>Total to Pay</span>
              <span>₹{total}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={buttonDisabled}
            className="w-full bg-orange-600 text-white font-bold py-4 rounded-2xl mt-8 shadow-lg active:scale-95 transition-transform disabled:bg-gray-400"
          >
            {buttonLabel}
          </button>
        </>
      )}

      <OrderSuccess show={showSuccess} onClose={handleCloseSuccess} />
    </motion.div>
  );
};

// Small inline serviceability banner (uses "Current distance" wording for the cart).
function ServiceabilityInline() {
  const { settings, hasLocation, serviceable, distanceKm } = useDelivery();
  if (!settings || !hasLocation || serviceable) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="font-bold text-red-800">We are not serviceable in your area</p>
      <p className="text-sm text-red-700 mt-0.5">
        We currently deliver up to {settings.deliveryRadiusKm} km from the bakery. Coming soon in your area.
      </p>
      <p className="text-sm text-red-600 mt-1">Current distance: {distanceKm} km</p>
    </div>
  );
}

export default CartPage;
