import React, { useState } from "react";
import { Lock, Mail, User, Phone } from "lucide-react";

export default function AuthForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login/Signup
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the data and the "mode" (Login vs Signup) back to the parent
    onLogin(formData, isLogin);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl w-full  max-w-[600px] mx-auto mt-10 border border-gray-100">
      {/* 1. THE TABS */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setIsLogin(true)}
          className={`flex-1 pb-3 text-sm font-bold ${
            isLogin
              ? "text-orange-600 border-b-2 border-orange-600"
              : "text-gray-400"
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={`flex-1 pb-3 text-sm font-bold ${
            !isLogin
              ? "text-orange-600 border-b-2 border-orange-600"
              : "text-gray-400"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* 2. THE FORM */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Signup Only Fields */}
        {!isLogin && (
          <>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                name="name"
                type="text"
                placeholder="Full Name"
                className="w-full pl-10 p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <Phone
                className="absolute left-3 top-3 text-gray-400"
                size={18}
              />
              <input
                name="phone"
                type="text"
                placeholder="Phone Number"
                className="w-full pl-10 p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                onChange={handleChange}
              />
            </div>
          </>
        )}

        {/* Common Fields */}
        <div className="relative">
          <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            className="w-full pl-10 p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
            onChange={handleChange}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full pl-10 p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-200 active:scale-95 transition-transform"
        >
          {isLogin ? "Login" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
