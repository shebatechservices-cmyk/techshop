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
    let mockServicePresets = [];
    let mockJobTypes = [];

    beforeEach(() => {
        mockServicePresets = [
            { id: 1, name: 'CCTV Camera Setup', default_rate: 350, is_active: true, created_at: new Date(), updated_at: new Date() },
            { id: 2, name: 'Router Configuration', default_rate: 300, is_active: true, created_at: new Date(), updated_at: new Date() },
            { id: 3, name: 'Legacy Inactive Service', default_rate: 200, is_active: false, created_at: new Date(), updated_at: new Date() }
        ];

        mockJobTypes = [
            { id: 1, name: 'CCTV Installation', description: 'New camera setup', is_active: true, created_at: new Date(), updated_at: new Date() },
            { id: 2, name: 'Repair & Servicing', description: 'Troubleshooting', is_active: true, created_at: new Date(), updated_at: new Date() },
            { id: 3, name: 'Legacy Inactive Type', description: 'Old archived type', is_active: false, created_at: new Date(), updated_at: new Date() }
        ];

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
                if (queryStr.includes("technician_status = 'rejection_requested'")) {
                    const projId = Number(params[1]);
                    const existing = mockProjects.find(x => x.id === projId);
                    if (existing) {
                        existing.technician_status = 'rejection_requested';
                        existing.status = 'rejection_requested';
                        existing.progress_note = params[0];
                        return { rows: [existing], rowCount: 1 };
                    }
                }
                if (queryStr.includes("technician_status = 'accepted'")) {
                    const projId = Number(params[1]);
                    const existing = mockProjects.find(x => x.id === projId);
                    if (existing) {
                        existing.technician_status = 'accepted';
                        existing.status = 'awaiting_incharge_confirmation';
                        existing.progress_note = params[0];
                        return { rows: [existing], rowCount: 1 };
                    }
                }
                if (queryStr.includes('technician_id = NULL')) {
                    const projId = Number(params[1]);
                    const existing = mockProjects.find(x => x.id === projId);
                    if (existing) {
                        existing.technician_status = 'declined';
                        existing.technician_id = null;
                        existing.status = 'assigned';
                        existing.progress_note = params[0];
                        return { rows: [existing], rowCount: 1 };
                    }
                }
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

            // Service Presets SELECT
            if (queryStr.includes('FROM service_presets')) {
                if (queryStr.includes('WHERE id = $1')) {
                    const found = mockServicePresets.find(p => p.id === Number(params[0]));
                    return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
                }
                if (queryStr.includes('WHERE is_active = true')) {
                    const active = mockServicePresets.filter(p => p.is_active);
                    return { rows: active, rowCount: active.length };
                }
                return { rows: mockServicePresets, rowCount: mockServicePresets.length };
            }

            // Service Presets INSERT
            if (queryStr.includes('INSERT INTO service_presets')) {
                const newPreset = {
                    id: mockServicePresets.length + 1,
                    name: params[0],
                    default_rate: params[1],
                    is_active: params[2],
                    created_at: new Date(),
                    updated_at: new Date()
                };
                mockServicePresets.push(newPreset);
                return { rows: [newPreset], rowCount: 1 };
            }

            // Service Presets UPDATE
            if (queryStr.includes('UPDATE service_presets')) {
                const id = Number(params[params.length - 1]);
                const existing = mockServicePresets.find(p => p.id === id);
                if (existing) {
                    if (params[0] !== undefined) existing.name = params[0];
                    if (params[1] !== undefined) existing.default_rate = params[1];
                    if (params[2] !== undefined) existing.is_active = params[2];
                    return { rows: [existing], rowCount: 1 };
                }
                return { rows: [], rowCount: 0 };
            }

            // Service Presets DELETE
            if (queryStr.includes('DELETE FROM service_presets WHERE id = $1')) {
                const id = Number(params[0]);
                const idx = mockServicePresets.findIndex(p => p.id === id);
                if (idx !== -1) {
                    const deleted = mockServicePresets.splice(idx, 1)[0];
                    return { rows: [deleted], rowCount: 1 };
                }
                return { rows: [], rowCount: 0 };
            }

            // Job Types SELECT
            if (queryStr.includes('FROM project_job_types')) {
                if (queryStr.includes('WHERE id = $1')) {
                    const found = mockJobTypes.find(j => j.id === Number(params[0]));
                    return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
                }
                if (queryStr.includes('WHERE is_active = true')) {
                    const active = mockJobTypes.filter(j => j.is_active);
                    return { rows: active, rowCount: active.length };
                }
                return { rows: mockJobTypes, rowCount: mockJobTypes.length };
            }

            // Job Types INSERT
            if (queryStr.includes('INSERT INTO project_job_types')) {
                const newJobType = {
                    id: mockJobTypes.length + 1,
                    name: params[0],
                    description: params[1],
                    is_active: params[2],
                    created_at: new Date(),
                    updated_at: new Date()
                };
                mockJobTypes.push(newJobType);
                return { rows: [newJobType], rowCount: 1 };
            }

            // Job Types UPDATE
            if (queryStr.includes('UPDATE project_job_types')) {
                const id = Number(params[params.length - 1]);
                const existing = mockJobTypes.find(j => j.id === id);
                if (existing) {
                    if (params[0] !== undefined) existing.name = params[0];
                    if (params[1] !== undefined) existing.description = params[1];
                    if (params[2] !== undefined) existing.is_active = params[2];
                    return { rows: [existing], rowCount: 1 };
                }
                return { rows: [], rowCount: 0 };
            }

            // Job Types DELETE
            if (queryStr.includes('DELETE FROM project_job_types WHERE id = $1')) {
                const id = Number(params[0]);
                const idx = mockJobTypes.findIndex(j => j.id === id);
                if (idx !== -1) {
                    const deleted = mockJobTypes.splice(idx, 1)[0];
                    return { rows: [deleted], rowCount: 1 };
                }
                return { rows: [], rowCount: 0 };
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

    test('RULE 1 & 2 & 3 (Frontend Derived State & Type Safety): calculateServicesTotal and calculateTotalTechnicianPayout derive values dynamically and prevent string concatenation', () => {
        const calculateServicesTotal = (services = []) => {
            if (!Array.isArray(services)) return 0;
            return services.reduce((acc, s) => {
                const qty = parseFloat(s.quantity) || 0;
                const rate = parseFloat(s.unit_rate) || 0;
                return acc + (qty * rate);
            }, 0);
        };

        const calculateTotalDeviceCount = (services = []) => {
            if (!Array.isArray(services)) return 0;
            return services.reduce((acc, s) => acc + (parseFloat(s.quantity) || 0), 0);
        };

        const calculateTotalTechnicianPayout = (totalSetupFee = 0, conveyance = 0, mealAllowance = 0) => {
            const fee = parseFloat(totalSetupFee) || 0;
            const conv = parseFloat(conveyance) || 0;
            const meal = parseFloat(mealAllowance) || 0;
            return fee + conv + meal;
        };

        // Derived state for dynamic service tasks (qty * rate) via reduce
        const services = [
            { quantity: '4', unit_rate: '350' }, // 1400
            { quantity: 2, unit_rate: 300 },     // 600
            { quantity: '1', unit_rate: 250 }    // 250
        ];

        const totalSetupFee = calculateServicesTotal(services);
        expect(totalSetupFee).toBe(2250);

        const totalDeviceCount = calculateTotalDeviceCount(services);
        expect(totalDeviceCount).toBe(7);

        // String inputs from form fields for conveyance & meal allowance
        const conveyanceInput = '300';
        const mealAllowanceInput = '200';

        const totalPayout = calculateTotalTechnicianPayout(totalSetupFee, conveyanceInput, mealAllowanceInput);
        expect(totalPayout).toBe(2750); // 2250 + 300 + 200 (Numeric sum, not "2250300200")
        expect(typeof totalPayout).toBe('number');
    });

    test('RULE 1 & 2 & 3 (Service Presets CRUD): API supports fetching, adding, updating, and deleting service presets', async () => {
        // 1. GET all presets vs active only
        const reqAll = { query: {} };
        const resAll = mockRes();
        await projectController.getServicePresets(reqAll, resAll);
        expect(resAll.status).toHaveBeenCalledWith(200);
        expect(resAll.json.mock.calls[0][0].data.length).toBe(3);

        const reqActive = { query: { active_only: 'true' } };
        const resActive = mockRes();
        await projectController.getServicePresets(reqActive, resActive);
        expect(resActive.status).toHaveBeenCalledWith(200);
        expect(resActive.json.mock.calls[0][0].data.length).toBe(2);

        // 2. POST create new preset
        const reqCreate = {
            body: {
                name: 'TV Wall Mounting',
                default_rate: '650',
                is_active: true
            }
        };
        const resCreate = mockRes();
        await projectController.createServicePreset(reqCreate, resCreate);
        expect(resCreate.status).toHaveBeenCalledWith(201);
        const created = resCreate.json.mock.calls[0][0].data;
        expect(created.name).toBe('TV Wall Mounting');
        expect(created.default_rate).toBe(650);
        expect(created.is_active).toBe(true);

        // 3. PUT update preset
        const reqUpdate = {
            params: { id: created.id },
            body: {
                name: 'TV Wall Mounting (Heavy Bracket)',
                default_rate: 800,
                is_active: false
            }
        };
        const resUpdate = mockRes();
        await projectController.updateServicePreset(reqUpdate, resUpdate);
        expect(resUpdate.status).toHaveBeenCalledWith(200);
        const updated = resUpdate.json.mock.calls[0][0].data;
        expect(updated.name).toBe('TV Wall Mounting (Heavy Bracket)');
        expect(updated.default_rate).toBe(800);
        expect(updated.is_active).toBe(false);

        // 4. DELETE preset
        const reqDelete = { params: { id: created.id } };
        const resDelete = mockRes();
        await projectController.deleteServicePreset(reqDelete, resDelete);
        expect(resDelete.status).toHaveBeenCalledWith(200);
        expect(resDelete.json.mock.calls[0][0].success).toBe(true);
    });

    test('RULE 1 & 2 & 3 (Job Types CRUD): API supports fetching, adding, updating, and deleting project/job types', async () => {
        // 1. GET all job types vs active only
        const reqAll = { query: {} };
        const resAll = mockRes();
        await projectController.getJobTypes(reqAll, resAll);
        expect(resAll.status).toHaveBeenCalledWith(200);
        expect(resAll.json.mock.calls[0][0].data.length).toBe(3);

        const reqActive = { query: { active_only: 'true' } };
        const resActive = mockRes();
        await projectController.getJobTypes(reqActive, resActive);
        expect(resActive.status).toHaveBeenCalledWith(200);
        expect(resActive.json.mock.calls[0][0].data.length).toBe(2);

        // 2. POST create new job type
        const reqCreate = {
            body: {
                name: 'Solar Panel Setup',
                description: 'Inverter and solar array configuration',
                is_active: true
            }
        };
        const resCreate = mockRes();
        await projectController.createJobType(reqCreate, resCreate);
        expect(resCreate.status).toHaveBeenCalledWith(201);
        const created = resCreate.json.mock.calls[0][0].data;
        expect(created.name).toBe('Solar Panel Setup');
        expect(created.description).toBe('Inverter and solar array configuration');
        expect(created.is_active).toBe(true);

        // 3. PUT update job type
        const reqUpdate = {
            params: { id: created.id },
            body: {
                name: 'Solar & IPS Setup',
                description: 'Full IPS and solar inverter setup',
                is_active: false
            }
        };
        const resUpdate = mockRes();
        await projectController.updateJobType(reqUpdate, resUpdate);
        expect(resUpdate.status).toHaveBeenCalledWith(200);
        const updated = resUpdate.json.mock.calls[0][0].data;
        expect(updated.name).toBe('Solar & IPS Setup');
        expect(updated.description).toBe('Full IPS and solar inverter setup');
        expect(updated.is_active).toBe(false);

        // 4. DELETE job type
        const reqDelete = { params: { id: created.id } };
        const resDelete = mockRes();
        await projectController.deleteJobType(reqDelete, resDelete);
        expect(resDelete.status).toHaveBeenCalledWith(200);
        expect(resDelete.json.mock.calls[0][0].success).toBe(true);
    });

    test('RULE: Technician can Accept project first-time, but post-accept rejection requires Request Rejection and Admin Approval', async () => {
        // 1. Initial State: Project 501 is assigned to tech 10. Tech accepts.
        const reqAccept = {
            params: { id: 501 },
            body: { action: 'accept', response_note: 'Starting work tomorrow' }
        };
        const resAccept = mockRes();
        await projectController.technicianRespond(reqAccept, resAccept);

        expect(resAccept.status).toHaveBeenCalledWith(200);
        expect(resAccept.json.mock.calls[0][0].data.technician_status).toBe('accepted');
        expect(resAccept.json.mock.calls[0][0].data.status).toBe('awaiting_incharge_confirmation');

        // 2. Post-acceptance rejection attempt: technician tries to decline/reject.
        // It must NOT directly reject; it converts to request_rejection!
        const reqDecline = {
            params: { id: 501 },
            body: { action: 'decline', response_note: 'Severe bike accident, cannot visit site' }
        };
        const resDecline = mockRes();
        await projectController.technicianRespond(reqDecline, resDecline);

        expect(resDecline.status).toHaveBeenCalledWith(200);
        expect(resDecline.json.mock.calls[0][0].data.technician_status).toBe('rejection_requested');
        expect(resDecline.json.mock.calls[0][0].data.status).toBe('rejection_requested');
        expect(resDecline.json.mock.calls[0][0].message).toContain('বাতিলের আবেদন সফলভাবে জমা দেওয়া হয়েছে');

        // 3. Shop Admin reviews and Approves Rejection Request
        const reqAdminApprove = {
            params: { id: 501 },
            body: { approve: true, admin_note: 'Approved due to medical emergency' }
        };
        const resAdminApprove = mockRes();
        await projectController.adminRespondRejection(reqAdminApprove, resAdminApprove);

        expect(resAdminApprove.status).toHaveBeenCalledWith(200);
        const approvedData = resAdminApprove.json.mock.calls[0][0].data;
        expect(approvedData.technician_id).toBeNull(); // Tech released
        expect(approvedData.technician_status).toBe('declined');
        expect(approvedData.status).toBe('assigned'); // Ready for new tech assignment
        expect(resAdminApprove.json.mock.calls[0][0].message).toContain('বাতিলের আবেদন অনুমোদন করা হয়েছে');
    });
});
