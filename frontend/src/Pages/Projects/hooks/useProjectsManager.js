import { useState, useEffect, useCallback } from 'react';
import API, { getAuthHeaders } from '../../../services/api';
import useProjectPipeline from './useProjectPipeline';
import useProjectActions from './useProjectActions';

export default function useProjectsManager({ isTechnician = false, currentUser = null } = {}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  // Modals
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isTechWalletOpen, setIsTechWalletOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [printProject, setPrintProject] = useState(null);

  // Workflow Modal States
  const [techPromptProject, setTechPromptProject] = useState(null);
  const [techResponseNote, setTechResponseNote] = useState('');
  const [inchargeConfirmProject, setInchargeConfirmProject] = useState(null);
  const [inchargeNote, setInchargeNote] = useState('');
  const [progressProject, setProgressProject] = useState(null);
  const [newProgressNote, setNewProgressNote] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/projects`, {
        headers: getAuthHeaders(),
      });
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 1. Pipeline filtering, scoping & counts
  const { counts, filteredProjects } = useProjectPipeline({
    projects,
    isTechnician,
    currentUser,
    searchQuery,
    stageFilter,
  });

  // 2. Network mutations & workflow actions
  const {
    handleTechRespond,
    handleInchargeConfirm,
    handleAddProgress,
    handleCompleteProject,
    handleReopenProject,
    handleDeleteProject,
    handleAdminRespondRejection,
  } = useProjectActions({
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
  });

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
    editingProject,
    setEditingProject,
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
    handleReopenProject,
    handleDeleteProject,
    handleAdminRespondRejection,
    counts,
    filteredProjects,
  };
}
