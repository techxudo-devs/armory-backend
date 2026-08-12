import jwt from "jsonwebtoken";

export const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export const sendTokenCookie = (user, statusCode, res, message = "Success") => {
  const token = generateToken(user._id, user.role);
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        (parseInt(process.env.COOKIE_EXPIRES_DAYS) || 7) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };
  user.password = undefined;
  res.status(statusCode).cookie("token", token, cookieOptions).json({
    success: true,
    statusCode,
    message,
    data: {
      user,
      token,
    },
  });
};

export const clearTokenCookie = (res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
};
