import React from "react";
import CategoryMenu from "../components/CategoryMenu.jsx";
import Bestsellers from "../components/BestsellerItems.jsx";
import Footer from "../components/Footer.jsx";
import { motion } from "framer-motion";
const HomePage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 5 }}
      transition={{ duration: 0.01, ease: "easeOut" }}
    >
      <div className="bg-gray-50 min-h-screen">
        <div className="w-full max-w-[600px] mx-auto bg-white min-h-screen shadow-x mb-40">
          {/* brand name and tag line */}
          <div
            id="title"
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 rounded-b-[40px] p-6 pb-12 shadow-lg "
          >
            <div className="mt-4">
              <div>
                <h1 className="text-white text-4xl font-extrabold tracking-tight">
                  Shree Krishna Bakers
                </h1>
                <p className="text-orange-100 text-lg mt-1 font-medium">
                  Taste the tradition, feel the love.
                </p>{" "}
              </div>

              <div
                className="mt-8 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-4 flex flex-col"
                id="offers"
              >
                <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
                  Today's Special
                </span>

                <h2 className="text-white mt-1 text-2xl font-bold">
                  50% OFF on Large Pizzas 🍕
                </h2>
              </div>
            </div>
          </div>

          {/* explore menu section */}
          <div className="">
            <CategoryMenu />
            <Bestsellers />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;
