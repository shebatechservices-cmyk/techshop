/**
 * Trash Controller Facade
 * Delegates trash operations to dedicated sub-controllers:
 * - trashConfig: module definitions and resolution
 * - trashQueryController: queries, counts, and previews
 * - trashRestoreController: single and bulk restoration with stock/serial synchronization
 * - trashPurgeController: permanent deletion and empty trash
 */
const { MODULE_CONFIG, resolveModule } = require('./trash/trashConfig');
const { getAllTrash, getTrashCounts, getTrashPreview } = require('./trash/trashQueryController');
const { restoreData, restoreAll } = require('./trash/trashRestoreController');
const { permanentDelete, emptyTrash } = require('./trash/trashPurgeController');

module.exports = {
    MODULE_CONFIG,
    resolveModule,
    getAllTrash,
    getTrashCounts,
    getTrashPreview,
    restoreData,
    restoreAll,
    permanentDelete,
    emptyTrash,
};
