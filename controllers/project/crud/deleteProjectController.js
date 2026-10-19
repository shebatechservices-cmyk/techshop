const pool = require("../../../config/db");

// 9. Safe Project Deletion (Blocked if work completed/confirmed)
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const pRes = await pool.query('SELECT * FROM service_projects WHERE id = $1', [id]);
        if (!pRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }
        const proj = pRes.rows[0];

        // Completed work / admin confirmed lock check
        if (proj.status === 'completed' || proj.technician_status === 'completed' || proj.admin_confirmed === true) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete completed work or admin-confirmed service project. You can edit the project details instead.'
            });
        }

        await pool.query('UPDATE service_projects SET deleted_at = NOW() WHERE id = $1', [id]);
        await pool.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('service_projects', $1, $2, $3, NOW())
        `, [id, `Project #${proj.project_code || id}`, JSON.stringify(proj)]).catch(() => null);

        return res.status(200).json({ success: true, message: `Project #${proj.project_code || id} moved to Trash successfully!` });
    } catch (error) {
        console.error('Delete project error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete project: ' + error.message });
    }
};
