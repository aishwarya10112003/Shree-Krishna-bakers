
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true }, // e.g., "Pizza", "Cake"
  image: { type: String, required: true }, // URL or Emoji for now
  description: { type: String },
  isAvailable: { type: Boolean, default: true },
});

module.exports = mongoose.model("Product", productSchema);