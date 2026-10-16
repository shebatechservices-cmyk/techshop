/**
 * Sales Order Query Controller
 * Modularized into:
 *  - ./query/salesListQuery: Paginated sales list retrieval
 *  - ./query/saleDetailsQuery: Sale invoice details by ID with formatted product titles and serials
 */

const { getSales } = require('./query/salesListQuery');
const { getSaleById } = require('./query/saleDetailsQuery');

module.exports = {
    getSales,
    getSaleById,
};
