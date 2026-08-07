import User from "./users.model.js";
import ApiError from "../../shared/errors/apiError.js";
import { getPaginatedData } from "../../shared/utils/pagination.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../shared/utils/cloudinary.js";

// Search by Email OR Phone number for flexible login
export const findUserByEmailOrPhone = async (identifier) => {
  return await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
  }).select("+password");
};

export const findUserById = async (id) => {
  return await User.findById(id).select("-password");
};

export const createUser = async (userData) => {
  const existingUser = await User.findOne({
    $or: [{ email: userData.email.toLowerCase() }, { phone: userData.phone }],
  });

  if (existingUser) {
    if (existingUser.email === userData.email.toLowerCase()) {
      throw new ApiError(400, "User with this email address already exists.");
    }
    if (existingUser.phone === userData.phone) {
      throw new ApiError(400, "User with this phone number already exists.");
    }
  }

  return await User.create({
    ...userData,
    email: userData.email.toLowerCase(),
  });
};

export const updateUserAvatar = async (userId, fileBuffer) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (user.avatarPublicId) {
    await deleteFromCloudinary(user.avatarPublicId);
  }

  const result = await uploadToCloudinary(fileBuffer, "lucky_seat_avatars");
  user.avatarUrl = result.secure_url;
  user.avatarPublicId = result.public_id;
  await user.save();

  return user;
};

export const listAllUsers = async (page, limit, search) => {
  const query = { role: "user" };
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  return await getPaginatedData({
    model: User,
    query,
    page,
    limit,
    sort: { createdAt: -1 },
    select: "-password",
  });
};

export const updateUserBlockStatus = async (userId, isBlocked) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found.");

  user.isBlocked = isBlocked;
  await user.save();
  return user;
};
