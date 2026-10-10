/**
 * Project Controller Facade
 * Clean orchestrator aggregating modular sub-controllers:
 * - projectLookupController: Invoice lookup & technician lookup
 * - projectWalletController: Tech wallet summary, payout, and transaction history
 * - projectPresetController: Service presets and Job types CRUD
 * - projectOrderController: Project lifecycle, status transitions, progress, and CRUD
 */

const projectLookupController = require('./project/projectLookupController');
const projectWalletController = require('./project/projectWalletController');
const projectPresetController = require('./project/projectPresetController');
const projectOrderController = require('./project/projectOrderController');

module.exports = {
    // Lookups
    getInvoicesLookup: projectLookupController.getInvoicesLookup,
    getTechniciansLookup: projectLookupController.getTechniciansLookup,

    // Wallet Operations
    getTechWallets: projectWalletController.getTechWallets,
    payoutTechWallet: projectWalletController.payoutTechWallet,
    getTechWalletHistory: projectWalletController.getTechWalletHistory,

    // Service Presets & Job Types (Rule 1)
    getServicePresets: projectPresetController.getServicePresets,
    createServicePreset: projectPresetController.createServicePreset,
    updateServicePreset: projectPresetController.updateServicePreset,
    deleteServicePreset: projectPresetController.deleteServicePreset,
    getJobTypes: projectPresetController.getJobTypes,
    createJobType: projectPresetController.createJobType,
    updateJobType: projectPresetController.updateJobType,
    deleteJobType: projectPresetController.deleteJobType,

    // Project Orders & Lifecycle
    createProject: projectOrderController.createProject,
    getProjects: projectOrderController.getProjects,
    getProjectById: projectOrderController.getProjectById,
    updateProject: projectOrderController.updateProject,
    deleteProject: projectOrderController.deleteProject,
    technicianRespond: projectOrderController.technicianRespond,
    adminRespondRejection: projectOrderController.adminRespondRejection,
    confirmByIncharge: projectOrderController.confirmByIncharge,
    updateProgress: projectOrderController.updateProgress,
    completeProject: projectOrderController.completeProject
};
