import React, { useState } from "react";
import AuthForm from "../components/AuthForm";
import api from "../utils/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMyOrders } from "../hooks/useOrders";

const Accounts = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout } = useAuth();

  // OTP & Signup Flow States
  const [showOtpUI, setShowOtpUI] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingUser, setPendingUser] = useState(null);

  // Order history with live polling (enabled only when logged in).
  const { data: myOrders = [], isLoading: loadingOrders } =
    useMyOrders(isAuthenticated);

  // Split orders into "Live" (Active) and "Past" (Completed)
  const liveOrders = myOrders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Cancelled",
  );
  const pastOrders = myOrders.filter(
    (o) => o.status === "Delivered" || o.status === "Cancelled",
  );

  // 2. HANDLE AUTH FORM SUBMIT
  const handleAuth = async (formData, isLogin) => {
    try {
      if (isLogin) {
        const res = await api.post("/user/signin", formData);
        loginSuccess(res.data);
      } else {
        const res = await api.post("/user/signup", formData);
        if (res.status === 201) {
          setPendingUser(formData);
          setShowOtpUI(true);
          toast.success("OTP sent! Check the backend console (dev mode).");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Something went wrong!");
    }
  };

  // 3. HANDLE OTP VERIFICATION (verify -> auto-login)
  const handleVerifyOtp = async () => {
    try {
      await api.post("/user/verify-otp", {
        email: pendingUser.email,
        otp: otp,
      });
      const loginRes = await api.post("/user/signin", {
        email: pendingUser.email,
        password: pendingUser.password,
      });
      loginSuccess(loginRes.data);
      toast.success("Verification Successful! Logging you in...");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Invalid OTP or Verification Failed");
    }
  };

  // Helper: persist auth via context, then clean up + route admins to dashboard.
  const loginSuccess = (data) => {
    login(data);
    setShowOtpUI(false);
    setPendingUser(null);
    setOtp("");
    if (data.user.role === "admin") navigate("/admin");
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
  };

  // Reusable Card Component for displaying orders
  const OrderCard = ({ order, isLive }) => (
    <div
      className={`p-4 rounded-xl border mb-3 transition-all ${
        isLive ? "bg-orange-50 border-orange-200" : "bg-white border-gray-100"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-bold text-gray-800">
            Order #{order._id.slice(-6).toUpperCase()}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-bold uppercase ${
            order.status === "Order Placed"
              ? "bg-blue-100 text-blue-600"
              : order.status === "Preparing"
              ? "bg-orange-100 text-orange-600"
              : order.status === "Out for Delivery"
              ? "bg-purple-100 text-purple-600"
              : "bg-green-100 text-green-600"
          }`}
        >
          {order.status}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">
        {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
      </p>
      <div className="flex justify-between items-center pt-2 border-t border-gray-200/50">
        <span className="font-bold">₹{order.totalAmount}</span>
        {isLive && (
          <span className="text-xs text-orange-600 animate-pulse font-bold">
            ● Live Update
          </span>
        )}
      </div>
    </div>
  );

  // --- RENDER 1: LOGGED IN PROFILE ---
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 pb-24">
        {/* Profile Header Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 max-w-[600px] mx-auto border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
              <p className="text-orange-600 font-medium text-lg mt-1">
                {user.name}
              </p>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
            <div className="bg-orange-100 text-orange-600 font-bold px-3 py-1 rounded-full text-xs uppercase">
              {user.role}
            </div>
          </div>
          {user.role === "admin" && (
            <button
              onClick={() => navigate("/admin")}
              className="mt-6 w-full bg-gray-900 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-black transition-transform active:scale-95 flex justify-center items-center gap-2"
            >
              <span>⚡</span> Access Admin Dashboard
            </button>
          )}
          <button
            onClick={handleLogout}
            className="mt-6 w-full text-red-500 text-sm font-bold border border-red-100 bg-red-50 px-4 py-3 rounded-xl hover:bg-red-100 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Live Tracking Section */}
        <div className="max-w-[600px] mx-auto">
          {liveOrders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                🚀 Live Tracking{" "}
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </h2>
              {liveOrders.map((order) => (
                <OrderCard key={order._id} order={order} isLive={true} />
              ))}
            </div>
          )}

          {/* Order History Section */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Past Orders
            </h2>
            {loadingOrders ? (
              <p className="text-center text-gray-400">Loading orders...</p>
            ) : pastOrders.length > 0 ? (
              pastOrders.map((order) => (
                <OrderCard key={order._id} order={order} isLive={false} />
              ))
            ) : (
              <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                No past orders found. Hungry? 🍕
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER 2: OTP SCREEN ---
  if (showOtpUI) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Verify Email
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Check your VS Code Console for the OTP sent to{" "}
            <span className="font-semibold text-orange-600">
              {pendingUser?.email}
            </span>
          </p>

          <input
            type="text"
            placeholder="XXXXXX"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full text-center text-2xl tracking-[0.5em] font-bold p-4 border-2 border-orange-100 rounded-xl focus:outline-none focus:border-orange-500 text-gray-700 mb-6"
            maxLength={6}
          />

          <button
            onClick={handleVerifyOtp}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-orange-200"
          >
            Verify & Login
          </button>

          <button
            onClick={() => setShowOtpUI(false)}
            className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER 3: LOGIN / SIGNUP FORM ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Shree Krishna <span className="text-orange-600">Bakers</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Taste the tradition, feel the love.
        </p>
      </div>
      <AuthForm onLogin={handleAuth} />
    </div>
  );
};

export default Accounts;
