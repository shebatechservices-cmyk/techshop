import React from 'react';
import ProjectSourceCell from './ProjectSourceCell';
import ProjectCustomerSiteCell from './ProjectCustomerSiteCell';
import ProjectTechnicianCell from './ProjectTechnicianCell';
import ProjectFinancialStatusCell from './ProjectFinancialStatusCell';
import ProjectPipelineStatusCell from './ProjectPipelineStatusCell';
import ProjectActionButtonsCell from './ProjectActionButtonsCell';

export default function ProjectsTableRow({
  project: p,
  isTechnician,
  onTechPrompt,
  onInchargeConfirm,
  onAddProgress,
  onComplete,
  onReopen,
  onEdit,
  onPrint,
  onDelete,
  onAdminRespondRejection,
}) {
  const setup = parseFloat(p.setup_fee || p.setup_charge || 0);
  const conv = parseFloat(p.conveyance || p.conveyance_cost || 0);
  const meal = parseFloat(p.meal_allowance || 0);
  const totalTechPayout =
    setup + conv + meal > 0
      ? setup + conv + meal
      : parseFloat(p.charges || 0);
  const customerBill = parseFloat(p.customer_billing_amount || 0);

  const isAssigned =
    p.technician_status === 'assigned' || p.status === 'assigned';
  const isAccepted =
    p.technician_status === 'accepted' ||
    p.status === 'awaiting_incharge_confirmation';
  const isRejectionRequested =
    p.technician_status === 'rejection_requested' ||
    p.status === 'rejection_requested';
  const isInProgress =
    p.technician_status === 'in_progress' ||
    p.status === 'in_progress';
  const isCompleted = p.status === 'completed';

  return (
    <tr className="hover:bg-slate-50/70 transition-colors bg-white">
      <ProjectSourceCell project={p} />
      <ProjectCustomerSiteCell project={p} />
      {!isTechnician && <ProjectTechnicianCell project={p} />}
      <ProjectFinancialStatusCell
        totalTechPayout={totalTechPayout}
        setup={setup}
        conv={conv}
        meal={meal}
        customerBill={customerBill}
        isTechnician={isTechnician}
      />
      <ProjectPipelineStatusCell
        isCompleted={isCompleted}
        isRejectionRequested={isRejectionRequested}
        isInProgress={isInProgress}
        isAccepted={isAccepted}
        progressNote={p.progress_note}
      />
      <ProjectActionButtonsCell
        project={p}
        isTechnician={isTechnician}
        isRejectionRequested={isRejectionRequested}
        isCompleted={isCompleted}
        isAssigned={isAssigned}
        isAccepted={isAccepted}
        isInProgress={isInProgress}
        onAdminRespondRejection={onAdminRespondRejection}
        onEdit={onEdit}
        onTechPrompt={onTechPrompt}
        onInchargeConfirm={onInchargeConfirm}
        onAddProgress={onAddProgress}
        onComplete={onComplete}
        onReopen={onReopen}
        onPrint={onPrint}
        onDelete={onDelete}
      />
    </tr>
  );
}
