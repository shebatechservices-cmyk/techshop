const pool = require("../../../config/db");

// ১. টেকনিশিয়ান কর্তৃক কাজ গ্রহণ (Accept), প্রত্যাখ্যান (Decline) বা পরবর্তীতে বাতিলের আবেদন (Request Rejection)
exports.technicianRespond = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, response_note = '' } = req.body; // action: 'accept' | 'decline' | 'request_rejection'

        const projCheck = await pool.query('SELECT * FROM service_projects WHERE id = $1', [id]);
        if (projCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'প্রজেক্ট পাওয়া যায়নি।' });
        }

        const project = projCheck.rows[0];

        // ১. ফার্স্ট টাইম কাজ গ্রহণ (Accept)
        if (action === 'accept') {
            const noteText = `${project.progress_note || ''}\n[${new Date().toLocaleTimeString()}] টেকনিশিয়ান কাজ গ্রহণ করেছেন। ${response_note}`.trim();
            const result = await pool.query(`
                UPDATE service_projects
                SET technician_status = 'accepted',
                    status = 'awaiting_incharge_confirmation',
                    progress_note = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *;
            `, [noteText, id]);

            return res.status(200).json({
                success: true,
                message: 'কাজের অনুরোধ সফলভাবে গ্রহণ করা হয়েছে। এডমিন/ইনচার্জ কনফার্মেশনের পর কাজ শুরু হবে।',
                data: result.rows[0]
            });
        } 
        
        // ২. যদি কাজ ইতোমধ্যেই অ্যাকসেপ্ট করা হয়ে থাকে, সরাসরি রিজেক্ট করা যাবে না - রিকোয়েস্ট পাঠাতে হবে
        const isAlreadyAccepted = project.technician_status === 'accepted' || 
                                  project.technician_status === 'in_progress' ||
                                  project.status === 'awaiting_incharge_confirmation' ||
                                  project.status === 'in_progress';

        if (action === 'request_rejection' || (action === 'decline' && isAlreadyAccepted)) {
            const noteText = `${project.progress_note || ''}\n[${new Date().toLocaleTimeString()}] টেকনিশিয়ান কাজ বাতিলের আবেদন (Rejection Request) পাঠিয়েছেন। কারণ: ${response_note}`.trim();
            const result = await pool.query(`
                UPDATE service_projects
                SET technician_status = 'rejection_requested',
                    status = 'rejection_requested',
                    progress_note = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *;
            `, [noteText, id]);

            return res.status(200).json({
                success: true,
                message: 'কাজের অনুরোধ বাতিলের আবেদন সফলভাবে জমা দেওয়া হয়েছে। শপ এডমিন অনুমোদন করলে কাজ রিলিজ হবে।',
                data: result.rows[0]
            });
        }

        // ৩. প্রথমবার অ্যাসাইন হওয়ার পর তাৎক্ষণিক প্রত্যাখ্যান (Initial Decline)
        const noteText = `${project.progress_note || ''}\n[${new Date().toLocaleTimeString()}] টেকনিশিয়ান অপারগতা প্রকাশ করেছেন: ${response_note}`.trim();
        const result = await pool.query(`
            UPDATE service_projects
            SET technician_status = 'declined',
                status = 'tech_declined',
                progress_note = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *;
        `, [noteText, id]);

        return res.status(200).json({
            success: true,
            message: 'কাজের অনুরোধ প্রত্যাখ্যান করা হয়েছে।',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('technicianRespond error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + error.message });
    }
};

// ২. শপ এডমিন কর্তৃক টেকনিশিয়ানের বাতিলের আবেদন (Rejection Request) নিষ্পত্তি
exports.adminRespondRejection = async (req, res) => {
    try {
        const { id } = req.params;
        const { approve = true, admin_note = '' } = req.body;

        const projCheck = await pool.query('SELECT * FROM service_projects WHERE id = $1', [id]);
        if (projCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'প্রজেক্ট পাওয়া যায়নি।' });
        }

        const project = projCheck.rows[0];

        if (approve) {
            const noteText = `${project.progress_note || ''}\n[${new Date().toLocaleTimeString()}] শপ এডমিন টেকনিশিয়ানের বাতিলের আবেদন অনুমোদন করেছেন। টেকনিশিয়ান রিলিজ করা হয়েছে। ${admin_note}`.trim();
            const result = await pool.query(`
                UPDATE service_projects
                SET technician_status = 'declined',
                    technician_id = NULL,
                    status = 'assigned',
                    admin_confirmed = false,
                    progress_note = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *;
            `, [noteText, id]);

            return res.status(200).json({
                success: true,
                message: 'টেকনিশিয়ানের বাতিলের আবেদন অনুমোদন করা হয়েছে। কাজ থেকে টেকনিশিয়ান রিলিজ করা হয়েছে।',
                data: result.rows[0]
            });
        } else {
            const noteText = `${project.progress_note || ''}\n[${new Date().toLocaleTimeString()}] শপ এডমিন বাতিলের আবেদন নামঞ্জুর করেছেন (কাজে বহাল রাখা হয়েছে)। ${admin_note}`.trim();
            const result = await pool.query(`
                UPDATE service_projects
                SET technician_status = 'in_progress',
                    status = 'in_progress',
                    progress_note = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *;
            `, [noteText, id]);

            return res.status(200).json({
                success: true,
                message: 'বাতিলের আবেদন নামঞ্জুর করা হয়েছে। টেকনিশিয়ান কাজে বহাল রয়েছে।',
                data: result.rows[0]
            });
        }
    } catch (error) {
        console.error('adminRespondRejection error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + error.message });
    }
};

