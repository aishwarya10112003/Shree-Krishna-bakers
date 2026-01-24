const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // 1. Who placed the order? (Link to User Model)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 2. What did they order? (Array of items)
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String, // Store name too, in case product is deleted later
        price: Number,
        quantity: { type: Number, required: true, min: 1 },
        image: String,
      },
    ],

    // 3. Payment Details
    totalAmount: {
      type: Number,
      required: true,
    },

    // 4. Delivery Address
    address: {
      type: String,
      required: true,
    },
    tableNo: { 
      type: String,
       default: "" },
    // 5. TRACKING STATUS (The most important part for Admin & User)
    status: {
      type: String,
      enum: [
        "Order Placed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Order Placed",
    },
  },
  { timestamps: true },
); // Automatically adds 'createdAt' (Order Time)

module.exports = mongoose.model("Order", orderSchema);
