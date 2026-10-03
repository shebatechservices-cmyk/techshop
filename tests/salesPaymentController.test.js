jest.mock('../config/db', () => {
  const { createPoolMock } = require('./mocks/poolMock');
  return createPoolMock();
});

jest.mock('../services/accountLedgerService', () => ({
  recordAccountTransaction: jest.fn().mockResolvedValue({ id: 99, balance_after: 5000 }),
}));

const pool = require('../config/db');
const salesPaymentController = require('../controllers/sales/salesPaymentController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  pool.connect.mockReset();
  pool.query.mockReset();
  pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
});

describe('salesPaymentController', () => {
  describe('collectSaleInvoicePayment', () => {
    it('successfully collects partial payment and updates sale and customer balance', async () => {
      const client = {
        query: jest.fn((text, params) => {
          if (/SELECT\s+id,\s*name.*FROM\s+payment_accounts/i.test(text)) {
            return Promise.resolve({
              rows: [{ id: 1, name: 'Cash Drawer', account_type: 'Cash', balance: 1000 }],
              rowCount: 1,
            });
          }
          if (/SELECT\s+\*\s+FROM\s+sales/i.test(text)) {
            return Promise.resolve({
              rows: [
                {
                  id: 10,
                  invoice_no: 'INV-2026-0001',
                  customer_id: 5,
                  total_amount: 1500,
                  paid_amount: 500,
                  due_amount: 1000,
                  payment_status: 'partial',
                  payment_details: [],
                },
              ],
              rowCount: 1,
            });
          }
          if (/UPDATE\s+sales/i.test(text)) {
            return Promise.resolve({
              rows: [
                {
                  id: 10,
                  invoice_no: 'INV-2026-0001',
                  paid_amount: 1000,
                  due_amount: 500,
                  payment_status: 'partial',
                },
              ],
              rowCount: 1,
            });
          }
          if (/UPDATE\s+customers/i.test(text)) {
            return Promise.resolve({
              rows: [
                {
                  id: 5,
                  name: 'Rahim Khan',
                  phone: '01700000000',
                  address: 'Dhaka',
                  receivable_balance: 500,
                },
              ],
              rowCount: 1,
            });
          }
          return Promise.resolve({ rows: [], rowCount: 0 });
        }),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(client);

      const req = {
        params: { id: '10' },
        body: {
          amount: 500,
          account_id: 1,
          note: 'Partial settlement',
        },
      };
      const res = mockRes();

      await salesPaymentController.collectSaleInvoicePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const json = res.json.mock.calls[0][0];
      expect(json.success).toBe(true);
      expect(json.data.amount_collected).toBe(500);
      expect(json.data.remaining_invoice_due).toBe(500);
      expect(json.data.payment_status).toBe('partial');
      expect(json.data.receipt_no).toMatch(/^MR-/);
      expect(client.release).toHaveBeenCalled();
    });

    it('rejects collection if invoice has zero due', async () => {
      const client = {
        query: jest.fn((text, params) => {
          if (/SELECT\s+id,\s*name.*FROM\s+payment_accounts/i.test(text)) {
            return Promise.resolve({
              rows: [{ id: 1, name: 'Cash Drawer', account_type: 'Cash' }],
              rowCount: 1,
            });
          }
          if (/SELECT\s+\*\s+FROM\s+sales/i.test(text)) {
            return Promise.resolve({
              rows: [{ id: 10, invoice_no: 'INV-PAID-01', due_amount: 0, paid_amount: 2000 }],
              rowCount: 1,
            });
          }
          return Promise.resolve({ rows: [], rowCount: 0 });
        }),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(client);

      const req = {
        params: { id: '10' },
        body: { amount: 200, account_id: 1 },
      };
      const res = mockRes();

      await salesPaymentController.collectSaleInvoicePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      const json = res.json.mock.calls[0][0];
      expect(json.success).toBe(false);
      expect(json.message).toContain('already has zero due');
    });
  });

  describe('collectCustomerBulkDuePayment', () => {
    it('allocates bulk payment across pending customer invoices using FIFO', async () => {
      const client = {
        query: jest.fn((text, params) => {
          if (/SELECT\s+id,\s*name.*FROM\s+payment_accounts/i.test(text)) {
            return Promise.resolve({
              rows: [{ id: 2, name: 'bKash Merchant', account_type: 'MFS' }],
              rowCount: 1,
            });
          }
          if (/SELECT.*FROM\s+customers\s+WHERE\s+id\s*=\s*\$1\s+FOR\s+UPDATE/i.test(text)) {
            return Promise.resolve({
              rows: [{ id: 7, name: 'Corporate Buyer', receivable_balance: 3000 }],
              rowCount: 1,
            });
          }
          if (/SELECT[\s\S]*FROM\s+sales\s+WHERE\s+customer_id/i.test(text)) {
            return Promise.resolve({
              rows: [
                {
                  id: 101,
                  invoice_no: 'INV-OLD-1',
                  due_amount: 1000,
                  paid_amount: 0,
                  payment_details: [],
                },
                {
                  id: 102,
                  invoice_no: 'INV-OLD-2',
                  due_amount: 2000,
                  paid_amount: 0,
                  payment_details: [],
                },
              ],
              rowCount: 2,
            });
          }
          if (/UPDATE\s+customers/i.test(text)) {
            return Promise.resolve({
              rows: [{ id: 7, name: 'Corporate Buyer', receivable_balance: 1500 }],
              rowCount: 1,
            });
          }
          return Promise.resolve({ rows: [], rowCount: 0 });
        }),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(client);

      const req = {
        params: { id: '7' },
        body: {
          amount: 1500, // Covers 1000 on INV-OLD-1 and 500 on INV-OLD-2
          account_id: 2,
        },
      };
      const res = mockRes();

      await salesPaymentController.collectCustomerBulkDuePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const json = res.json.mock.calls[0][0];
      expect(json.success).toBe(true);
      expect(json.data.amount_collected).toBe(1500);
      expect(json.data.settled_invoices).toHaveLength(2);
      expect(json.data.settled_invoices[0].invoice_no).toBe('INV-OLD-1');
      expect(json.data.settled_invoices[0].amount_settled).toBe(1000);
      expect(json.data.settled_invoices[0].status).toBe('paid');
      expect(json.data.settled_invoices[1].invoice_no).toBe('INV-OLD-2');
      expect(json.data.settled_invoices[1].amount_settled).toBe(500);
      expect(json.data.settled_invoices[1].status).toBe('partial');
    });
  });
});
