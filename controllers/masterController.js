/**
 * Master Controller Facade
 * Clean orchestrator aggregating modular sub-controllers:
 * - masterHelpers: Schema synchronization, type parsing, product formatters, and trash helpers
 * - masterReadController: Entity listing with hierarchical filtering (categories, brands, models, series, products, etc.)
 * - masterCreateController: Entity creation with duplicate validation and bundle item links
 * - masterUpdateController: Entity updates, column mapping, and name propagation
 * - masterDeleteController: Entity deletion with foreign key guards, stock checks, and trash recording
 */

const { getAll } = require('./master/masterReadController');
const { create } = require('./master/masterCreateController');
const { update } = require('./master/masterUpdateController');
const { remove } = require('./master/masterDeleteController');
const masterHelpers = require('./master/masterHelpers');

module.exports = {
    getAll,
    create,
    update,
    remove,
    ...masterHelpers
};
