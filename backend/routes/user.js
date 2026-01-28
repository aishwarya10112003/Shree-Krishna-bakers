const { Router } = require("express");
const userRouter = Router();
const auth = require("../middleware/auth");
const {
  validateSignup,
  validateSignin,
  validateVerifyOtp,
  validatePlaceOrder,
} = require("../middleware/validate");

// Import Controllers
const { signup, signin, verifyOtp } = require("../controllers/authController");

// Import Models
const Order = require("../models/Order");
const Product = require("../models/Product");

// 🟢 Apply Validation Middleware
userRouter.post("/signup", validateSignup, signup);
userRouter.post("/signin", validateSignin, signin);
userRouter.post("/verify-otp", validateVerifyOtp, verifyOtp);

// ... (Keep the rest of your Order/Menu routes exactly as they were) ...
// Place Order Route - PROTECTED & VALIDATED
userRouter.post("/place-order", auth, validatePlaceOrder, async (req, res) => {
  try {
    const newOrder = new Order({
      userId: req.user.id,
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      address: req.body.address,
      tableNo: req.body.tableNo || "",
    });
    await newOrder.save();
    res.json({ message: "Order placed successfully!", orderId: newOrder._id });
  } catch (error) {
    console.log("❌ Order Error:", error.message);
    res.status(500).json({ error: "Could not place order" });
  }
});

// Menu Route
userRouter.get("/menu", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

// Orders Route
userRouter.get("/orders", auth, async (req, res) => {
  try {
    const myOrders = await Order.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json({ orders: myOrders });
  } catch (error) {
    res.status(500).json({ error: "Could not fetch orders" });
  }
});

module.exports = { userRouter };