// ৩. এডমিন বা সেটাপ ইনচার্জ কর্তৃক চূড়ান্ত হ্যান্ডওভার কনফার্মেশন (In-charge Confirmation)
exports.confirmByIncharge = async (req, res) => {
    try {
        const { id } = req.params;
        const { confirmed_by = null, incharge_note = '' } = req.body;

        const projCheck = await pool.query('SELECT * FROM service_projects WHERE id = $1', [id]);
        if (projCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'প্রজেক্ট পাওয়া যায়নি।' });
        }

        const project = projCheck.rows[0];

        const noteText = `${project.progress_note || ''}\n[${new Date().toLocaleTimeString()}] সেটাপ ইনচার্জ কর্তৃক কাজ চূড়ান্ত অনুমোদন দেওয়া হয়েছে। ${incharge_note}`.trim();

        const result = await pool.query(`
            UPDATE service_projects
            SET admin_confirmed = true,
                confirmed_by = $1,
                technician_status = 'in_progress',
                status = 'in_progress',
                progress_note = $2,
                updated_at = NOW()
            WHERE id = $3
            RETURNING *;
        `, [confirmed_by, noteText, id]);

        return res.status(200).json({
            success: true,
            message: 'সেটাপ ইনচার্জ হ্যান্ডওভার অনুমোদন করেছেন। কাজ এখন চলমান (In Progress)।',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('confirmByIncharge error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + error.message });
    }
};

// ৪. টেকনিশিয়ান কর্তৃক কাজের অগ্রগতি (Progress Note) আপডেট করা
exports.updateProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { progress_note, status } = req.body;

        const result = await pool.query(`
            UPDATE service_projects 
            SET progress_note = CASE 
                    WHEN progress_note IS NULL OR progress_note = '' THEN $1
                    ELSE progress_note || E'\n' || $1
                END, 
                status = COALESCE($2, status), 
                updated_at = NOW()
            WHERE id = $3
            RETURNING *;
        `, [progress_note, status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'প্রজেক্ট পাওয়া যায়নি।' });
        }

        return res.status(200).json({
            success: true,
            message: 'কাজের অগ্রগতি সফলভাবে সংরক্ষিত হয়েছে।',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Progress update error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর হয়েছে।' });
    }
};
