const generalSettings = require('./settings/generalSettingsController');
const paymentMethod = require('./settings/paymentMethodController');
const systemHealth = require('./settings/systemHealthController');
const backupRestore = require('./settings/backupRestoreController');
const smsSettings = require('./settings/smsSettingsController');

module.exports = {
    ...generalSettings,
    ...paymentMethod,
    ...systemHealth,
    ...backupRestore,
    ...smsSettings,
};