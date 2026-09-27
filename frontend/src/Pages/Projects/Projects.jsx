import React, { useState } from 'react';
import useProjectsManager from './hooks/useProjectsManager';
import ProjectsHeader from './components/ProjectsHeader';
import ProjectsMetrics from './components/ProjectsMetrics';
import ProjectsFilterBar from './components/ProjectsFilterBar';
import ProjectsTable from './components/ProjectsTable';
import TechResponseModal from './modals/TechResponseModal';
import InchargeConfirmModal from './modals/InchargeConfirmModal';
import ProgressNoteModal from './modals/ProgressNoteModal';
import NewProjectModal from './modals/NewProjectModal';
import ProjectPrintModal from './modals/ProjectPrintModal';
import TechWalletModal from './modals/TechWalletModal';
import ManageServicePresetsModal from './modals/ManageServicePresetsModal';
import ManageJobTypesModal from './modals/ManageJobTypesModal';

export default function Projects() {
  const [isManagePresetsOpen, setIsManagePresetsOpen] = useState(false);
  const [isManageJobTypesOpen, setIsManageJobTypesOpen] = useState(false);
  const {
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
    editingProject,
    setEditingProject,
  } = useProjectsManager();

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Header */}
      <ProjectsHeader
        error={error}
        onOpenTechWallet={() => setIsTechWalletOpen(true)}
        onOpenManagePresets={() => setIsManagePresetsOpen(true)}
        onOpenManageJobTypes={() => setIsManageJobTypesOpen(true)}
        onOpenNewProject={() => {
          setEditingProject(null);
          setIsNewProjectOpen(true);
        }}
      />

      {/* Pipeline Stage Metrics */}
      <ProjectsMetrics
        counts={counts}
        stageFilter={stageFilter}
        setStageFilter={setStageFilter}
      />

      {/* Search & Filter Controls */}
      <ProjectsFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        stageFilter={stageFilter}
        setStageFilter={setStageFilter}
      />

      {/* Projects Table */}
      <ProjectsTable
        projects={filteredProjects}
        loading={loading}
        onTechPrompt={setTechPromptProject}
        onInchargeConfirm={setInchargeConfirmProject}
        onAddProgress={setProgressProject}
        onComplete={handleCompleteProject}
        onEdit={(p) => setEditingProject(p)}
        onPrint={setPrintProject}
        onDelete={handleDeleteProject}
      />

      {/* New Project / Edit Work Order Modal */}
      {(isNewProjectOpen || Boolean(editingProject)) && (
        <NewProjectModal
          isOpen={isNewProjectOpen || Boolean(editingProject)}
          onClose={() => {
            setIsNewProjectOpen(false);
            setEditingProject(null);
          }}
          onSuccess={loadData}
          projectToEdit={editingProject}
        />
      )}

      {/* Tech Response Modal */}
      {techPromptProject && (
        <TechResponseModal
          project={techPromptProject}
          onClose={() => setTechPromptProject(null)}
          techResponseNote={techResponseNote}
          setTechResponseNote={setTechResponseNote}
          onRespond={handleTechRespond}
        />
      )}

      {/* Incharge Confirm Modal */}
      {inchargeConfirmProject && (
        <InchargeConfirmModal
          project={inchargeConfirmProject}
          onClose={() => setInchargeConfirmProject(null)}
          inchargeNote={inchargeNote}
          setInchargeNote={setInchargeNote}
          onConfirm={handleInchargeConfirm}
        />
      )}

      {/* Progress Note Modal */}
      {progressProject && (
        <ProgressNoteModal
          project={progressProject}
          onClose={() => setProgressProject(null)}
          newProgressNote={newProgressNote}
          setNewProgressNote={setNewProgressNote}
          onSubmit={handleAddProgress}
        />
      )}

      {/* Project Print Modal */}
      <ProjectPrintModal
        isOpen={!!printProject}
        onClose={() => setPrintProject(null)}
        project={printProject}
      />

      {/* Technician Wallet Modal */}
      <TechWalletModal
        isOpen={isTechWalletOpen}
        onClose={() => setIsTechWalletOpen(false)}
        onRefreshProjects={loadData}
      />

      {/* Manage Service Presets Modal (RULE 3) */}
      <ManageServicePresetsModal
        isOpen={isManagePresetsOpen}
        onClose={() => setIsManagePresetsOpen(false)}
      />

      {/* Manage Job Types Modal (RULE 3) */}
      <ManageJobTypesModal
        isOpen={isManageJobTypesOpen}
        onClose={() => setIsManageJobTypesOpen(false)}
      />
    </div>
  );
}
