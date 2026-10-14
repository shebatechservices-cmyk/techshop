import { useState, useMemo } from 'react';
import {
  calculateServicesTotal,
  calculateTotalDeviceCount,
  calculateTotalTechnicianPayout,
} from '../../utils/projectHelpers';

export const DEFAULT_SERVICE_ROW = {
  id: 1,
  service_name: 'CCTV Camera Setup',
  quantity: 1,
  unit_rate: 1500,
  line_total: 1500,
  notes: '',
};

/**
 * Hook to manage dynamic service task items and monetary computations.
 */
export default function useProjectServices({ conveyanceCost, mealAllowance }) {
  const [services, setServices] = useState([DEFAULT_SERVICE_ROW]);

  const handleAddServiceRow = (presetName = '', defaultRate = 500) => {
    const newId = Date.now() + Math.random();
    setServices((prev) => [
      ...prev,
      {
        id: newId,
        service_name: presetName || '',
        quantity: 1,
        unit_rate: defaultRate,
        line_total: defaultRate,
        notes: '',
      },
    ]);
  };

  const handleUpdateServiceRow = (id, field, value) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, [field]: value };
        if (field === 'quantity' || field === 'unit_rate') {
          const q = field === 'quantity' ? parseInt(value, 10) || 0 : Number(s.quantity || 0);
          const r = field === 'unit_rate' ? parseFloat(value) || 0 : Number(s.unit_rate || 0);
          updated.line_total = q * r;
        }
        return updated;
      })
    );
  };

  const handleApplyPresetToRow = (id, presetName, defaultRate) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const qty = parseInt(s.quantity, 10) || 1;
        const rate = parseFloat(defaultRate) || 0;
        return {
          ...s,
          service_name: presetName,
          unit_rate: rate,
          line_total: qty * rate,
        };
      })
    );
  };

  const handleRemoveServiceRow = (id) => {
    if (services.length <= 1) {
      setServices([{ id: Date.now(), service_name: '', quantity: 1, unit_rate: 0, line_total: 0, notes: '' }]);
      return;
    }
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const totalSetupFee = useMemo(() => calculateServicesTotal(services), [services]);
  const totalDeviceCount = useMemo(() => calculateTotalDeviceCount(services), [services]);
  const totalTechnicianPayout = useMemo(
    () => calculateTotalTechnicianPayout(totalSetupFee, conveyanceCost, mealAllowance),
    [totalSetupFee, conveyanceCost, mealAllowance]
  );

  return {
    services,
    setServices,
    handleAddServiceRow,
    handleUpdateServiceRow,
    handleApplyPresetToRow,
    handleRemoveServiceRow,
    totalSetupFee,
    totalDeviceCount,
    totalTechnicianPayout,
  };
}
