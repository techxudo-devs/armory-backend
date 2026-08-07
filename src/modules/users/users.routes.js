import express from "express";
import {
  getProfile,
  updateAvatar,
  getUsersList,
  toggleBlockUser,
} from "./users.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { uploadImage } from "../../middlewares/upload.middleware.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

router.use(protect);
router.get("/me", getProfile);
router.patch("/avatar", uploadImage.single("avatar"), updateAvatar);

// Admin user management routes
router.get("/", authorize(ROLES.ADMIN), getUsersList);
router.patch("/:userId/status", authorize(ROLES.ADMIN), toggleBlockUser);

export default router;
