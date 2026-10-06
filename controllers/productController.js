/**
 * Product Controller Orchestrator
 * Re-exports modular controller actions for product CRUD, bundle kits, and catalog queries.
 */
const { createProduct } = require('./product/productCreateController');
const { updateProduct } = require('./product/productUpdateController');
const { getAllProducts } = require('./product/productQueryController');
const {
  ensureProductColumns,
  parseBool,
  formatProductResponse,
} = require('./product/productHelpers');

module.exports = {
  createProduct,
  updateProduct,
  getAllProducts,
  ensureProductColumns,
  parseBool,
  formatProductResponse,
};
