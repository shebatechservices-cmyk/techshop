// Tests for Technician Lookup, Strict Entity Separation, Customer Auto-fill and Project Assignment Workflow
jest.mock('../config/db', () => {
    const { createPoolMock } = require('./mocks/poolMock');
    return createPoolMock();
});

const pool = require('../config/db');
const projectController = require('../controllers/projectController');
const staffController = require('../controllers/staffController');
const salesCustomerController = require('../controllers/sales/salesCustomerController');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Technician Workflow & Strict Entity Separation', () => {
    let mockUsers = [];
    let mockCustomers = [];
    let mockRoles = [];
    let mockProjects = [];

    beforeEach(() => {
        mockRoles = [
            { id: 1, name: 'Admin', permissions: [] },
            { id: 2, name: 'Manager', permissions: [] },
            { id: 3, name: 'Staff', permissions: [] },
            { id: 4, name: 'Field Technician', permissions: [] }
        ];

        mockUsers = [
            {
                id: 1,
                name: 'Admin User',
                phone: '01711111111',
                email: 'admin@sheba.com',
                role: 'ADMIN',
                role_id: 1,
                role_name: 'Admin',
                designation: 'Managing Director',
                wallet_balance: 0,
                is_active: true,
                is_locked: false,
                deleted_at: null
            },
            {
                id: 10,
                name: 'Sohel Tech',
                phone: '01722222222',
                email: 'sohel@sheba.com',
                role: 'TECHNICIAN',
                role_id: 4,
                role_name: 'Field Technician',
                designation: 'CCTV Specialist',
                wallet_balance: 1500,
                is_active: true,
                is_locked: false,
                deleted_at: null
            },
            {
                id: 11,
                name: 'Rahim Tech (Inactive)',
                phone: '01733333333',
                email: 'rahim@sheba.com',
                role: 'TECHNICIAN',
                role_id: 4,
                role_name: 'Field Technician',
                designation: 'Field Technician',
                wallet_balance: 0,
                is_active: false,
                is_locked: false,
                deleted_at: null
            }
        ];

        mockCustomers = [
            {
                id: 100,
                name: 'Mr. Customer (Not Staff)',
                phone: '01844444444',
                email: 'client@example.com',
                address: 'Dhanmondi 27, Dhaka',
                customer_type: 'retail',
                user_role: 'regular',
                deleted_at: null
            }
        ];

        pool.query.mockImplementation(async (sql, params = []) => {
            const queryStr = typeof sql === 'string' ? sql : sql.text;

            // Technicians lookup
            if (queryStr.includes('FROM users u') && queryStr.includes('r.id = u.role_id') && queryStr.includes('TECHNICIAN')) {
                const activeTechs = mockUsers.filter(u => 
                    !u.deleted_at && 
                    u.is_active && 
                    !u.is_locked && 
                    (u.role === 'TECHNICIAN' || u.role_id === 4 || (u.designation && u.designation.toLowerCase().includes('tech')))
                ).map(u => ({
                    id: u.id,
                    name: u.name,
                    phone: u.phone || '',
                    contact: u.phone || u.email || '',
                    email: u.email,
                    role_title: u.role_name || u.designation || 'Technician',
                    designation: u.designation || 'Field Technician',
                    wallet_balance: u.wallet_balance || 0
                }));
                return { rows: activeTechs, rowCount: activeTechs.length };
            }

            // Customers search lookup
            if (queryStr.includes('FROM customers c')) {
                let filtered = mockCustomers.filter(c => !c.deleted_at);
                if (params.length > 0) {
                    const searchVal = params[0].replace(/%/g, '').toLowerCase();
                    filtered = filtered.filter(c => 
                        (c.phone && c.phone.toLowerCase().includes(searchVal)) ||
                        (c.name && c.name.toLowerCase().includes(searchVal))
                    );
                }
                return { rows: filtered, rowCount: filtered.length };
            }

            // Roles query
            if (queryStr.includes('SELECT name FROM roles WHERE id = $1')) {
                const r = mockRoles.find(x => x.id === Number(params[0]));
                return { rows: r ? [r] : [], rowCount: r ? 1 : 0 };
            }

            // Check duplicate phone in staff create
            if (queryStr.includes('SELECT id FROM users WHERE phone = $1')) {
                const existing = mockUsers.filter(u => u.phone === params[0] && !u.deleted_at);
                return { rows: existing, rowCount: existing.length };
            }

            // Create Staff user
            if (queryStr.includes('INSERT INTO users')) {
                const newUser = {
                    id: mockUsers.length + 100,
                    name: params[0],
                    phone: params[1],
                    email: params[2],
                    role: params[4],
                    role_id: params[5],
                    role_name: 'Field Technician',
                    designation: params[7],
                    salary: params[8] || 0,
                    wallet_balance: params[9] || 0,
                    address: params[10] || '',
                    is_active: true,
                    created_at: new Date()
                };
                mockUsers.push(newUser);
                return { rows: [newUser], rowCount: 1 };
            }

            // Create Project
            if (queryStr.includes('INSERT INTO service_projects')) {
                const newProj = {
                    id: 501,
                    project_code: params[0],
                    title: params[1],
                    project_type: params[2],
                    customer_id: params[3],
                    technician_id: params[4],
                    status: params[7]
                };
                mockProjects.push(newProj);
                return { rows: [newProj], rowCount: 1 };
            }

            return { rows: [], rowCount: 0 };
        });
    });

    test('RULE 1: getCustomers supports phone searching for Customer Lookup', async () => {
        const req = { query: { phone: '018444' } };
        const res = mockRes();

        await salesCustomerController.getCustomers(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data.success).toBe(true);
        expect(data.data.length).toBe(1);
        expect(data.data[0].name).toBe('Mr. Customer (Not Staff)');
        expect(data.data[0].phone).toBe('01844444444');
        expect(data.data[0].address).toBe('Dhanmondi 27, Dhaka');
    });

    test('RULE 2 & 3: Auto-filling customer and creating Technician creates distinct users record while keeping customer database intact', async () => {
        // Look up customer
        const custReq = { query: { phone: '01844444444' } };
        const custRes = mockRes();
        await salesCustomerController.getCustomers(custReq, custRes);
        const cust = custRes.json.mock.calls[0][0].data[0];

        // Simulate auto-filled payload submission
        const staffReq = {
            body: {
                name: cust.name,
                phone: cust.phone,
                email: cust.email,
                address: cust.address,
                password: 'defaultPassword123',
                role: 'TECHNICIAN',
                role_id: 4,
                designation: 'Field Technician'
            }
        };
        const staffRes = mockRes();
        await staffController.createStaff(staffReq, staffRes);

        expect(staffRes.status).toHaveBeenCalledWith(201);
        const createdStaff = staffRes.json.mock.calls[0][0].data;
        expect(createdStaff.name).toBe(cust.name);
        expect(createdStaff.role).toBe('TECHNICIAN');
        expect(createdStaff.role_id).toBe(4);

        // Verify Customer record still exists untouched in customers table
        expect(mockCustomers.length).toBe(1);
        expect(mockCustomers[0].id).toBe(100);
        expect(mockCustomers[0].customer_type).toBe('retail');

        // Verify users table has gained a distinct record
        const newStaffInDb = mockUsers.find(u => u.phone === cust.phone);
        expect(newStaffInDb).toBeDefined();
        expect(newStaffInDb.role).toBe('TECHNICIAN');
        expect(newStaffInDb.address).toBe('Dhanmondi 27, Dhaka');
    });

    test('RULE 1 & 2: getTechniciansLookup returns only active staff with technician role and excludes customers/inactives', async () => {
        const req = {};
        const res = mockRes();

        await projectController.getTechniciansLookup(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);

        // Should return Sohel Tech (active, role_id 4)
        expect(data.data.length).toBe(1);
        expect(data.data[0].id).toBe(10);
        expect(data.data[0].name).toBe('Sohel Tech');

        // Verify inactive user (id 11) is excluded
        const hasInactive = data.data.some(u => u.id === 11);
        expect(hasInactive).toBe(false);

        // Verify customer (id 100) is never in staff technician lookup
        const hasCustomer = data.data.some(u => u.id === 100);
        expect(hasCustomer).toBe(false);
    });
});
