/**
 * Barcode and Serial Lookup Query Helpers:
 * Modularized submodules adhering to Strict Rule-1 (<= 200 lines per file):
 * 1. findSoldSerial: Lookup sold unit by serial code
 * 2. findInventorySerial: Lookup unsold/in-stock unit in purchase orders
 * 3. findProductBarcode: Lookup product model by barcode or SKU
 */

const { findSoldSerial } = require('./barcode/findSoldSerial');
const { findInventorySerial } = require('./barcode/findInventorySerial');
const { findProductBarcode } = require('./barcode/findProductBarcode');

module.exports = {
    findSoldSerial,
    findInventorySerial,
    findProductBarcode,
};
