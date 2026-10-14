import React from 'react';
import WorkOrderHeader from './work-order/WorkOrderHeader';
import WorkOrderScopeBanner from './work-order/WorkOrderScopeBanner';
import WorkOrderPartyDetails from './work-order/WorkOrderPartyDetails';
import WorkOrderEquipmentTable from './work-order/WorkOrderEquipmentTable';
import WorkOrderServicesTable from './work-order/WorkOrderServicesTable';
import WorkOrderJobNotes from './work-order/WorkOrderJobNotes';
import WorkOrderFinancialSummary from './work-order/WorkOrderFinancialSummary';
import WorkOrderHandoverTerms from './work-order/WorkOrderHandoverTerms';
import WorkOrderSignaturesFooter from './work-order/WorkOrderSignaturesFooter';

export default function A4WorkOrderSheet({
  project = {},
  shop = {},
  layout,
  jobDateStr,
  startDateStr,
  printDateStr,
  setup = 0,
  conv = 0,
  meal = 0,
  totalTechPayout = 0,
  customerBill = 0,
  equipmentList = [],
  servicesList = [],
}) {
  const isCustomerCopy = layout === 'a4_customer';

  return (
    <div
      style={{
        border: '1.5px solid #0f172a',
        borderRadius: '4px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        background: '#ffffff',
        minHeight: '272mm',
        maxHeight: '275mm',
      }}
    >
      {/* Upper Content Section */}
      <div>
        {/* 1. TOP HEADER & CORPORATE BRANDING */}
        <WorkOrderHeader
          shop={shop}
          isCustomerCopy={isCustomerCopy}
          project={project}
          jobDateStr={jobDateStr}
        />

        {/* 2. JOB TITLE & SCOPE BANNER */}
        <WorkOrderScopeBanner project={project} />

        {/* 3. TWO-COLUMN: CLIENT & TECHNICIAN INFORMATION */}
        <WorkOrderPartyDetails project={project} startDateStr={startDateStr} />

        {/* 4. INSTALLATION CHECKLIST & EQUIPMENT */}
        <WorkOrderEquipmentTable equipmentList={equipmentList} />

        {/* 4.1 SERVICES / TASKS BREAKDOWN */}
        <WorkOrderServicesTable
          servicesList={servicesList}
          equipmentList={equipmentList}
        />

        {/* 5. JOB DESCRIPTION / SPECIAL NOTES */}
        <WorkOrderJobNotes description={project?.description} />

        {/* 6. FINANCIAL & BILLING TERMS */}
        <WorkOrderFinancialSummary
          isCustomerCopy={isCustomerCopy}
          setup={setup}
          conv={conv}
          meal={meal}
          totalTechPayout={totalTechPayout}
          customerBill={customerBill}
          project={project}
        />

        {/* 7. CUSTOMER HANDOVER & WARRANTY TERMS */}
        <WorkOrderHandoverTerms />
      </div>

      {/* 8. SIGNATURE SECTION & FOOTER */}
      <WorkOrderSignaturesFooter
        project={project}
        printDateStr={printDateStr}
        shop={shop}
      />
    </div>
  );
}
