// Tests for Technician Lookup, Strict Entity Separation, Customer Auto-fill, Dynamic Services, and Project Edit Workflow
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

describe('Technician Workflow, Dynamic Services & Work Order Editing', () => {
    let mockUsers = [];
    let mockCustomers = [];
    let mockRoles = [];
    let mockProjects = [];
    let mockProjectServices = [];

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
                id: 12,
                name: 'Faruk Tech (Networking)',
                phone: '01755555555',
                email: 'faruk@sheba.com',
                role: 'TECHNICIAN',
                role_id: 4,
                role_name: 'Field Technician',
                designation: 'Network & WiFi Engineer',
                wallet_balance: 500,
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

        mockProjects = [
            {
                id: 501,
                project_code: 'PRJ-100501',
                title: 'Existing Test Project',
                project_type: 'CCTV Installation',
                customer_id: 100,
                technician_id: 10,
                technician_status: 'assigned',
                status: 'assigned',
                setup_charge: 1000,
                setup_fee: 1000,
                conveyance_cost: 300,
                conveyance: 300,
                meal_allowance: 200,
                customer_billing_amount: 2500,
                charges: 1500,
                site_phone: '+8801844444444',
                site_address: 'Dhanmondi 27, Dhaka',
                admin_confirmed: false,
                deleted_at: null
            },
            {
                id: 502,
                project_code: 'PRJ-100502',
                title: 'Completed Project Lock Test',
                project_type: 'CCTV Installation',
                customer_id: 100,
                technician_id: 10,
                technician_status: 'completed',
                status: 'completed',
                setup_charge: 1000,
                setup_fee: 1000,
                conveyance_cost: 300,
                conveyance: 300,
                meal_allowance: 200,
                customer_billing_amount: 2500,
                charges: 1500,
                deleted_at: null
            }
        ];

        mockProjectServices = [
            {
                id: 1,
                project_id: 501,
                service_name: 'CCTV Camera Setup',
                quantity: 2,
                unit_rate: 500,
                line_total: 1000,
                notes: null
            }
        ];

        const queryHandler = async (sql, params = []) => {
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

            // Select project for update or single get
            if (queryStr.includes('SELECT * FROM service_projects WHERE id = $1')) {
                const p = mockProjects.find(x => x.id === Number(params[0]) && !x.deleted_at);
                return { rows: p ? [p] : [], rowCount: p ? 1 : 0 };
            }

            // Insert into project_services
            if (queryStr.includes('INSERT INTO project_services')) {
                const newService = {
                    id: mockProjectServices.length + 1,
                    project_id: params[0],
                    service_name: params[1],
                    quantity: params[2],
                    unit_rate: params[3],
                    line_total: params[4],
                    notes: params[5]
                };
                mockProjectServices.push(newService);
                return { rows: [newService], rowCount: 1 };
            }

            // Delete from project_services
            if (queryStr.includes('DELETE FROM project_services WHERE project_id = $1')) {
                mockProjectServices = mockProjectServices.filter(s => s.project_id !== Number(params[0]));
                return { rows: [], rowCount: 0 };
            }

            // Select services for project
            if (queryStr.includes('SELECT * FROM project_services WHERE project_id = $1')) {
                const s = mockProjectServices.filter(x => x.project_id === Number(params[0]));
                return { rows: s, rowCount: s.length };
            }

            // Update Project
            if (queryStr.includes('UPDATE service_projects')) {
                const projId = Number(params[19]);
                const existing = mockProjects.find(x => x.id === projId);
                if (existing) {
                    if (params[0]) existing.title = params[0];
                    if (params[1]) existing.project_type = params[1];
                    existing.technician_id = params[2];
                    if (params[3]) existing.site_phone = params[3];
                    if (params[4]) existing.site_address = params[4];
                    existing.device_qty = params[5];
                    existing.per_unit_rate = params[6];
                    existing.setup_charge = params[7];
                    existing.setup_fee = params[7];
                    existing.conveyance_cost = params[8];
                    existing.conveyance = params[8];
                    existing.meal_allowance = params[9];
                    existing.customer_billing_amount = params[10];
                    existing.charges = params[11];
                    existing.technician_status = params[12];
                    existing.status = params[13];
                    existing.admin_confirmed = params[14];
                    return { rows: [existing], rowCount: 1 };
                }
            }

            // Create Project
            if (queryStr.includes('INSERT INTO service_projects')) {
                const newProj = {
                    id: 500 + mockProjects.length + 1,
                    project_code: params[0],
                    title: params[1],
                    project_type: params[2],
                    customer_id: params[3],
                    technician_id: params[4],
                    charges: params[5],
                    description: params[6],
                    status: params[7],
                    invoice_id: params[8],
                    invoice_no: params[9],
                    device_qty: params[10],
                    per_unit_rate: params[11],
                    setup_charge: params[12],
                    setup_fee: params[13],
                    conveyance_cost: params[14],
                    conveyance: params[15],
                    meal_allowance: params[16],
                    customer_billing_amount: params[17]
                };
                mockProjects.push(newProj);
                return { rows: [newProj], rowCount: 1 };
            }

            return { rows: [], rowCount: 0 };
        };

        pool.query.mockImplementation(queryHandler);
        pool.connect.mockImplementation(async () => ({
            query: queryHandler,
            release: jest.fn()
        }));
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
    });

    test('RULE 2 & 3: Auto-filling customer and creating Technician creates distinct users record while keeping customer database intact', async () => {
        const custReq = { query: { phone: '01844444444' } };
        const custRes = mockRes();
        await salesCustomerController.getCustomers(custReq, custRes);
        const cust = custRes.json.mock.calls[0][0].data[0];

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

        expect(mockCustomers.length).toBe(1);
        const newStaffInDb = mockUsers.find(u => u.phone === cust.phone);
        expect(newStaffInDb).toBeDefined();
        expect(newStaffInDb.role).toBe('TECHNICIAN');
    });

    test('RULE 1 & 2: getTechniciansLookup returns only active staff with technician role and excludes customers/inactives', async () => {
        const req = {};
        const res = mockRes();

        await projectController.getTechniciansLookup(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data.success).toBe(true);
        expect(data.data.length).toBe(2); // Sohel Tech & Faruk Tech
        expect(data.data.some(t => t.id === 10)).toBe(true);
        expect(data.data.some(t => t.id === 12)).toBe(true);
        expect(data.data.some(t => t.id === 11)).toBe(false); // inactive
        expect(data.data.some(t => t.id === 100)).toBe(false); // customer
    });

    test('RULE 1 & 2 (Dynamic Service Rows): createProject creates project and inserts multiple dynamic service tasks', async () => {
        const req = {
            body: {
                title: 'Uttara Office - Multi-Service Work Order',
                project_type: 'Multi-Task Service',
                customer_id: 100,
                technician_id: 10,
                services: [
                    { service_name: 'CCTV Camera Setup', quantity: 4, unit_rate: 350, line_total: 1400 },
                    { service_name: 'Router Setup & Configuration', quantity: 1, unit_rate: 300, line_total: 300 },
                    { service_name: 'ONU Setup & Fiber Splicing', quantity: 1, unit_rate: 250, line_total: 250 }
                ],
                conveyance: 300,
                meal_allowance: 200,
                customer_billing_amount: 3500,
                site_address: 'Uttara Sector 3, Dhaka',
                site_phone: '+8801722222222'
            }
        };
        const res = mockRes();

        await projectController.createProject(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        const data = res.json.mock.calls[0][0];
        expect(data.success).toBe(true);
        expect(data.data.setup_fee).toBe(1950); // 1400 + 300 + 250
        expect(data.data.charges).toBe(2450); // 1950 + 300 + 200
        expect(data.data.services.length).toBe(3);
        expect(data.data.services[0].service_name).toBe('CCTV Camera Setup');
        expect(data.data.services[1].service_name).toBe('Router Setup & Configuration');
    });

    test('RULE 3 (Edit Work Order): updateProject allows reassigning technician and updating dynamic service tasks', async () => {
        const req = {
            params: { id: 501 },
            body: {
                title: 'Existing Test Project (Updated with Extra TV Setup)',
                technician_id: 12, // Reassign to Faruk Tech
                services: [
                    { service_name: 'CCTV Camera Setup', quantity: 2, unit_rate: 500, line_total: 1000 },
                    { service_name: 'TV / Display Mounting', quantity: 1, unit_rate: 600, line_total: 600 }
                ],
                conveyance: 400,
                meal_allowance: 250,
                customer_billing_amount: 3200
            }
        };
        const res = mockRes();

        await projectController.updateProject(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        expect(data.success).toBe(true);
        expect(data.data.technician_id).toBe(12);
        expect(data.data.setup_fee).toBe(1600); // 1000 + 600
        expect(data.data.conveyance).toBe(400);
        expect(data.data.meal_allowance).toBe(250);
        expect(data.data.charges).toBe(2250); // 1600 + 400 + 250
        expect(data.data.services.length).toBe(2);
    });

    test('RULE 3 (Locking on Completion): updateProject rejects editing if project is already completed', async () => {
        const req = {
            params: { id: 502 }, // Completed project
            body: {
                title: 'Attempted Edit on Completed Work Order',
                technician_id: 12
            }
        };
        const res = mockRes();

        await projectController.updateProject(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        const data = res.json.mock.calls[0][0];
        expect(data.success).toBe(false);
        expect(data.message).toContain('সম্পন্ন কাজের ওয়ার্ক অর্ডার পরিবর্তন করা যাবে না');
    });
});
