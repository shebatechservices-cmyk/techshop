import {
  cleanSitePhone,
  isValidBangladeshiPhone,
  formatToE164Phone,
} from '../../utils/projectHelpers';

export function validateAndBuildProjectPayload({
  formState,
  services,
  totalDeviceCount,
  totalSetupFee,
  selectedInvoice,
  projectToEdit,
  isEditMode,
}) {
  const {
    title,
    projectCategory,
    projectType,
    customerName,
    sitePhone,
    siteAddress,
    technicianId,
    conveyanceCost,
    mealAllowance,
    customerBillingAmount,
    equipmentDetails,
    description,
    startDate,
    deadline,
  } = formState;

  if (!title.trim()) {
    return { error: 'Please enter a project title.' };
  }

  const cleanPhone = cleanSitePhone(sitePhone);
  if (cleanPhone && !isValidBangladeshiPhone(cleanPhone)) {
    return {
      error:
        'Please enter a valid 11-digit Bangladeshi phone number starting with 0 (e.g. 017XXXXXXXX).',
    };
  }
  const formattedSitePhone = formatToE164Phone(cleanPhone);

  const payload = {
    title,
    project_category: projectCategory,
    project_type: projectType,
    invoice_id: selectedInvoice
      ? selectedInvoice.id
      : projectToEdit
      ? projectToEdit.invoice_id
      : null,
    invoice_no: selectedInvoice
      ? selectedInvoice.invoice_no
      : projectToEdit
      ? projectToEdit.invoice_no
      : null,
    customer_id: selectedInvoice
      ? selectedInvoice.customer_id
      : projectToEdit
      ? projectToEdit.customer_id
      : null,
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

  return { payload };
}
