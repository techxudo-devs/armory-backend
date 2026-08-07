import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/utils/apiResponse.js";
import { sendTokenCookie, clearTokenCookie } from "../../shared/utils/jwt.js";
import * as authService from "./auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  sendTokenCookie(user, 201, res, "Account created successfully");
});

export const login = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;
  const identifier = email || phone || req.body.identifier;

  const user = await authService.authenticateUser(identifier, password);
  sendTokenCookie(user, 200, res, "Logged in successfully");
});

export const logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res);
  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});

export const getMe = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user retrieved"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.body.email);
  res
    .status(200)
    .json(
      new ApiResponse(200, null, "Password reset link sent to your email."),
    );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetUserPassword(token, newPassword);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Password reset successfully. You can now login.",
      ),
    );
});
