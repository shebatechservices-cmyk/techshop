import { useState, useEffect, useMemo } from 'react';
import API from '../../../services/api';

export default function useProjectsManager() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  // Modals
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isTechWalletOpen, setIsTechWalletOpen] = useState(false);
  const [printProject, setPrintProject] = useState(null);

  // Tech Prompt Modal State
  const [techPromptProject, setTechPromptProject] = useState(null);
  const [techResponseNote, setTechResponseNote] = useState('');

  // Incharge Confirm Modal State
  const [inchargeConfirmProject, setInchargeConfirmProject] = useState(null);
  const [inchargeNote, setInchargeNote] = useState('');

  // Progress Note Modal State
  const [progressProject, setProgressProject] = useState(null);
  const [newProgressNote, setNewProgressNote] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/projects`);
      if (res.ok) {
        const pData = await res.json();
        setProjects(pData.data || []);
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      console.error(err);
      setError('Server error loading projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Technician Respond (Accept / Decline)
  const handleTechRespond = async (action) => {
    if (!techPromptProject) return;
    try {
      const res = await fetch(`${API}/projects/${techPromptProject.id}/technician-respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, response_note: techResponseNote }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed_by: 2, incharge_note: inchargeNote }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress_note: newProgressNote, status: 'in_progress' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('কাজের অগ্রগতি আপডেট হয়েছে!');
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

    const confirmMsg = `আপনি কি নিশ্চিত যে কাজ সম্পন্ন হয়েছে?\n\nটেকনিশিয়ান (${project.technician_name})-এর ওয়ালেটে মোট ৳ ${totalPayout.toLocaleString(
      'en-IN'
    )} (সেটাপ + যাতায়াত + মিল) স্বয়ংক্রিয়ভাবে জমা হবে।`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API}/projects/${project.id}/complete`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        loadData();
      } else {
        alert(data.message || 'Failed to complete project');
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
      const res = await fetch(`${API}/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert('Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  // Pipeline Counts
  const counts = useMemo(() => {
    return {
      all: projects.length,
      assigned: projects.filter(
        (p) => p.technician_status === 'assigned' || p.status === 'assigned'
      ).length,
      accepted: projects.filter(
        (p) =>
          p.technician_status === 'accepted' ||
          p.status === 'awaiting_incharge_confirmation'
      ).length,
      in_progress: projects.filter(
        (p) => p.technician_status === 'in_progress' || p.status === 'in_progress'
      ).length,
      completed: projects.filter((p) => p.status === 'completed').length,
    };
  }, [projects]);

  // Filtered list
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.project_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.technician_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.invoice_no || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (stageFilter === 'all') return true;
      if (stageFilter === 'assigned')
        return p.technician_status === 'assigned' || p.status === 'assigned';
      if (stageFilter === 'accepted')
        return (
          p.technician_status === 'accepted' ||
          p.status === 'awaiting_incharge_confirmation'
        );
      if (stageFilter === 'in_progress')
        return (
          p.technician_status === 'in_progress' || p.status === 'in_progress'
        );
      if (stageFilter === 'completed') return p.status === 'completed';

      return true;
    });
  }, [projects, searchQuery, stageFilter]);

  return {
    projects,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    stageFilter,
    setStageFilter,
    isNewProjectOpen,
    setIsNewProjectOpen,
    isTechWalletOpen,
    setIsTechWalletOpen,
    printProject,
    setPrintProject,
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
    loadData,
    handleTechRespond,
    handleInchargeConfirm,
    handleAddProgress,
    handleCompleteProject,
    handleDeleteProject,
    counts,
    filteredProjects,
  };
}
