const pool = require('../config/db');
const {
  getCustomerSmartMetrics,
  getSupplierSmartMetrics,
  getStaffSmartMetrics,
} = require('../controllers/party/queries/partySmartAnalyticsHelper');

describe('Smart Party Profiles Analytics Suite', () => {
  afterAll(async () => {
    await pool.end();
  });
  describe('Customer Smart Metrics', () => {
    test('Calculates VIP tier for low/zero due customer with multiple invoices', async () => {
      const stats = {
        total_invoices: 4,
        lifetime_purchases: 25000,
        total_due: 0,
      };

      const result = await getCustomerSmartMetrics(999999, stats);
      expect(result).toBeDefined();
      expect(result.aov).toBe(6250);
      expect(result.trust_tier).toBe('vip');
      expect(result.trust_label).toContain('VIP');
      expect(Array.isArray(result.top_products)).toBe(true);
    });

    test('Calculates High Risk tier when total due is disproportionately high', async () => {
      const stats = {
        total_invoices: 2,
        lifetime_purchases: 10000,
        total_due: 8000,
      };

      const result = await getCustomerSmartMetrics(999999, stats);
      expect(result).toBeDefined();
      expect(result.trust_tier).toBe('high_risk');
      expect(result.trust_label).toContain('High Due');
    });

    test('Handles new customer with zero invoices cleanly', async () => {
      const stats = {
        total_invoices: 0,
        lifetime_purchases: 0,
        total_due: 0,
      };

      const result = await getCustomerSmartMetrics(999999, stats);
      expect(result).toBeDefined();
      expect(result.aov).toBe(0);
      expect(result.trust_tier).toBe('new');
    });
  });

  describe('Supplier Smart Metrics', () => {
    test('Identifies preferred vendor when PO count >= 3', async () => {
      const stats = {
        total_pos: 5,
        lifetime_orders: 85000,
        total_paid: 80000,
        total_due: 5000,
      };

      const result = await getSupplierSmartMetrics(999999, stats);
      expect(result).toBeDefined();
      expect(result.reliability_label).toContain('Preferred Vendor');
      expect(Array.isArray(result.top_products)).toBe(true);
      expect(Array.isArray(result.low_stock_reorders)).toBe(true);
    });

    test('Sets standard supplier label for new vendor', async () => {
      const stats = {
        total_pos: 1,
        lifetime_orders: 12000,
        total_paid: 12000,
        total_due: 0,
      };

      const result = await getSupplierSmartMetrics(999999, stats);
      expect(result).toBeDefined();
      expect(result.reliability_label).toBe('Standard Supplier');
    });
  });

  describe('Staff Smart Metrics', () => {
    test('Returns default monthly sales and project stats without crashing', async () => {
      const result = await getStaffSmartMetrics(999999, 'NonExistentStaff');
      expect(result).toBeDefined();
      expect(result.month_sales).toBeDefined();
      expect(result.projects).toBeDefined();
      expect(typeof result.projects.completion_rate).toBe('number');
    });
  });
});
