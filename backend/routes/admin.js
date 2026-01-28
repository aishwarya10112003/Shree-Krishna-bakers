const { Router } = require("express");
const adminRouter = Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const auth = require("../middleware/auth");
const {
  validateProduct,
  validateBulkProducts,
  validateOrderStatus,
} = require("../middleware/validate");

const adminCheck = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied! Admins only." });
  }
  next();
};
//get all the orders

adminRouter.get("/orders", auth, adminCheck, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("userId", "name phone email")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

adminRouter.get("/products", auth, adminCheck, async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

//change the order status - PROTECTED & VALIDATED
adminRouter.put(
  "/order-status/:orderId",
  auth,
  adminCheck,
  validateOrderStatus,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      // Validate that the status is one of our allowed steps
      const validStatuses = [
        "Order Placed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid Status Value" });
      }

      // Find order and update
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status: status },
        { new: true } // Return the updated document
      );

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json({ message: `Status updated to ${status}`, order });
    } catch (error) {
      res.status(500).json({ error: "Failed to update status" });
    }
  }
);

//add a new product - PROTECTED & VALIDATED
adminRouter.post("/add_product", auth, adminCheck, validateProduct, async (req, res) => {
  try {
    const { name, price, category, image, description } = req.body;
    const newProduct = new Product({
      name,
      price,
      category,
      image,
      description,
    });
    await newProduct.save();
    res.json({
      message: "Product added successfully!",
      product: newProduct,
    });
  } catch (error) {
    console.log(error); // This prints the detailed error in your VS Code Terminal
    res.status(500).json({
      error: "Failed to add product",
      details: error.message, // This sends the specific reason to Postman
    });
  }
});
// BULK ADD PRODUCTS (Upload the whole menu at once) - PROTECTED & VALIDATED
adminRouter.post("/add-bulk-products", auth, adminCheck, validateBulkProducts, async (req, res) => {
  try {
    // req.body should be an ARRAY of products
    const products = req.body;

    // insertMany is a special Mongoose command for arrays
    const result = await Product.insertMany(products);

    res.json({
      message: "Menu updated successfully!",
      count: result.length,
      items: result,
    });
  } catch (error) {
    console.log("Bulk Add Error:", error); // <--- LOGS ERROR TO TERMINAL
    res
      .status(500)
      .json({ error: "Failed to add products", details: error.message });
  }
});

//  REMOVE PRODUCT (Real Logic) - PROTECTED
adminRouter.delete("/remove-product/:id", auth, adminCheck, async (req, res) => {
  try {
    const productId = req.params.id; // Get ID from URL
    const product = await Product.findByIdAndDelete(productId);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

//  TOGGLE AVAILABILITY (Out of Stock / In Stock) - PROTECTED
adminRouter.put("/toggle-stock/:id", auth, adminCheck, async (req, res) => {
  try {
    const productId = req.params.id;

    // 1. Find the product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 2. Flip the switch (True becomes False, False becomes True)
    product.isAvailable = !product.isAvailable;

    // 3. Save the update
    await product.save();

    res.json({
      message: `Product is now ${
        product.isAvailable ? "Available" : "Out of Stock"
      }`,
      product,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update stock status" });
  }
});
adminRouter.get("/analytics", auth, adminCheck, async (req, res) => {
  try {
    // 1. TOTALS (Lifetime)
    const totalStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $count: {} },
        },
      },
    ]);

    // 2. TODAY'S STATS
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfDay } } },
      {
        $group: {
          _id: null,
          todayRevenue: { $sum: "$totalAmount" },
          todayOrders: { $count: {} },
        },
      },
    ]);

    // 3. CHART DATA (Last 7 Days)
    const last7Days = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          dailyRevenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 7 },
    ]);

    // 🟢 4. RECENT HISTORY (Delivered Orders Only)
    // This fetches the actual table data you asked for
    const recentHistory = await Order.find({ status: "Delivered" })
      .sort({ createdAt: -1 }) // Newest first
      .limit(50) // Limit to last 50 to keep it fast
      .populate("userId", "name email");
    console.log("---------------- ANALYTICS DEBUG ----------------");
    console.log("Searching for status: 'Delivered'");
    console.log(`Found ${recentHistory.length} delivered orders.`);
    if (recentHistory.length > 0) {
      console.log("Sample Order:", recentHistory[0]);
    }
    console.log("-------------------------------------------------");
    res.json({
      total: totalStats[0] || { totalRevenue: 0, totalOrders: 0 },
      today: todayStats[0] || { todayRevenue: 0, todayOrders: 0 },
      trend: last7Days,
      history: recentHistory, // <--- Sending this to frontend
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Analytics failed" });
  }
});

module.exports = { adminRouter };
