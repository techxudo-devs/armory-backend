import jwt from "jsonwebtoken";
import User from "../modules/users/users.model.js";
import asyncHandler from "../shared/utils/asyncHandler.js";

export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token;

  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (user && !user.isBlocked) {
        req.user = user;
      }
    } catch {
      // Invalid or expired token: treat request as anonymous
    }
  }

  next();
});
