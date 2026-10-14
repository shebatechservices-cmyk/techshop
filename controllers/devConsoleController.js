/**
 * Developer Console Controller (Aggregator)
 * Modularized into:
 *  - ./devConsole/systemInfoController
 *  - ./devConsole/tableOpsController
 *  - ./devConsole/devUserOpsController
 */

const systemInfoController = require('./devConsole/systemInfoController');
const tableOpsController = require('./devConsole/tableOpsController');
const devUserOpsController = require('./devConsole/devUserOpsController');

module.exports = {
    ...systemInfoController,
    ...tableOpsController,
    ...devUserOpsController
};
