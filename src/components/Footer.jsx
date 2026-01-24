import React, { useState } from "react";
import { Home, UtensilsCrossed,  User, ShoppingBag } from "lucide-react";
import { NavLink } from "react-router-dom";


const Footer = () => {

  // 2. Define the navigation items
 const navItems = [
    { name: "Home", icon: Home, path: "/" }, // Added 'path' to match App.jsx
    { name: "Menu", icon: UtensilsCrossed, path: "/menu" },
    { name: "cart", icon: ShoppingBag, path: "/cart" },
    { name: "Account", icon: User, path: "/account" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-3 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <div className="max-w-[600px] mx-auto flex items-center justify-around">
        {navItems.map((item) => (
          
          <NavLink
            key={item.name}
            to={item.path}
            /* 3. isActive is provided automatically by React Router */
            className={({ isActive }) => `
              flex flex-col items-center justify-center cursor-pointer transition-all duration-200 flex-1
              ${
                isActive
                  ? "text-orange-600 scale-110"
                  : "text-gray-400 hover:text-gray-500"
              }
            `}
          >
            {/* 4. We can use the isActive variable inside the component too */}
            {({ isActive }) => (
              <>
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <div
                  className={`text-[10px] mt-1 font-bold ${
                    isActive ? "opacity-100" : "opacity-80"
                  }`}
                >
                  {item.name}
                </div>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Footer;
