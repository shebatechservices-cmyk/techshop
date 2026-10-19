import { useState } from 'react';

export default function useProjectFormState() {
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

  return {
    projectCategory,
    setProjectCategory,
    title,
    setTitle,
    projectType,
    setProjectType,
    selectedInvoice,
    setSelectedInvoice,
    customerName,
    setCustomerName,
    sitePhone,
    setSitePhone,
    siteAddress,
    setSiteAddress,
    technicianId,
    setTechnicianId,
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
    setSubmitting,
  };
}
