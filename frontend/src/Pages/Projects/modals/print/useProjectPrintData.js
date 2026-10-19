import { useState, useEffect } from 'react';
import API, { getAuthHeaders } from '../../../../services/api';

export default function useProjectPrintData(isOpen, project) {
  const [shop, setShop] = useState({
    shop_name: 'Sheba Technology & Networking',
    shop_title: 'Professional CCTV, IT & Network Solutions',
    phone: '01722578860',
    address: 'B-Baria, Dhaka, Bangladesh',
  });

  useEffect(() => {
    if (isOpen) {
      fetch(`${API}/settings`, { headers: getAuthHeaders() })
        .then((res) => res.json())
        .then((json) => {
          if (json && json.data) {
            setShop((prev) => ({
              ...prev,
              ...json.data,
            }));
          }
        })
        .catch((err) =>
          console.error('Failed to load shop settings for print:', err)
        );
    }
  }, [isOpen]);

  if (!project) return { shop };

  const setup = parseFloat(project.setup_charge || project.setup_fee || 0);
  const conv = parseFloat(project.conveyance_cost || project.conveyance || 0);
  const meal = parseFloat(project.meal_allowance || 0);
  const totalTechPayout =
    setup + conv + meal > 0 ? setup + conv + meal : parseFloat(project.charges || 0);
  const customerBill = parseFloat(project.customer_billing_amount || 0);

  const equipmentList = Array.isArray(project.equipment_details)
    ? project.equipment_details
    : typeof project.equipment_details === 'string'
    ? JSON.parse(project.equipment_details || '[]')
    : [];

  const servicesList = Array.isArray(project.services) ? project.services : [];

  const printDateStr = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const jobDateStr = project.created_at
    ? new Date(project.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB');

  const startDateStr = project.start_date
    ? new Date(project.start_date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Immediate';

  return {
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
  };
}
