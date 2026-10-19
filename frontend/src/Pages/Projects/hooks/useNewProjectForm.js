import { smartFetch } from '../../../services/api';
import { cleanSitePhone } from '../utils/projectHelpers';
import useProjectLookups from './form/useProjectLookups';
import useProjectServices from './form/useProjectServices';
import useProjectFormState from './form/useProjectFormState';
import useProjectFormHydration from './form/useProjectFormHydration';
import { validateAndBuildProjectPayload } from './form/projectPayloadHelper';

/**
 * Top-level form orchestrator hook for Create/Edit Project Work Order.
 */
export default function useNewProjectForm({ isOpen, onClose, onSuccess, projectToEdit }) {
  const isEditMode = Boolean(projectToEdit);

  // Tab & Lookups sub-hook
  const lookups = useProjectLookups();
  const {
    invoices,
    setTechnicians,
    fetchTechnicians,
    fetchInitialLookups,
  } = lookups;

  // Form field state sub-hook
  const formState = useProjectFormState();
  const {
    selectedInvoice,
    setSelectedInvoice,
    setTitle,
    setCustomerName,
    setSitePhone,
    setSiteAddress,
    setTechnicianId,
    conveyanceCost,
    mealAllowance,
    setCustomerBillingAmount,
    setEquipmentDetails,
    setSubmitting,
  } = formState;

  // Dynamic Services / Tasks sub-hook
  const servicesHook = useProjectServices({ conveyanceCost, mealAllowance });
  const {
    services,
    setServices,
    totalSetupFee,
    totalDeviceCount,
  } = servicesHook;

  // Reset or initialize form data based on open status and projectToEdit
  useProjectFormHydration({
    isOpen,
    projectToEdit,
    fetchInitialLookups,
    formState,
    setServices,
  });

  // Handle invoice attachment
  const handleSelectInvoice = (invId) => {
    if (!invId) {
      setSelectedInvoice(null);
      return;
    }
    const inv = invoices.find((i) => String(i.id) === String(invId));
    if (inv) {
      setSelectedInvoice(inv);
      setTitle(`${inv.customer_name} - New CCTV Setup (${inv.invoice_no})`);
      setCustomerName(inv.customer_name || '');
      setSitePhone(cleanSitePhone(inv.customer_phone || ''));
      setSiteAddress(inv.customer_address || '');

      if (Number(inv.setup_charge) > 0) {
        setCustomerBillingAmount(Number(inv.setup_charge));
      }

      const itemsList = (inv.items || []).map((it) => ({
        product_name: it.product_name,
        quantity: it.quantity,
        unit_price: it.unit_price,
      }));
      setEquipmentDetails(itemsList);

      const totalItemsCount = itemsList.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);
      const invSetupCharge = Number(inv.setup_charge || 1500);
      setServices([
        {
          id: Date.now(),
          service_name: 'CCTV Camera Installation & Wiring',
          quantity: totalItemsCount || 1,
          unit_rate: totalItemsCount > 0 ? Math.round(invSetupCharge / totalItemsCount) : invSetupCharge,
          line_total: invSetupCharge,
          notes: '',
        },
      ]);
    } else {
      setSelectedInvoice(null);
    }
  };

  // Handle newly created technician from Quick Add modal
  const handleTechAdded = async (newTech) => {
    if (!newTech) return;
    const newId = String(newTech.id);

    const techObj = {
      id: newTech.id,
      name: newTech.name,
      contact: newTech.phone || newTech.email || '',
      phone: newTech.phone || '',
      role_title: newTech.role_name || newTech.designation || 'Technician',
      designation: newTech.designation || 'Field Technician',
      wallet_balance: 0,
    };

    setTechnicians((prev) => {
      const exists = prev.some((t) => String(t.id) === newId);
      return exists ? prev : [techObj, ...prev];
    });

    setTechnicianId(newId);

    const serverList = await fetchTechnicians();
    if (serverList && Array.isArray(serverList)) {
      const found = serverList.some((t) => String(t.id) === newId);
      if (!found) {
        setTechnicians((prev) => [techObj, ...prev.filter((t) => String(t.id) !== newId)]);
      }
    }
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const { error, payload } = validateAndBuildProjectPayload({
      formState,
      services,
      totalDeviceCount,
      totalSetupFee,
      selectedInvoice,
      projectToEdit,
      isEditMode,
    });

    if (error) {
      alert(error);
      return;
    }

    try {
      setSubmitting(true);
      const path = isEditMode ? `/projects/${projectToEdit.id}` : '/projects';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await smartFetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || (isEditMode ? 'Work order updated successfully!' : 'Project created and assigned successfully!'));
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else {
        alert(data.message || 'Failed to save project.');
      }
    } catch (err) {
      console.error(err);
      alert('Server error saving project.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    isEditMode,
    ...lookups,
    ...formState,
    ...servicesHook,
    handleSelectInvoice,
    handleTechAdded,
    handleSubmit,
  };
}
