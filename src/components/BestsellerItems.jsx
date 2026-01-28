import React from "react";
import { useCart } from "../context/CartContext";

const BestsellerCard = ({ item, onAdd }) => {
  const { name, price, icon } = item;

  return (
    <div className="flex flex-col justify-center items-center bg-white min-w-[160px] rounded-xl border border-gray-100 p-3 shadow-sm">
      {/*  icon container */}
      <div className="rounded-xl w-full aspect-square bg-gray-50 flex items-center justify-center mb-3">
        <span className="text-4xl">{icon}</span>
      </div>
      <span className="text-gray-800 font-bold text-sm leading-tight h-10 line-clamp-2">
        {name}
      </span>

      <div className="w-full flex items-center justify-between mt-auto px-1">
        <span className="text-orange-600 font-extrabold text-lg">
          {" "}
          ₹ {price}
        </span>
        <button
          onClick={onAdd}
          className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full font-bold text-xl hover:bg-orange-600 hover:text-white transition-colors duration-200 active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  );
};

const Bestsellers = () => {
  const items = [
    // These are \"virtual\" products that mirror your menu items.
    // They use `id` so CartContext can treat them like real products.
    { id: "bestseller-1", name: "Paneer Blast Pizza", price: 260, icon: "🍕" },
    { id: "bestseller-2", name: "Choco Brownie...", price: 450, icon: "🎂" },
    { id: "bestseller-3", name: "Cheese Sandwich", price: 70, icon: "🥪" },
    { id: "bestseller-4", name: "Cheese Burger", price: 260, icon: "🍔" },
    { id: "bestseller-5", name: "Chowmein", price: 120, icon: "🍜" },
    { id: "bestseller-6", name: "Veg Patties", price: 50, icon: "🥟" },
  ];

  const { addToCart } = useCart();

  // Normalize a bestseller item into a cart-compatible product object
  const handleAdd = (item) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.icon,
      category: "Bestseller",
    });
  };

  return (
    <>
      <div className="w-full max-w-full overflow-hidden px-5 py-4 mb-4 ">
        <h2 className="font-bold text-xl font-serif mb-6">Bestsellers</h2>

        {/* body of bestsellers */}

        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
          {items.map((item) => (
            <BestsellerCard
              key={item.id}
              item={item}
              onAdd={() => handleAdd(item)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Bestsellers;
