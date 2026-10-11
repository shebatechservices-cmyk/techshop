// Module definition with table name, display label, and title/subtitle formatters
const MODULE_CONFIG = {
    products: {
        table: 'products',
        label: 'Product (পণ্য)',
        icon: '📦',
        getTitle: (r) => r.name || 'Unnamed Product',
        getSubtitle: (r) => `SKU: ${r.sku || 'N/A'} | Stock: ${r.stock || 0} | Price: ৳${parseFloat(r.selling_price || 0).toLocaleString()}`
    },
    sales: {
        table: 'sales',
        label: 'Sales Invoice (বিক্রয় মেমো)',
        icon: '🧾',
        getTitle: (r) => `Invoice #${r.invoice_no || r.id}`,
        getSubtitle: (r) => `Total: ৳${parseFloat(r.total_amount || 0).toLocaleString()} | Paid: ৳${parseFloat(r.paid_amount || 0).toLocaleString()} | Date: ${r.sale_date ? new Date(r.sale_date).toLocaleDateString() : 'N/A'}`
    },
    purchases: {
        table: 'purchase_orders',
        label: 'Purchase Order (ক্রয়)',
        icon: '🛒',
        getTitle: (r) => `PO #${r.po_number || r.id}`,
        getSubtitle: (r) => `Total Cost: ৳${parseFloat(r.total_cost || 0).toLocaleString()} | Items: ${r.item_count || 0} | Status: ${r.status || 'Received'}`
    },
    customers: {
        table: 'customers',
        label: 'Customer (গ্রাহক)',
        icon: '👥',
        getTitle: (r) => r.name || 'Unnamed Customer',
        getSubtitle: (r) => `Phone: ${r.phone || 'N/A'} | Balance: ৳${parseFloat(r.receivable_balance || 0).toLocaleString()}`
    },
    suppliers: {
        table: 'suppliers',
        label: 'Supplier (সরবরাহকারী)',
        icon: '🏭',
        getTitle: (r) => r.name || 'Unnamed Supplier',
        getSubtitle: (r) => `Phone: ${r.phone || 'N/A'} | Payable: ৳${parseFloat(r.payable_balance || 0).toLocaleString()}`
    },
    expenses: {
        table: 'expenses',
        label: 'Expense (দৈনিক খরচ)',
        icon: '💸',
        getTitle: (r) => `${r.voucher_no || 'EXP-' + r.id} (${r.category_name || 'General'})`,
        getSubtitle: (r) => `Amount: ৳${parseFloat(r.amount || 0).toLocaleString()} | Payee: ${r.payee_name || 'N/A'} | Note: ${r.note || 'None'}`
    },
    projects: {
        table: 'service_projects',
        label: 'Project (সার্ভিস প্রজেক্ট)',
        icon: '🛠️',
        getTitle: (r) => `Project #${r.project_code || 'PRJ-' + r.id}`,
        getSubtitle: (r) => `Customer: ${r.customer_name || 'N/A'} | Status: ${r.status || 'Active'} | Cost: ৳${parseFloat(r.total_cost || 0).toLocaleString()}`
    },
    ecommerce: {
        table: 'ecommerce_orders',
        label: 'E-Commerce Order (অনলাইন অর্ডার)',
        icon: '🌐',
        getTitle: (r) => `Order #${r.order_number || 'ECOM-' + r.id}`,
        getSubtitle: (r) => `Customer: ${r.customer_name || 'Guest'} | Total: ৳${parseFloat(r.grand_total || 0).toLocaleString()} | Status: ${r.order_status || 'Pending'}`
    },
    categories: {
        table: 'categories',
        label: 'Category (ক্যাটাগরি)',
        icon: '🏷️',
        getTitle: (r) => r.name || 'Unnamed Category',
        getSubtitle: (r) => `Category Master Item #${r.id}`
    },
    sub_categories: {
        table: 'sub_categories',
        label: 'Sub-Category (সাব-ক্যাটাগরি)',
        icon: '📂',
        getTitle: (r) => r.name || 'Unnamed Sub-category',
        getSubtitle: (r) => `Sub-Category ID: #${r.id} | Category ID: #${r.category_id || 'N/A'}`
    },
    brands: {
        table: 'brands',
        label: 'Brand (ব্র্যান্ড)',
        icon: '🏷️',
        getTitle: (r) => r.name || 'Unnamed Brand',
        getSubtitle: (r) => `Brand Master Item #${r.id}`
    },
    models: {
        table: 'models',
        label: 'Model (মডেল)',
        icon: '📐',
        getTitle: (r) => r.name || 'Unnamed Model',
        getSubtitle: (r) => `Model ID: #${r.id} | Brand ID: #${r.brand_id || 'N/A'}`
    },
    series: {
        table: 'series',
        label: 'Series (সিরিজ)',
        icon: '🔖',
        getTitle: (r) => r.name || 'Unnamed Series',
        getSubtitle: (r) => `Series ID: #${r.id} | Brand ID: #${r.brand_id || 'N/A'}`
    },
    product_names: {
        table: 'product_names',
        label: 'Product Name (পণ্যের নাম)',
        icon: '📝',
        getTitle: (r) => r.name || 'Unnamed Product Name',
        getSubtitle: (r) => `Product Name Master Item #${r.id}`
    },
    quotations: {
        table: 'sales_quotations',
        label: 'Sales Quotation (কোটেশন)',
        icon: '📑',
        getTitle: (r) => `Quote #${r.quotation_no || r.id}`,
        getSubtitle: (r) => `Total: ৳${parseFloat(r.total_amount || 0).toLocaleString()} | Status: ${r.status || 'Draft'}`
    },
    users: {
        table: 'users',
        label: 'Staff Member (কর্মী)',
        icon: '👤',
        getTitle: (r) => r.name || 'Unnamed Staff',
        getSubtitle: (r) => `Role: ${r.user_role || 'Staff'} | Email: ${r.email || 'N/A'}`
    },
    warranty_claims: {
        table: 'warranty_claims',
        label: 'Warranty Claim (ওয়ারেন্টি ক্লেইম)',
        icon: '🛡️',
        getTitle: (r) => `Claim #${r.claim_no || r.id}`,
        getSubtitle: (r) => `Product: ${r.product_name || 'N/A'} | Serial: ${r.serial_code || 'N/A'} | Status: ${r.status || 'Received'}`
    },
    product_returns: {
        table: 'product_returns',
        label: 'Product Return / Refund (পণ্য ফেরত)',
        icon: '🔄',
        getTitle: (r) => `Return #${r.return_no || r.id}`,
        getSubtitle: (r) => `Product: ${r.product_name || 'N/A'} | Refund: ৳${parseFloat(r.refund_amount || 0).toLocaleString()} | Type: ${r.return_type || 'Refund'}`
    }
};

// Helper: resolve module key to table name and config
function resolveModule(key) {
    if (!key) return null;
    if (MODULE_CONFIG[key]) return { moduleKey: key, config: MODULE_CONFIG[key] };
    // Reverse lookup by table name
    for (const [k, v] of Object.entries(MODULE_CONFIG)) {
        if (v.table === key) return { moduleKey: k, config: v };
    }
    return null;
}

module.exports = {
    MODULE_CONFIG,
    resolveModule,
};
