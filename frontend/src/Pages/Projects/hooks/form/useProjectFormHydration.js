import { useEffect } from 'react';
import { cleanSitePhone } from '../../utils/projectHelpers';
import { DEFAULT_SERVICE_ROW } from './useProjectServices';

export default function useProjectFormHydration({
  isOpen,
  projectToEdit,
  fetchInitialLookups,
  formState,
  setServices,
}) {
  const {
    setTitle,
    setProjectType,
    setSelectedInvoice,
    setCustomerName,
    setSitePhone,
    setSiteAddress,
    setTechnicianId,
    setConveyanceCost,
    setMealAllowance,
    setCustomerBillingAmount,
    setEquipmentDetails,
    setDescription,
    setStartDate,
    setDeadline,
  } = formState;

  useEffect(() => {
    if (isOpen) {
      fetchInitialLookups();

      if (projectToEdit) {
        setTitle(projectToEdit.title || '');
        setProjectType(projectToEdit.project_type || 'CCTV Installation');
        setCustomerName(projectToEdit.customer_name || '');
        setSitePhone(cleanSitePhone(projectToEdit.site_phone || ''));
        setSiteAddress(projectToEdit.site_address || '');
        setTechnicianId(projectToEdit.technician_id ? String(projectToEdit.technician_id) : '');
        setConveyanceCost(Number(projectToEdit.conveyance || projectToEdit.conveyance_cost || 0));
        setMealAllowance(Number(projectToEdit.meal_allowance || 0));
        setCustomerBillingAmount(Number(projectToEdit.customer_billing_amount || 0));
        setDescription(projectToEdit.description || '');
        setStartDate(
          projectToEdit.start_date
            ? String(projectToEdit.start_date).split('T')[0]
            : new Date().toISOString().split('T')[0]
        );
        setDeadline(projectToEdit.deadline ? String(projectToEdit.deadline).split('T')[0] : '');
        setEquipmentDetails(projectToEdit.equipment_details || []);

        if (
          projectToEdit.services &&
          Array.isArray(projectToEdit.services) &&
          projectToEdit.services.length > 0
        ) {
          setServices(
            projectToEdit.services.map((s, idx) => ({
              id: s.id || idx + 1,
              service_name: s.service_name || 'Service Task',
              quantity: Number(s.quantity || 1),
              unit_rate: Number(s.unit_rate || 0),
              line_total: Number(
                s.line_total || Number(s.quantity || 1) * Number(s.unit_rate || 0)
              ),
              notes: s.notes || '',
            }))
          );
        } else {
          const sFee = Number(projectToEdit.setup_fee || projectToEdit.setup_charge || 0);
          const dQty = Number(projectToEdit.device_qty || 1);
          setServices([
            {
              id: 1,
              service_name: projectToEdit.title || 'Setup / Installation Service',
              quantity: dQty,
              unit_rate: dQty > 0 ? Math.round(sFee / dQty) : sFee,
              line_total: sFee,
              notes: '',
            },
          ]);
        }
      } else {
        // Default form state for new work order
        setTitle('');
        setProjectType('CCTV Installation');
        setSelectedInvoice(null);
        setCustomerName('');
        setSitePhone('');
        setSiteAddress('');
        setTechnicianId('');
        setConveyanceCost(300);
        setMealAllowance(200);
        setCustomerBillingAmount(2500);
        setEquipmentDetails([]);
        setDescription('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setDeadline('');
        setServices([DEFAULT_SERVICE_ROW]);
      }
    }
  }, [isOpen, projectToEdit, fetchInitialLookups, setServices]);
}
