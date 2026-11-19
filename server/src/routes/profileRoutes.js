import express from "express";

import {
  getProfile,
  updateProfile,
  updatePassword,
} from "../controllers/profileController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.patch("/profile/password", protect, updatePassword);

export default router;
