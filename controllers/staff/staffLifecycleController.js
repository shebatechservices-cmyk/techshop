const { normalizeRole } = require('./lifecycle/staffRoleHelper');
const { createStaff } = require('./lifecycle/staffCreateController');
const { updateStaff } = require('./lifecycle/staffUpdateController');
const { toggleStaffStatus, deleteStaff } = require('./lifecycle/staffStatusDeleteController');

module.exports = {
    normalizeRole,
    createStaff,
    updateStaff,
    toggleStaffStatus,
    deleteStaff,
};
