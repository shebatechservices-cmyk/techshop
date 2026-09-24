const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");

router.get("/", roleController.getAllRoles);
router.post("/", roleController.createRole);
router.get("/permissions", roleController.getAllPermissions);
router.post("/assign", roleController.assignPermissionsToRole);

module.exports = router;