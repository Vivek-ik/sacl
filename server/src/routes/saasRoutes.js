import { Router } from "express";

import {
  registerOrganization,
  getPlans,
  getMySubscription,
  listOrganizations,
  updateOrganizationStatus,
  updateSubscriptionStatus,
} from "../controllers/saasController.js";

import { protect, allowRoles } from "../middleware/auth.js";

const router = Router();

// Public routes
router.get("/plans", getPlans);
router.post("/organizations/register", registerOrganization);

// Authenticated organization routes
router.get(
  "/subscription",
  protect,
  allowRoles("org_admin", "admin"),
  getMySubscription,
);

// Super Admin routes
router.get(
  "/admin/organizations",
  protect,
  allowRoles("super_admin"),
  listOrganizations,
);

router.patch(
  "/admin/organizations/:id/status",
  protect,
  allowRoles("super_admin"),
  updateOrganizationStatus,
);

router.patch(
  "/admin/subscriptions/:id/status",
  protect,
  allowRoles("super_admin"),
  updateSubscriptionStatus,
);

export default router;
