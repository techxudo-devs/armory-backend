import jwt from "jsonwebtoken";
import * as userService from "../users/users.service.js";
import User from "../users/users.model.js";
import ApiError from "../../shared/errors/apiError.js";
import { sendEmail } from "../../shared/utils/email.js";

// 1. Register New User
export const registerUser = async (userData) => {
  return await userService.createUser(userData);
};

// 2. Authenticate User (Login via Email or Phone)
export const authenticateUser = async (identifier, password) => {
  if (!identifier || !password) {
    throw new ApiError(400, "Please provide email/phone and password.");
  }

  const user = await userService.findUserByEmailOrPhone(identifier);
  if (!user) {
    throw new ApiError(401, "Invalid credentials.");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials.");
  }

  if (user.isBlocked) {
    throw new ApiError(
      403,
      "Your account is suspended. Please contact support.",
    );
  }

  return user;
};

// 3. Request Password Reset Email Link
export const requestPasswordReset = async (email) => {
  if (!email) {
    throw new ApiError(400, "Email address is required.");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(404, "No user found with this email address.");
  }

  // Create temporary JWT reset token valid for 1 hour
  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  const resetLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: "🔒 Metal Tubes & Seeds - Password Reset Request",
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link is valid for 1 hour.</p>
      <p><a href="${resetLink}" style="background: #6667DD; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `,
  });

  return true;
};

// 4. Reset User Password
export const resetUserPassword = async (resetToken, newPassword) => {
  if (!resetToken || !newPassword) {
    throw new ApiError(400, "Reset token and new password are required.");
  }

  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(404, "User no longer exists.");
    }

    user.password = newPassword;
    await user.save();
    return user;
  } catch (err) {
    throw new ApiError(400, "Invalid or expired reset token.");
  }
};
