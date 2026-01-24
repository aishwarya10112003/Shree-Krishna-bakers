
const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "No token, access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // This adds the user ID to the request
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};