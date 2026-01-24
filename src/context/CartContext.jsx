import React, { createContext, useState, useContext, useEffect } from "react";

// 1. Create the Context (The Butler)
const CartContext = createContext();

// 2. The Provider (The Butler's Office)
// This wraps your whole app so everyone can talk to the Butler.
export const CartProvider = ({ children }) => {
  // --- A. THE NOTEPAD (State) ---
  // We check LocalStorage first so data survives a refresh (The "Pocket")
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cartItems");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // --- B. THE MEMORY (Persistence) ---
  // Whenever the notepad changes, save a copy to LocalStorage
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // --- C. ACTION: ADD TO CART ---
  const addToCart = (product) => {
    setCartItems((currentItems) => {
      // 1. Normalize ID: MongoDB uses '_id', Frontend uses 'id'.
      // We accept either, but we save it as 'id' to keep things consistent.
      const productId = product._id || product.id;

      // 2. Check: Is this item already on the list?
      const existingItem = currentItems.find((item) => item.id === productId);

      if (existingItem) {
        // SCENARIO: Item exists -> Increase Quantity
        return currentItems.map(
          (item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity + 1 } // Copy item, update qty
              : item // Leave other items alone
        );
      } else {
        // SCENARIO: New Item -> Add to list with Qty 1
        // We ensure the saved item definitely has an 'id' property
        return [...currentItems, { ...product, id: productId, quantity: 1 }];
      }
    });
  };

  // --- D. ACTION: REMOVE FROM CART ---
  const removeFromCart = (productId) => {
    setCartItems((currentItems) => {
      // 1. Find the item
      const existingItem = currentItems.find((item) => item.id === productId);

      if (existingItem?.quantity === 1) {
        // SCENARIO: Qty is 1 -> Remove completely
        return currentItems.filter((item) => item.id !== productId);
      } else {
        // SCENARIO: Qty > 1 -> Decrease Quantity
        return currentItems.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
    });
  };

  // --- E. HELPER: CALCULATE TOTAL ---
  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  // --- F. HELPER: CLEAR CART ---
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cartItems");
  };

  // --- RETURN THE TOOLS ---
  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        getCartTotal,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// 3. The Hook (The Phone Line)
// Any component calls useCart() to talk to the Butler
export const useCart = () => useContext(CartContext);
