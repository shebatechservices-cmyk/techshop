/**
 * Project Lifecycle Controller (Aggregator)
 * Delegates workflow and settlement operations to modular sub-controllers:
 * - projectWorkflowController: Technician response, rejection handling, in-charge confirmation, progress tracking
 * - projectSettlementController: Completion financial settlement, reopen & financial rollback
 */

const projectWorkflowController = require('./lifecycle/projectWorkflowController');
const projectSettlementController = require('./lifecycle/projectSettlementController');

module.exports = {
    // Workflow & Status Lifecycle
    technicianRespond: projectWorkflowController.technicianRespond,
    adminRespondRejection: projectWorkflowController.adminRespondRejection,
    confirmByIncharge: projectWorkflowController.confirmByIncharge,
    updateProgress: projectWorkflowController.updateProgress,

    // Financial Settlement & Rollback
    completeProject: projectSettlementController.completeProject,
    reopenProject: projectSettlementController.reopenProject,
};
