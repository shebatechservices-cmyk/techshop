import React from 'react';
import AddTechnicianModal from './AddTechnicianModal';
import ManageServicePresetsModal from './ManageServicePresetsModal';
import ManageJobTypesModal from './ManageJobTypesModal';
import useNewProjectForm from '../hooks/useNewProjectForm';
import NewProjectModalHeader from '../components/new-project/NewProjectModalHeader';
import NewProjectCategorySelector from '../components/new-project/NewProjectCategorySelector';
import NewProjectInvoiceSelector from '../components/new-project/NewProjectInvoiceSelector';
import NewProjectBasicDetails from '../components/new-project/NewProjectBasicDetails';
import NewProjectServiceTasksTable from '../components/new-project/NewProjectServiceTasksTable';
import NewProjectRemunerationSummary from '../components/new-project/NewProjectRemunerationSummary';
import NewProjectTechnicianAndSchedule from '../components/new-project/NewProjectTechnicianAndSchedule';
import NewProjectModalFooter from '../components/new-project/NewProjectModalFooter';

export default function NewProjectModal({ isOpen, onClose, onSuccess, projectToEdit = null }) {
  const {
    isEditMode,
    projectCategory,
    setProjectCategory,
    invoices,
    technicians,
    servicePresets,
    fetchServicePresets,
    jobTypes,
    fetchJobTypes,
    isAddTechOpen,
    setIsAddTechOpen,
    isManagePresetsOpen,
    setIsManagePresetsOpen,
    isManageJobTypesOpen,
    setIsManageJobTypesOpen,
    title,
    setTitle,
    projectType,
    setProjectType,
    selectedInvoice,
    customerName,
    setCustomerName,
    sitePhone,
    setSitePhone,
    siteAddress,
    setSiteAddress,
    technicianId,
    setTechnicianId,
    services,
    handleAddServiceRow,
    handleUpdateServiceRow,
    handleApplyPresetToRow,
    handleRemoveServiceRow,
    conveyanceCost,
    setConveyanceCost,
    mealAllowance,
    setMealAllowance,
    customerBillingAmount,
    setCustomerBillingAmount,
    setEquipmentDetails,
    description,
    setDescription,
    startDate,
    setStartDate,
    deadline,
    setDeadline,
    submitting,
    totalSetupFee,
    totalTechnicianPayout,
    handleSelectInvoice,
    handleTechAdded,
    handleSubmit
  } = useNewProjectForm({ isOpen, onClose, onSuccess, projectToEdit });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <NewProjectModalHeader
          isEditMode={isEditMode}
          projectCode={projectToEdit?.project_code}
          onClose={onClose}
        />

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Category Switcher Pills (Only in create mode) */}
          {!isEditMode && (
            <NewProjectCategorySelector
              projectCategory={projectCategory}
              setProjectCategory={setProjectCategory}
              setProjectType={setProjectType}
              setSelectedInvoice={handleSelectInvoice}
              setEquipmentDetails={setEquipmentDetails}
            />
          )}

          <form onSubmit={handleSubmit}>
            {/* Invoice Reference (Only for New Setup in Create Mode) */}
            {!isEditMode && projectCategory === 'new_setup' && (
              <NewProjectInvoiceSelector
                invoices={invoices}
                selectedInvoice={selectedInvoice}
                onSelectInvoice={handleSelectInvoice}
              />
            )}

            {/* Basic Project & Customer Details */}
            <NewProjectBasicDetails
              title={title}
              setTitle={setTitle}
              customerName={customerName}
              setCustomerName={setCustomerName}
              sitePhone={sitePhone}
              setSitePhone={setSitePhone}
              projectType={projectType}
              setProjectType={setProjectType}
              siteAddress={siteAddress}
              setSiteAddress={setSiteAddress}
              jobTypes={jobTypes}
              onOpenManageJobTypes={() => setIsManageJobTypesOpen(true)}
            />

            {/* Dynamic Services & Tasks Table */}
            <NewProjectServiceTasksTable
              services={services}
              servicePresets={servicePresets}
              totalSetupFee={totalSetupFee}
              onAddServiceRow={handleAddServiceRow}
              onUpdateServiceRow={handleUpdateServiceRow}
              onApplyPresetToRow={handleApplyPresetToRow}
              onRemoveServiceRow={handleRemoveServiceRow}
              onOpenManagePresets={() => setIsManagePresetsOpen(true)}
            />

            {/* Remunerations & Billing Summary */}
            <NewProjectRemunerationSummary
              conveyanceCost={conveyanceCost}
              setConveyanceCost={setConveyanceCost}
              mealAllowance={mealAllowance}
              setMealAllowance={setMealAllowance}
              customerBillingAmount={customerBillingAmount}
              setCustomerBillingAmount={setCustomerBillingAmount}
              totalTechnicianPayout={totalTechnicianPayout}
            />

            {/* Technician Assignment & Schedule */}
            <NewProjectTechnicianAndSchedule
              technicians={technicians}
              technicianId={technicianId}
              setTechnicianId={setTechnicianId}
              onOpenAddTech={() => setIsAddTechOpen(true)}
              startDate={startDate}
              setStartDate={setStartDate}
              deadline={deadline}
              setDeadline={setDeadline}
              description={description}
              setDescription={setDescription}
            />

            {/* Footer Buttons */}
            <NewProjectModalFooter
              isEditMode={isEditMode}
              submitting={submitting}
              onClose={onClose}
            />
          </form>
        </div>
      </div>

      {/* Quick Add Technician Modal */}
      <AddTechnicianModal
        isOpen={isAddTechOpen}
        onClose={() => setIsAddTechOpen(false)}
        onTechnicianAdded={handleTechAdded}
      />

      {/* Manage Service Presets Modal (RULE 3) */}
      <ManageServicePresetsModal
        isOpen={isManagePresetsOpen}
        onClose={() => setIsManagePresetsOpen(false)}
        onPresetsUpdated={() => fetchServicePresets()}
      />

      {/* Manage Job Types Modal (RULE 3) */}
      <ManageJobTypesModal
        isOpen={isManageJobTypesOpen}
        onClose={() => setIsManageJobTypesOpen(false)}
        onJobTypesUpdated={() => fetchJobTypes()}
      />
    </div>
  );
}
