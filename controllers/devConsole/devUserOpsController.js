const devAdminCredentials = require('./user-ops/devAdminCredentialsController');
const devUserCrud = require('./user-ops/devUserCrudController');

module.exports = {
    ...devAdminCredentials,
    ...devUserCrud,
};
