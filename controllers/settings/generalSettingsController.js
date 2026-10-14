const { ensureSettingsTables } = require('./general/settingsSchemaMigration');
const { getSettings } = require('./general/settingsQueryController');
const { updateSettings } = require('./general/settingsUpdateController');
const { updatePrintTemplate } = require('./general/settingsPrintTemplateController');
const { updateLiveOffers } = require('./general/settingsLiveOffersController');

module.exports = {
    ensureSettingsTables,
    getSettings,
    updateSettings,
    updatePrintTemplate,
    updateLiveOffers,
};
