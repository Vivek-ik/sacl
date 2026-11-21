import { Router } from "express";

import {
  registerOrganization,
  getPlans,
  getMySubscription,
  listOrganizations,
  updateOrganizationStatus,
  updateSubscriptionStatus,
  getSuperAdminDashboard,
  listPlatformUsers,
  updatePlatformUserStatus,
  listAllSubscriptions,
  listAdminPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from "../controllers/saasController.js";

import { protect, allowRoles } from "../middleware/auth.js";

const router = Router();

const superAdminOnly = [protect, allowRoles("super_admin")];

// Public routes
router.get("/plans", getPlans);
router.post("/organizations/register", registerOrganization);

// Organization routes
router.get(
  "/subscription",
  protect,
  allowRoles("org_admin", "admin"),
  getMySubscription,
);

// Super Admin dashboard
router.get("/admin/dashboard", ...superAdminOnly, getSuperAdminDashboard);

// Organizations
router.get("/admin/organizations", ...superAdminOnly, listOrganizations);

router.patch(
  "/admin/organizations/:id/status",
  ...superAdminOnly,
  updateOrganizationStatus,
);

// Platform users
router.get("/admin/users", ...superAdminOnly, listPlatformUsers);

router.patch(
  "/admin/users/:id/status",
  ...superAdminOnly,
  updatePlatformUserStatus,
);

// Subscriptions
router.get("/admin/subscriptions", ...superAdminOnly, listAllSubscriptions);

router.patch(
  "/admin/subscriptions/:id/status",
  ...superAdminOnly,
  updateSubscriptionStatus,
);

// Subscription plans
router.get("/admin/plans", ...superAdminOnly, listAdminPlans);

router.post("/admin/plans", ...superAdminOnly, createPlan);

router.patch("/admin/plans/:id", ...superAdminOnly, updatePlan);

router.delete("/admin/plans/:id", ...superAdminOnly, deletePlan);

export default router;
