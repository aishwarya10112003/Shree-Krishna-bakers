import React from "react";
import { motion } from "framer-motion";

const CONTENT = {
  about: {
    title: "About Us",
    body: "Shri Krishna Bakers (Amul Parlour & Cafe), Jaipur, serves freshly baked breads, cakes, and snacks made with tradition and love. From early-morning bakes to celebration cakes, we bring quality and warmth to every order.",
  },
  contact: {
    title: "Contact Us",
    body: "Visit our Jaipur outlet or reach us online.\n\nPhone: +91-00000-00000\nEmail: hello@shrikrishnabakers.in\nHours: 10:00 AM – 10:00 PM, every day.",
  },
  privacy: {
    title: "Privacy Policy",
    body: "We collect only what we need to fulfil your order — your name, contact number, and delivery location. We use your location solely to check serviceability and deliver your order. We never sell your data.",
  },
  refund: {
    title: "Refund & Return",
    body: "As we serve freshly prepared, perishable food, items are generally non-returnable. If something is wrong with your order, please contact us within 2 hours of delivery and we'll make it right.",
  },
  terms: {
    title: "Terms & Conditions",
    body: "By placing an order you agree to our delivery serviceability area, business hours, pricing, and applicable delivery fees. Orders are accepted only within the bakery's current delivery radius and operating hours.",
  },
};

const StaticPage = ({ page }) => {
  const c = CONTENT[page] || { title: "Page", body: "" };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="bg-gray-50 min-h-screen">
        <div className="w-full max-w-[600px] mx-auto bg-white min-h-screen shadow-x mb-40 p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{c.title}</h1>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{c.body}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default StaticPage;
