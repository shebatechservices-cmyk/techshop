const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const { requireAuth, requireRole } = require("../middlewares/authMiddleware");

// All role endpoints require an active authenticated session
router.use(requireAuth);

router.get("/", roleController.getAllRoles);
router.get("/permissions", roleController.getAllPermissions);

// Role creation and permission matrix modification are restricted to shop admins
router.post("/", requireRole(1, 2), roleController.createRole);
router.post("/assign", requireRole(1, 2), roleController.assignPermissionsToRole);

module.exports = router;
