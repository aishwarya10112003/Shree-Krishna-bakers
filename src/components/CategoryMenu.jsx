
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Import the navigation hook
// 1. The Reusable Child Component
const CategoryItem = ({ name, image, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.9 }} // Shrinks slightly when pressed
      whileHover={{ y: -5 }} // Moves up slightly on hover
      className="flex flex-col items-center justify-center group cursor-pointer"
    >
      <div className="rounded-full border border-orange-400 bg-white w-20 h-20 shadow-md flex items-center justify-center overflow-hidden">
        <span className="text-3xl">{image}</span>
      </div>
      <span className="mt-3 text-[#4A4A4A] text-[13px] font-semibold text-center">
        {name}
      </span>
    </motion.div>
  );
};
// reusable bestsellersCard


// 2. The Main Section Component (The one you export)
const CategoryMenu = () => {
  const navigate = useNavigate();
  // Data array matching your screenshot
  const categories = [
    { id: 1, name: "Chinese", image: "🍜" },
    { id: 2, name: "Pizza", image: "🍕" },
    { id: 3, name: "Rolls", image: "🌯" },
    { id: 4, name: "Paratha", image: "🫓" },
    { id: 5, name: "Burger", image: "🍔" },
    { id: 6, name: "South Indian", image: "🍲" },
    { id: 7, name: "Pasta", image: "🍝" },
    { id: 8, name: "Sandwich", image: "🥪" },
    { id: 9, name: "Cakes", image: "🎂" },
    { id: 10, name: "Pastries", image: "🍰" },
    { id: 11, name: "Shakes", image: "🥤" },
    { id: 12, name: "Special Foods", image: "🍱" },
  ];
     
  return (
    <>
      <div className="w-full bg-white px-5 py-4">
        <div className="flex  sm:space-x-72 lg:space-x-84  space-x-40   mt-4 mb-6">
          <h2 className="font-bold text-xl font-serif">Explore Menu</h2>
          <span
            className="view-all text-orange-500 cursor-pointer"
            onClick={() =>
              navigate("/menu", { state: { selectedCategory: "All" } })
            }
          >
            View All
          </span>
        </div>
        {/* body of explore menu */}
        {/* Grid Layout: 4 columns */}
        <div className="grid grid-cols-4 gap-x-4 gap-y-8">
          {categories.map((item) => (
            <CategoryItem
              key={item.id}
              name={item.name}
              image={item.image}
              // Pass the category name in the state suitcase
              onClick={() =>
                navigate("/menu", { state: { selectedCategory: item.name } })
              }
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default CategoryMenu;
