import React from "react";
import { Outlet } from "react-router-dom"; // CRITICAL IMPORT
import Sidebar from "./Sidebar";

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* 1. THE SIDEBAR (Fixed Width) */}
      <Sidebar />

      {/* 2. THE CONTENT AREA (Flexible Width) */}
      {/* 'ml-64' pushes this div to the right so it doesn't hide behind the sidebar */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        {/* 3. THE OUTLET */}
        {/* This is a magic placeholder. 
            If user goes to /admin/menu, the <Menu /> component renders here.
            If user goes to /admin/kitchen, the <Kitchen /> component renders here.
        */}
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
