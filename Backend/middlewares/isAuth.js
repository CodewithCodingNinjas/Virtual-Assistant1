import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "authentication required" });
    }
    const verifyToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verifyToken.userId;
    next();
  } catch (error) {
    // jwt.verify throws on expired/invalid tokens — that is a 401, not a 500.
    return res.status(401).json({ message: "invalid or expired token" });
  }
};

export default isAuth;
