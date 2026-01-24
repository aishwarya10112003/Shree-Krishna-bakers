import React from "react";
import { Link, useLocation } from "react-router-dom";

// 1. We define our navigation items here to keep the code clean.
// If you want to add a new page later, just add it to this list.
const NAV_ITEMS = [
  { path: "/admin/menu", label: "Menu Management"},
  { path: "/admin/kitchen", label: "Kitchen Board" },
  { path: "/admin/analytics", label: "Sales Analytics" },
  
];

const Sidebar = () => {
  // 2. useLocation is a Hook that tells us the current URL (e.g., "/admin/menu")
  const location = useLocation();

  return (
    <aside className="w-64 bg-white h-screen border-r border-gray-100 flex flex-col fixed left-0 top-0 z-50">
      {/* --- A. LOGO SECTION --- */}
      <div className="p-8 pb-6">
        <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">
          Shree Krishna
        </h1>
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-1">
          Bakers & Restaurant
        </p>
      </div>

      {/* --- B. NAVIGATION LINKS --- */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          Menu & Kitchen
        </p>

        {NAV_ITEMS.map((item) => {
          // 3. LOGIC: Check if this item's path matches the current URL
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${
                  isActive
                    ? "bg-orange-50 text-orange-600 font-bold shadow-sm" // Active Style
                    : "text-gray-900 hover:bg-gray-50 hover:text-gray-900" // Inactive Style
                }
              `}
            >
              <span
                className={`text-lg ${
                  isActive
                    ? "scale-110"
                    : "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                }`}
              >
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => (window.location.href = "/")} // Force full reload to user side
          className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors w-full px-4 py-2"
        >
          <span className="text-xl">⬅️</span>
          <span className="font-bold">Back to Website</span>
        </button>
      </div>
      {/* --- C. ADMIN PROFILE (Bottom) --- */}
      <div className="p-4 border-t border-gray-100 m-4 bg-gray-50 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-200">
            A
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-800">Admin Panel</h4>
            <p className="text-[10px] text-gray-500">Store #1042</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
