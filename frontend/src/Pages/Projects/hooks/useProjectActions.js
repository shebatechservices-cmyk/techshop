import API, { getAuthHeaders } from '../../../services/api';

export default function useProjectActions({
  loadData,
  techPromptProject,
  setTechPromptProject,
  techResponseNote,
  setTechResponseNote,
  inchargeConfirmProject,
  setInchargeConfirmProject,
  inchargeNote,
  setInchargeNote,
  progressProject,
  setProgressProject,
  newProgressNote,
  setNewProgressNote,
  setProjects,
}) {
  // 1. Technician Respond (Accept / Decline)
  const handleTechRespond = async (action) => {
    if (!techPromptProject) return;
    try {
      const res = await fetch(`${API}/projects/${techPromptProject.id}/technician-respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ action, response_note: techResponseNote }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Response submitted successfully');
        setTechPromptProject(null);
        setTechResponseNote('');
        loadData();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  // 2. In-charge Confirmation
  const handleInchargeConfirm = async () => {
    if (!inchargeConfirmProject) return;
    try {
      const res = await fetch(`${API}/projects/${inchargeConfirmProject.id}/incharge-confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ confirmed_by: 2, incharge_note: inchargeNote }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Handover confirmed successfully');
        setInchargeConfirmProject(null);
        setInchargeNote('');
        loadData();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  // 3. Add Progress Note
  const handleAddProgress = async () => {
    if (!progressProject || !newProgressNote.trim()) return;
    try {
      const res = await fetch(`${API}/projects/${progressProject.id}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ progress_note: newProgressNote, status: 'in_progress' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Project progress updated successfully!');
        setProgressProject(null);
        setNewProgressNote('');
        loadData();
      } else {
        alert(data.message || 'Failed to update progress');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  // 4. Complete Project & Auto-credit Wallet
  const handleCompleteProject = async (project) => {
    const totalPayout =
      Number(project.setup_charge || 0) +
      Number(project.conveyance_cost || 0) +
      Number(project.meal_allowance || 0) ||
      Number(project.charges || 0);

    const confirmMsg = `Are you sure this project is completed?\n\nA total payout of ৳ ${totalPayout.toLocaleString(
      'en-BD'
    )} (Setup + Conveyance + Meal) will be automatically credited to technician (${project.technician_name})'s wallet.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API}/projects/${project.id}/complete`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Project marked as completed');
        loadData();
      } else {
        alert(data.message || 'Failed to complete project');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  // 4.5 Reopen / Rollback Completed Project
  const handleReopenProject = async (project) => {
    const totalPayout =
      Number(project.setup_charge || 0) +
      Number(project.conveyance_cost || 0) +
      Number(project.meal_allowance || 0) ||
      Number(project.charges || 0);

    const reason = window.prompt(
      `ভুলবশত সম্পন্ন হওয়া প্রজেক্ট #${project.project_code} পুনরায় চালু (Reopen) করতে চান?\n\n- টেকনিশিয়ান (${project.technician_name || 'Technician'}) ওয়ালেট থেকে ৳ ${totalPayout.toLocaleString('en-BD')} কর্তন হবে।\n- ক্যাশ ড্রয়ারে উক্ত টাকা ফেরত আসবে।\n- প্রজেক্ট স্ট্যাটাস আবার 'In Progress'-এ ফিরে যাবে।\n\nকারণ লিখুন (বা OK চাপুন):`,
      'ভুলবশত সম্পন্ন করা হয়েছিল, পুনরায় চালু করা হলো'
    );

    if (reason === null) return;

    try {
      const res = await fetch(`${API}/projects/${project.id}/reopen`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Project reopened successfully');
        loadData();
      } else {
        alert(data.message || 'Failed to reopen project');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  // 5. Delete Project
  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`${API}/projects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        if (setProjects) {
          setProjects((prev) => prev.filter((p) => p.id !== id));
        } else {
          loadData();
        }
      } else {
        alert('Failed to delete project');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  // 6. Admin Respond to Rejection Request
  const handleAdminRespondRejection = async (projectId, approve, adminNote = '') => {
    try {
      const res = await fetch(`${API}/projects/${projectId}/admin-respond-rejection`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ approve, admin_note: adminNote }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Action executed successfully');
        loadData();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  return {
    handleTechRespond,
    handleInchargeConfirm,
    handleAddProgress,
    handleCompleteProject,
    handleReopenProject,
    handleDeleteProject,
    handleAdminRespondRejection,
  };
}
