import jwt from "jsonwebtoken";
import User from "../modules/users/users.model.js";
import ApiError from "../shared/errors/apiError.js";
import asyncHandler from "../shared/utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token;

  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Authentication required. Please log in.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw new ApiError(401, "User belonging to this token no longer exists.");
    }

    if (user.isBlocked) {
      throw new ApiError(403, "Your account has been suspended.");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid or expired authentication token.");
  }
});
