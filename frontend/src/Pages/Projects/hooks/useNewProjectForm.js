import { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../../../services/api';
import {
  cleanSitePhone,
  isValidBangladeshiPhone,
  formatToE164Phone,
  calculateServicesTotal,
  calculateTotalDeviceCount,
  calculateTotalTechnicianPayout
} from '../utils/projectHelpers';

export default function useNewProjectForm({ isOpen, onClose, onSuccess, projectToEdit }) {
  const isEditMode = Boolean(projectToEdit);

  // Tab & lookup states
  const [projectCategory, setProjectCategory] = useState('new_setup'); // 'new_setup' | 'old_repair'
  const [invoices, setInvoices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [servicePresets, setServicePresets] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [isAddTechOpen, setIsAddTechOpen] = useState(false);
  const [isManagePresetsOpen, setIsManagePresetsOpen] = useState(false);
  const [isManageJobTypesOpen, setIsManageJobTypesOpen] = useState(false);

  // Form field states
  const [title, setTitle] = useState('');
  const [projectType, setProjectType] = useState('CCTV Installation');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [sitePhone, setSitePhone] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [technicianId, setTechnicianId] = useState('');

  // Dynamic Services / Tasks array
  const [services, setServices] = useState([
    { id: 1, service_name: 'CCTV Camera Setup', quantity: 1, unit_rate: 1500, line_total: 1500, notes: '' }
  ]);

  const [conveyanceCost, setConveyanceCost] = useState(300);
  const [mealAllowance, setMealAllowance] = useState(200);
  const [customerBillingAmount, setCustomerBillingAmount] = useState(2500);
  const [equipmentDetails, setEquipmentDetails] = useState([]);
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch service presets from backend (RULE 2)
  const fetchServicePresets = useCallback(async () => {
    try {
      const res = await fetch(`${API}/projects/service-presets?active_only=true`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setServicePresets(json.data);
          return json.data;
        }
      }
    } catch (err) {
      console.error('Error fetching service presets:', err);
    }
    return null;
  }, []);

  // Fetch job types from backend (RULE 2)
  const fetchJobTypes = useCallback(async () => {
    try {
      const res = await fetch(`${API}/projects/job-types?active_only=true`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setJobTypes(json.data);
          return json.data;
        }
      }
    } catch (err) {
      console.error('Error fetching job types:', err);
    }
    return null;
  }, []);

  // Fetch technicians lookup from backend
  const fetchTechnicians = useCallback(async () => {
    try {
      const techRes = await fetch(`${API}/projects/technicians-lookup`);
      if (techRes.ok) {
        const tData = await techRes.json();
        if (tData.success && Array.isArray(tData.data)) {
          setTechnicians(tData.data);
          return tData.data;
        }
      }
    } catch (err) {
      console.error('Error fetching technicians lookup:', err);
    }
    return null;
  }, []);

  // Reset or initialize form data based on open status and projectToEdit
  useEffect(() => {
    if (isOpen) {
      setLoadingLookups(true);
      Promise.all([
        fetch(`${API}/projects/invoices-lookup`).catch(() => null),
        fetchTechnicians(),
        fetchServicePresets(),
        fetchJobTypes()
      ])
        .then(async ([invRes]) => {
          if (invRes && invRes.ok) {
            const iData = await invRes.json();
            if (iData.success) setInvoices(iData.data || []);
          }
        })
        .finally(() => setLoadingLookups(false));

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
          setServices(projectToEdit.services.map((s, idx) => ({
            id: s.id || (idx + 1),
            service_name: s.service_name || 'Service Task',
            quantity: Number(s.quantity || 1),
            unit_rate: Number(s.unit_rate || 0),
            line_total: Number(s.line_total || (Number(s.quantity || 1) * Number(s.unit_rate || 0))),
            notes: s.notes || ''
          })));
        } else {
          const sFee = Number(projectToEdit.setup_fee || projectToEdit.setup_charge || 0);
          const dQty = Number(projectToEdit.device_qty || 1);
          setServices([{
            id: 1,
            service_name: projectToEdit.title || 'Setup / Installation Service',
            quantity: dQty,
            unit_rate: dQty > 0 ? Math.round(sFee / dQty) : sFee,
            line_total: sFee,
            notes: ''
          }]);
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
        setServices([
          { id: 1, service_name: 'CCTV Camera Setup', quantity: 1, unit_rate: 1500, line_total: 1500, notes: '' }
        ]);
      }
    }
  }, [isOpen, projectToEdit, fetchTechnicians]);

  // Handle invoice attachment
  const handleSelectInvoice = (invId) => {
    if (!invId) {
      setSelectedInvoice(null);
      return;
    }
    const inv = invoices.find(i => String(i.id) === String(invId));
    if (inv) {
      setSelectedInvoice(inv);
      setTitle(`${inv.customer_name} - New CCTV Setup (${inv.invoice_no})`);
      setCustomerName(inv.customer_name || '');
      setSitePhone(cleanSitePhone(inv.customer_phone || ''));
      setSiteAddress(inv.customer_address || '');
      
      if (Number(inv.setup_charge) > 0) {
        setCustomerBillingAmount(Number(inv.setup_charge));
      }

      const itemsList = (inv.items || []).map(it => ({
        product_name: it.product_name,
        quantity: it.quantity,
        unit_price: it.unit_price
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
          notes: ''
        }
      ]);
    } else {
      setSelectedInvoice(null);
    }
  };

  // Dynamic Service Rows Handlers
  const handleAddServiceRow = (presetName = '', defaultRate = 500) => {
    const newId = Date.now() + Math.random();
    setServices(prev => [
      ...prev,
      {
        id: newId,
        service_name: presetName || '',
        quantity: 1,
        unit_rate: defaultRate,
        line_total: defaultRate,
        notes: ''
      }
    ]);
  };

  const handleUpdateServiceRow = (id, field, value) => {
    setServices(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      if (field === 'quantity' || field === 'unit_rate') {
        const q = field === 'quantity' ? (parseInt(value, 10) || 0) : Number(s.quantity || 0);
        const r = field === 'unit_rate' ? (parseFloat(value) || 0) : Number(s.unit_rate || 0);
        updated.line_total = q * r;
      }
      return updated;
    }));
  };

  const handleApplyPresetToRow = (id, presetName, defaultRate) => {
    setServices(prev => prev.map(s => {
      if (s.id !== id) return s;
      const qty = parseInt(s.quantity, 10) || 1;
      const rate = parseFloat(defaultRate) || 0;
      return {
        ...s,
        service_name: presetName,
        unit_rate: rate,
        line_total: qty * rate
      };
    }));
  };

  const handleRemoveServiceRow = (id) => {
    if (services.length <= 1) {
      setServices([{ id: Date.now(), service_name: '', quantity: 1, unit_rate: 0, line_total: 0, notes: '' }]);
      return;
    }
    setServices(prev => prev.filter(s => s.id !== id));
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
      wallet_balance: 0
    };

    setTechnicians(prev => {
      const exists = prev.some(t => String(t.id) === newId);
      return exists ? prev : [techObj, ...prev];
    });

    setTechnicianId(newId);

    const serverList = await fetchTechnicians();
    if (serverList && Array.isArray(serverList)) {
      const found = serverList.some(t => String(t.id) === newId);
      if (!found) {
        setTechnicians(prev => [techObj, ...prev.filter(t => String(t.id) !== newId)]);
      }
    }
  };

  // Calculated values derived dynamically in real-time
  const totalSetupFee = useMemo(() => calculateServicesTotal(services), [services]);
  const totalDeviceCount = useMemo(() => calculateTotalDeviceCount(services), [services]);
  const totalTechnicianPayout = useMemo(
    () => calculateTotalTechnicianPayout(totalSetupFee, conveyanceCost, mealAllowance),
    [totalSetupFee, conveyanceCost, mealAllowance]
  );

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
        invoice_id: selectedInvoice ? selectedInvoice.id : (projectToEdit ? projectToEdit.invoice_id : null),
        invoice_no: selectedInvoice ? selectedInvoice.invoice_no : (projectToEdit ? projectToEdit.invoice_no : null),
        customer_id: selectedInvoice ? selectedInvoice.customer_id : (projectToEdit ? projectToEdit.customer_id : null),
        customer_name: customerName,
        site_phone: formattedSitePhone,
        site_address: siteAddress,
        technician_id: technicianId ? Number(technicianId) : null,
        services: services.map(s => ({
          service_name: s.service_name || 'Setup Service',
          quantity: Number(s.quantity || 1),
          unit_rate: Number(s.unit_rate || 0),
          line_total: Number(s.line_total || 0),
          notes: s.notes || ''
        })),
        device_qty: totalDeviceCount || 1,
        per_unit_rate: totalDeviceCount > 0 ? (totalSetupFee / totalDeviceCount) : 0,
        setup_fee: totalSetupFee,
        setup_charge: totalSetupFee,
        conveyance: Number(conveyanceCost || 0),
        conveyance_cost: Number(conveyanceCost || 0),
        meal_allowance: Number(mealAllowance || 0),
        customer_billing_amount: Number(customerBillingAmount || 0),
        equipment_details: equipmentDetails,
        description,
        start_date: startDate,
        deadline: deadline || null
      };

      const url = isEditMode ? `${API}/projects/${projectToEdit.id}` : `${API}/projects`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
    handleSubmit
  };
}
