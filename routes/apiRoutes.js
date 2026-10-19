const createEntityRouter = require('./entityRouteFactory');

function registerApiRoutes(app) {
    const registerRoute = (basePath, router) => {
        app.use(`/api${basePath}`, router);
    };

    registerRoute('/license', require('./licenseRoute'));
    registerRoute('/suppliers', require('./supplierRoute'));
    registerRoute('/products', require('./productRoute'));
    registerRoute('/categories', require('./categoryRoute'));
    registerRoute('/master', require('./masterRoute'));
    registerRoute('/purchase', require('./purchaseRoute'));
    registerRoute('/purchases', require('./purchaseRoute'));
    registerRoute('/menu', require('./menuRoute'));
    registerRoute('/images', require('./imageRoute'));
    registerRoute('/sales', require('./salesRoute'));
    registerRoute('/invoices', require('./invoiceRoute'));
    registerRoute('/accounts', require('./accountRoute'));
    registerRoute('/projects', require('./projectRoute'));
    registerRoute('/ecommerce', require('./ecommerceRoute'));
    registerRoute('/security', require('./securityRoute'));
    registerRoute('/roles', require('./roleRoute'));
    registerRoute('/search', require('./searchRoute'));
    registerRoute('/warranty', require('./warrantyRoute'));
    registerRoute('/trash', require('./trashRoute'));
    registerRoute('/settings', require('./settingsRoute'));
    registerRoute('/warehouses', require('./warehouseRoute'));
    registerRoute('/inventory', require('./inventoryRoute'));
    registerRoute('/parties', require('./partyRoute'));
    registerRoute('/wallets', require('./walletRoute'));
    registerRoute('/reports', require('./reportsRoute'));
    registerRoute('/expenses', require('./expenseRoute'));
    registerRoute('/expense-categories', require('./expenseCategoryRoute'));
    registerRoute('/register', require('./registerRoute'));
    registerRoute('/devices', require('./deviceRoute'));
    registerRoute('/staff', require('./staffRoute'));
    registerRoute('/dev', require('./devRoute'));
    registerRoute('/uom', require('./uomRoute'));
    registerRoute('/units-of-measurement', require('./uomRoute'));

    registerRoute('/brands', createEntityRouter('brands'));
    registerRoute('/models', createEntityRouter('models'));
    registerRoute('/series', createEntityRouter('series'));
    registerRoute('/product-names', createEntityRouter('product_names'));
    registerRoute('/product_names', createEntityRouter('product_names'));
    registerRoute('/sub-categories', createEntityRouter('sub_categories'));
    registerRoute('/sub_categories', createEntityRouter('sub_categories'));
}

module.exports = { registerApiRoutes };
