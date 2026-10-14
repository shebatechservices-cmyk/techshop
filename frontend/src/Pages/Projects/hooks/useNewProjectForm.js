import { useState, useEffect } from 'react';
import { smartFetch } from '../../../services/api';
import {
  cleanSitePhone,
  isValidBangladeshiPhone,
  formatToE164Phone,
} from '../utils/projectHelpers';
import useProjectLookups from './form/useProjectLookups';
import useProjectServices, { DEFAULT_SERVICE_ROW } from './form/useProjectServices';

/**
 * Top-level form orchestrator hook for Create/Edit Project Work Order.
 */
export default function useNewProjectForm({ isOpen, onClose, onSuccess, projectToEdit }) {
  const isEditMode = Boolean(projectToEdit);

  // Tab & Lookups sub-hook
  const lookups = useProjectLookups();
  const {
    invoices,
    technicians,
    setTechnicians,
    servicePresets,
    jobTypes,
    loadingLookups,
    isAddTechOpen,
    setIsAddTechOpen,
    isManagePresetsOpen,
    setIsManagePresetsOpen,
    isManageJobTypesOpen,
    setIsManageJobTypesOpen,
    fetchServicePresets,
    fetchJobTypes,
    fetchTechnicians,
    fetchInitialLookups,
  } = lookups;

  // Form field states
  const [projectCategory, setProjectCategory] = useState('new_setup'); // 'new_setup' | 'old_repair'
  const [title, setTitle] = useState('');
  const [projectType, setProjectType] = useState('CCTV Installation');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [sitePhone, setSitePhone] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [technicianId, setTechnicianId] = useState('');

  const [conveyanceCost, setConveyanceCost] = useState(300);
  const [mealAllowance, setMealAllowance] = useState(200);
  const [customerBillingAmount, setCustomerBillingAmount] = useState(2500);
  const [equipmentDetails, setEquipmentDetails] = useState([]);
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Services / Tasks sub-hook
  const servicesHook = useProjectServices({ conveyanceCost, mealAllowance });
  const {
    services,
    setServices,
    handleAddServiceRow,
    handleUpdateServiceRow,
    handleApplyPresetToRow,
    handleRemoveServiceRow,
    totalSetupFee,
    totalDeviceCount,
    totalTechnicianPayout,
  } = servicesHook;

  // Reset or initialize form data based on open status and projectToEdit
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
        setStartDate(projectToEdit.start_date ? String(projectToEdit.start_date).split('T')[0] : new Date().toISOString().split('T')[0]);
        setDeadline(projectToEdit.deadline ? String(projectToEdit.deadline).split('T')[0] : '');
        setEquipmentDetails(projectToEdit.equipment_details || []);

        if (projectToEdit.services && Array.isArray(projectToEdit.services) && projectToEdit.services.length > 0) {
          setServices(
            projectToEdit.services.map((s, idx) => ({
              id: s.id || idx + 1,
              service_name: s.service_name || 'Service Task',
              quantity: Number(s.quantity || 1),
              unit_rate: Number(s.unit_rate || 0),
              line_total: Number(s.line_total || Number(s.quantity || 1) * Number(s.unit_rate || 0)),
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
    if (!title.trim()) {
      alert('Please enter a project title.');
      return;
    }

    const cleanPhone = cleanSitePhone(sitePhone);
    if (cleanPhone && !isValidBangladeshiPhone(cleanPhone)) {
      alert('Please enter a valid 11-digit Bangladeshi phone number starting with 0 (e.g. 017XXXXXXXX).');
      return;
    }
    const formattedSitePhone = formatToE164Phone(cleanPhone);

    try {
      setSubmitting(true);
      const payload = {
        title,
        project_category: projectCategory,
        project_type: projectType,
        invoice_id: selectedInvoice ? selectedInvoice.id : projectToEdit ? projectToEdit.invoice_id : null,
        invoice_no: selectedInvoice ? selectedInvoice.invoice_no : projectToEdit ? projectToEdit.invoice_no : null,
        customer_id: selectedInvoice ? selectedInvoice.customer_id : projectToEdit ? projectToEdit.customer_id : null,
        customer_name: customerName,
        site_phone: formattedSitePhone,
        site_address: siteAddress,
        technician_id: technicianId ? Number(technicianId) : null,
        services: services.map((s) => ({
          service_name: s.service_name || 'Setup Service',
          quantity: Number(s.quantity || 1),
          unit_rate: Number(s.unit_rate || 0),
          line_total: Number(s.line_total || 0),
          notes: s.notes || '',
        })),
        device_qty: totalDeviceCount || 1,
        per_unit_rate: totalDeviceCount > 0 ? totalSetupFee / totalDeviceCount : 0,
        setup_fee: totalSetupFee,
        setup_charge: totalSetupFee,
        conveyance: Number(conveyanceCost || 0),
        conveyance_cost: Number(conveyanceCost || 0),
        meal_allowance: Number(mealAllowance || 0),
        customer_billing_amount: Number(customerBillingAmount || 0),
        equipment_details: equipmentDetails,
        description,
        start_date: startDate,
        deadline: deadline || null,
      };

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
    projectCategory,
    setProjectCategory,
    invoices,
    technicians,
    servicePresets,
    fetchServicePresets,
    jobTypes,
    fetchJobTypes,
    loadingLookups,
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
    equipmentDetails,
    setEquipmentDetails,
    description,
    setDescription,
    startDate,
    setStartDate,
    deadline,
    setDeadline,
    submitting,
    totalSetupFee,
    totalDeviceCount,
    totalTechnicianPayout,
    handleSelectInvoice,
    handleTechAdded,
    handleSubmit,
  };
}
