/**
 * Staff Controller (Unified Facade)
 * Architectural Decomposition: SRP & Sub-Controllers
 * 
 * Sub-modules:
 * - ./staff/staffQueryController: Staff list, role definitions, staff lookup
 * - ./staff/staffLifecycleController: Create, update, toggle status, soft delete
 * - ./staff/staffWalletController: Technician & staff wallet stats, balance adjustments
 */

const staffQuery = require('./staff/staffQueryController');
const staffLifecycle = require('./staff/staffLifecycleController');
const staffWallet = require('./staff/staffWalletController');

module.exports = {
    ...staffQuery,
    ...staffLifecycle,
    ...staffWallet
};
