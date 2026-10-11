import { useMemo } from 'react';

export default function useProjectPipeline({
  projects = [],
  isTechnician = false,
  currentUser = null,
  searchQuery = '',
  stageFilter = 'all',
}) {
  // Base projects scoped to the logged-in technician if isTechnician is true
  const scopedProjects = useMemo(() => {
    if (!isTechnician || !currentUser) return projects;
    const currentUserId = Number(currentUser.id || 0);
    const currentName = String(currentUser.name || '').toLowerCase().trim();
    const currentPhone = String(currentUser.phone || '').trim();

    return projects.filter((p) => {
      if (p.technician_id && currentUserId && Number(p.technician_id) === currentUserId) {
        return true;
      }
      if (
        currentName &&
        p.technician_name &&
        p.technician_name.toLowerCase().trim() === currentName
      ) {
        return true;
      }
      if (
        currentPhone &&
        p.technician_contact &&
        p.technician_contact.includes(currentPhone)
      ) {
        return true;
      }
      return false;
    });
  }, [projects, isTechnician, currentUser]);

  // Pipeline Counts
  const counts = useMemo(() => {
    return {
      all: scopedProjects.length,
      assigned: scopedProjects.filter(
        (p) => p.technician_status === 'assigned' || p.status === 'assigned'
      ).length,
      accepted: scopedProjects.filter(
        (p) =>
          p.technician_status === 'accepted' ||
          p.status === 'awaiting_incharge_confirmation'
      ).length,
      rejection_requested: scopedProjects.filter(
        (p) =>
          p.technician_status === 'rejection_requested' ||
          p.status === 'rejection_requested'
      ).length,
      in_progress: scopedProjects.filter(
        (p) => p.technician_status === 'in_progress' || p.status === 'in_progress'
      ).length,
      completed: scopedProjects.filter((p) => p.status === 'completed').length,
    };
  }, [scopedProjects]);

  // Filtered list
  const filteredProjects = useMemo(() => {
    return scopedProjects.filter((p) => {
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
      if (stageFilter === 'rejection_requested')
        return (
          p.technician_status === 'rejection_requested' ||
          p.status === 'rejection_requested'
        );
      if (stageFilter === 'in_progress')
        return (
          p.technician_status === 'in_progress' || p.status === 'in_progress'
        );
      if (stageFilter === 'completed') return p.status === 'completed';

      return true;
    });
  }, [scopedProjects, searchQuery, stageFilter]);

  return {
    scopedProjects,
    counts,
    filteredProjects,
  };
}
