/**
 * Backup & Restore Controller (Unified Facade)
 * Architectural Decomposition: SRP & Sub-Controllers
 * 
 * Sub-modules:
 * - ./backup/backupCoreController: PostgreSQL dumps, restores, log tracking, uploads, exports
 * - ./backup/demoDataController: Safe database reset, dummy cleanup, golden seed restore
 */

const backupCore = require('./backup/backupCoreController');
const demoData = require('./backup/demoDataController');

module.exports = {
    ...backupCore,
    ...demoData
};
