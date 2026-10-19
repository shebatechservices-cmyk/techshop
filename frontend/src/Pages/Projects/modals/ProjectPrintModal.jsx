import React, { useState } from 'react';
import { getPrintStyles } from './print/styles/printStyles';
import A4WorkOrderSheet from './print/layouts/A4WorkOrderSheet';
import PosThermalLayout from './print/layouts/PosThermalLayout';
import ProjectPrintToolbar from './print/ProjectPrintToolbar';
import useProjectPrintData from './print/useProjectPrintData';

export default function ProjectPrintModal({ isOpen, onClose, project }) {
  const [layout, setLayout] = useState('a4_jobcard');
  const printData = useProjectPrintData(isOpen, project);

  if (!isOpen || !project) return null;

  const {
    shop,
    setup,
    conv,
    meal,
    totalTechPayout,
    customerBill,
    equipmentList,
    servicesList,
    printDateStr,
    jobDateStr,
    startDateStr,
  } = printData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="project-print-modal-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      {/* Print Specific CSS Rules */}
      <style>{getPrintStyles(layout)}</style>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: layout === 'pos_thermal' ? '460px' : '900px',
          maxHeight: '96vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          transition: 'max-width 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ProjectPrintToolbar
          project={project}
          layout={layout}
          setLayout={setLayout}
          onPrint={handlePrint}
          onClose={onClose}
        />

        {/* PRINTABLE PREVIEW CONTAINER */}
        <div className="project-print-preview-container">
          <div
            id="project-print-sheet"
            style={{
              background: '#ffffff',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
              borderRadius: layout === 'pos_thermal' ? '4px' : '6px',
              width: layout === 'pos_thermal' ? '320px' : '100%',
              maxWidth: layout === 'pos_thermal' ? '320px' : '780px',
              fontFamily:
                layout === 'pos_thermal'
                  ? 'monospace, Courier, sans-serif'
                  : 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
              color: '#0f172a',
              boxSizing: 'border-box',
            }}
          >
            {layout !== 'pos_thermal' ? (
              <A4WorkOrderSheet
                project={project}
                shop={shop}
                layout={layout}
                jobDateStr={jobDateStr}
                startDateStr={startDateStr}
                printDateStr={printDateStr}
                setup={setup}
                conv={conv}
                meal={meal}
                totalTechPayout={totalTechPayout}
                customerBill={customerBill}
                equipmentList={equipmentList}
                servicesList={servicesList}
              />
            ) : (
              <PosThermalLayout
                project={project}
                shop={shop}
                jobDateStr={jobDateStr}
                setup={setup}
                conv={conv}
                meal={meal}
                totalTechPayout={totalTechPayout}
                customerBill={customerBill}
                equipmentList={equipmentList}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
