import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/utils/apiResponse.js";
import * as userService from "./users.service.js";

export const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.findUserById(req.user._id);
  res.status(200).json(new ApiResponse(200, user, "Profile details retrieved"));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Please upload an image file."));
  }
  const updatedUser = await userService.updateUserAvatar(
    req.user._id,
    req.file.buffer,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Profile image updated successfully"),
    );
});

export const getUsersList = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const result = await userService.listAllUsers(page, limit, search);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result.docs,
        "Users list retrieved",
        result.pagination,
      ),
    );
});

export const toggleBlockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { isBlocked } = req.body;
  const updatedUser = await userService.updateUserBlockStatus(
    userId,
    isBlocked,
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser,
        `User status updated to ${isBlocked ? "blocked" : "active"}`,
      ),
    );
});
