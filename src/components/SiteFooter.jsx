import React from "react";
import { Link } from "react-router-dom";

const SiteFooter = () => (
  <footer className="bg-white border-t border-gray-100 pt-8 pb-28 px-6 text-center">
    <h3 className="text-xl font-bold text-orange-600">Shri Krishna Bakers</h3>
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 text-sm text-gray-500">
      <Link to="/about" className="hover:text-orange-600">About Us</Link>
      <Link to="/contact" className="hover:text-orange-600">Contact Us</Link>
      <Link to="/privacy" className="hover:text-orange-600">Privacy Policy</Link>
      <Link to="/refund" className="hover:text-orange-600">Refund &amp; Return</Link>
      <Link to="/terms" className="hover:text-orange-600">Terms &amp; Conditions</Link>
    </div>
    <p className="text-[11px] text-gray-300 font-bold tracking-widest uppercase mt-6">
      Amul Parlour &amp; Cafe | Jaipur
    </p>
    <p className="text-xs text-gray-400 mt-1">
      © {new Date().getFullYear()} Shri Krishna Bakers. All rights reserved.
    </p>
  </footer>
);

export default SiteFooter;
