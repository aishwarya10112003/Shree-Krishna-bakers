require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { userRouter } = require("./routes/user");
const { adminRouter } = require("./routes/admin");


const cors = require("cors");
const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://10.68.120.114:3000"],// Allow your React Frontend
    credentials: true, // Allow cookies/tokens if needed
  })
);
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Shree Krishna Bakers API is running...");
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/admin", adminRouter);



// Database Connection
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.log("❌ Database Connection Error:", err));
