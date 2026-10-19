/**
 * SMS Settings Controller Facade
 * Aggregates modular sub-controllers:
 * - smsProviderCrudController: Providers listing, creation, and updating
 * - smsProviderOpsController: Provider deletion and active gateway toggling
 * - smsTriggersController: Trigger configurations, templates, and event logs
 * - smsMessagingController: Balance checks, bulk broadcast, automated dispatch, and test SMS
 */

const smsProviderCrudController = require('./sms/smsProviderCrudController');
const smsProviderOpsController = require('./sms/smsProviderOpsController');
const smsTriggersController = require('./sms/smsTriggersController');
const smsMessagingController = require('./sms/smsMessagingController');

module.exports = {
    // Provider CRUD & Gateway Configuration
    getSmsProviders: smsProviderCrudController.getSmsProviders,
    createSmsProvider: smsProviderCrudController.createSmsProvider,
    updateSmsProvider: smsProviderCrudController.updateSmsProvider,
    deleteSmsProvider: smsProviderOpsController.deleteSmsProvider,
    setActiveSmsProvider: smsProviderOpsController.setActiveSmsProvider,

    // Triggers & Event Logs
    getSmsTriggers: smsTriggersController.getSmsTriggers,
    updateSmsTriggers: smsTriggersController.updateSmsTriggers,
    getSmsLogs: smsTriggersController.getSmsLogs,

    // Messaging, Balance & Broadcasts
    getSmsBalance: smsMessagingController.getSmsBalance,
    sendBulkSms: smsMessagingController.sendBulkSms,
    sendAutomatedSms: smsMessagingController.sendAutomatedSms,
    sendTestSms: smsMessagingController.sendTestSms
};
