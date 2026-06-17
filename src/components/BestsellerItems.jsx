import React from "react";
import { useCart } from "../context/CartContext";
import { useBestsellers } from "../hooks/useMenu";

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
  // Bestsellers are now real DB products (isBestseller=true), so each one has a
  // real productId — required for the server-side price check at checkout.
  const { data: products = [], isLoading } = useBestsellers();
  const { addToCart } = useCart();

  return (
    <>
      <div className="w-full max-w-full overflow-hidden px-5 py-4 mb-4 ">
        <h2 className="font-bold text-xl font-serif mb-6">Bestsellers</h2>

        {/* body of bestsellers */}

        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
          {isLoading
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="min-w-[160px] h-[210px] bg-gray-100 rounded-xl animate-pulse"
                />
              ))
            : products.map((product) => (
                <BestsellerCard
                  key={product._id}
                  item={{
                    name: product.name,
                    price: product.price,
                    icon: product.image,
                  }}
                  onAdd={() => addToCart(product)}
                />
              ))}
        </div>
      </div>
    </>
  );
};

export default Bestsellers;
