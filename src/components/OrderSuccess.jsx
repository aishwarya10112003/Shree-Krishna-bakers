import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const OrderSuccess = ({ show, onClose }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full mx-4"
          >
            {/* Animated Checkmark Circle */}
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <motion.svg
                viewBox="0 0 24 24"
                className="w-12 h-12 text-green-600"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <motion.path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Order Placed!
            </h2>
            <p className="text-gray-500 mb-6">
              Your delicious food is being prepared. Track it in your profile.
            </p>

            <button
              onClick={onClose}
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-transform active:scale-95"
            >
              Go to My Orders
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderSuccess;
