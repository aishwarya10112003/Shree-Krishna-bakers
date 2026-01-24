import React, { useState, useEffect } from "react";
import AuthForm from "../components/AuthForm";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

const Accounts = () => {
  const navigate = useNavigate();

  // --- States ---
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // OTP & Signup Flow States
  const [showOtpUI, setShowOtpUI] = useState(false);
  const [otp, setOtp] = useState("");
  // We store the whole formData (email, pass, etc.) here so we can auto-login later
  const [pendingUser, setPendingUser] = useState(null);

  // 🟢 NEW: States for Order History
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // 1. INITIAL LOAD
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 🟢 NEW: Fetch Orders Logic (Only runs if user is logged in)
  const fetchMyOrders = async () => {
    if (!token) return;
    setLoadingOrders(true);
    try {
      const res = await api.get("/user/orders");
      setMyOrders(res.data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  // 🟢 NEW: Effect to fetch orders on login + Auto-refresh every 10s
  useEffect(() => {
    if (token) {
      fetchMyOrders();
      const interval = setInterval(fetchMyOrders, 10000); // Live tracking updates
      return () => clearInterval(interval);
    }
  }, [token]);

  // 🟢 NEW: Split orders into "Live" (Active) and "Past" (Completed)
  const liveOrders = myOrders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Cancelled"
  );
  const pastOrders = myOrders.filter(
    (o) => o.status === "Delivered" || o.status === "Cancelled"
  );

  // 2. HANDLE AUTH FORM SUBMIT
  const handleAuth = async (formData, isLogin) => {
    try {
      if (isLogin) {
        // Direct Login
        const res = await api.post("/user/signin", formData);
        loginSuccess(res.data);
      } else {
        // Signup -> Trigger OTP
        const res = await api.post("/user/signup", formData);
        if (res.status === 201) {
          // Success! Backend created user & logged OTP to console.
          // Save the user credentials so we can auto-login after verification
          setPendingUser(formData);
          setShowOtpUI(true);
          alert("OTP sent! ");
        }
      }
    } catch (error) {
      console.error("Auth Error:", error);
      alert(error.response?.data?.msg || "Something went wrong!");
    }
  };

  // 3. HANDLE OTP VERIFICATION (The "Double Jump")
  const handleVerifyOtp = async () => {
    try {
      // Step A: Verify the OTP
      await api.post("/user/verify-otp", {
        email: pendingUser.email,
        otp: otp,
      });

      // Step B: If Verify succeeds, Auto-Login immediately
      // We use the password we saved in pendingUser
      const loginRes = await api.post("/user/signin", {
        email: pendingUser.email,
        password: pendingUser.password,
      });

      // Step C: Save Token & Finish
      loginSuccess(loginRes.data);
      alert("Verification Successful! Logging you in...");
    } catch (error) {
      console.error("OTP Error:", error);
      alert(error.response?.data?.msg || "Invalid OTP or Verification Failed");
    }
  };

  // Helper: Save data and update state
  const loginSuccess = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);

    // Cleanup
    setShowOtpUI(false);
    setPendingUser(null);
    setOtp("");

    if (data.user.role === "admin") navigate("/admin");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setMyOrders([]); // 🟢 NEW: Clear orders on logout
    alert("Logged out successfully");
  };

  // 🟢 NEW: Reusable Card Component for displaying orders
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
        {order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
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

  // --- RENDER 1: LOGGED IN PROFILE (UPDATED WITH ORDERS) ---
  if (token && user) {
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

        {/* 🟢 NEW: Live Tracking Section */}
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

          {/* 🟢 NEW: Order History Section */}
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
