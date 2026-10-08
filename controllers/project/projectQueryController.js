const pool = require("../../config/db");

// ৮. সকল প্রজেক্ট বা সার্ভিসের তালিকা দেখা (উন্নত ফিল্টারিং ও জয়েন সহ)
exports.getProjects = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.*,
                COALESCE(c.name, 'Walking / Direct Client') AS customer_name,
                c.phone AS customer_phone,
                c.address AS customer_base_address,
                COALESCE(u.name, 'Unassigned') AS technician_name,
                COALESCE(u.phone, u.email, '') AS technician_contact,
                conf_user.name AS confirmed_by_name,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object(
                            'id', ps.id,
                            'service_name', ps.service_name,
                            'quantity', ps.quantity,
                            'unit_rate', ps.unit_rate,
                            'line_total', ps.line_total,
                            'notes', ps.notes
                        ) ORDER BY ps.id ASC)
                        FROM project_services ps
                        WHERE ps.project_id = p.id
                    ), '[]'::json
                ) AS services
            FROM service_projects p
            LEFT JOIN customers c ON p.customer_id = c.id
            LEFT JOIN users u ON p.technician_id = u.id
            LEFT JOIN users conf_user ON p.confirmed_by = conf_user.id
            WHERE p.deleted_at IS NULL
            ORDER BY p.id DESC;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get projects error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + error.message });
    }
};

// ৮.১ একক প্রজেক্টের বিস্তারিত তথ্য সংগ্রহ (সার্ভিসেস সহ)
exports.getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                p.*,
                COALESCE(c.name, 'Walking / Direct Client') AS customer_name,
                c.phone AS customer_phone,
                c.address AS customer_base_address,
                COALESCE(u.name, 'Unassigned') AS technician_name,
                COALESCE(u.phone, u.email, '') AS technician_contact,
                conf_user.name AS confirmed_by_name,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object(
                            'id', ps.id,
                            'service_name', ps.service_name,
                            'quantity', ps.quantity,
                            'unit_rate', ps.unit_rate,
                            'line_total', ps.line_total,
                            'notes', ps.notes
                        ) ORDER BY ps.id ASC)
                        FROM project_services ps
                        WHERE ps.project_id = p.id
                    ), '[]'::json
                ) AS services
            FROM service_projects p
            LEFT JOIN customers c ON p.customer_id = c.id
            LEFT JOIN users u ON p.technician_id = u.id
            LEFT JOIN users conf_user ON p.confirmed_by = conf_user.id
            WHERE p.id = $1 AND p.deleted_at IS NULL;
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'প্রজেক্ট পাওয়া যায়নি।' });
        }
        return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Get project by id error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + error.message });
    }
};
