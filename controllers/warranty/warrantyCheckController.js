const { getExpiringWarranties } = require('./check/warrantyExpiringController');
const { checkWarranty } = require('./check/warrantyCheckHandler');

module.exports = {
    getExpiringWarranties,
    checkWarranty,
};
