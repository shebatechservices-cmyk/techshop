/**
 * Live notification feed query facade for technicians and global staff.
 */

const { fetchTechnicianNotifications } = require('./notifications/technicianNotificationsHelper');
const { fetchGlobalCoreAlerts } = require('./notifications/globalCoreAlertsHelper');
const { fetchGlobalActivityAlerts } = require('./notifications/globalActivityAlertsHelper');

async function fetchGlobalNotifications(pool) {
    const [coreAlerts, activityAlerts] = await Promise.all([
        fetchGlobalCoreAlerts(pool),
        fetchGlobalActivityAlerts(pool)
    ]);
    return [...coreAlerts, ...activityAlerts];
}

module.exports = {
    fetchTechnicianNotifications,
    fetchGlobalNotifications,
};
