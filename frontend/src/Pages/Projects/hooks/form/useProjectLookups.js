import { useState, useCallback } from 'react';
import { smartFetch } from '../../../../services/api';

/**
 * Hook to manage lookups (invoices, technicians, service presets, job types)
 * and modal states for New Project / Work Order Form.
 */
export default function useProjectLookups() {
  const [invoices, setInvoices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [servicePresets, setServicePresets] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const [isAddTechOpen, setIsAddTechOpen] = useState(false);
  const [isManagePresetsOpen, setIsManagePresetsOpen] = useState(false);
  const [isManageJobTypesOpen, setIsManageJobTypesOpen] = useState(false);

  // Fetch service presets from backend
  const fetchServicePresets = useCallback(async () => {
    try {
      const res = await smartFetch('/projects/service-presets?active_only=true');
      if (res && res.ok) {
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

  // Fetch job types from backend
  const fetchJobTypes = useCallback(async () => {
    try {
      const res = await smartFetch('/projects/job-types?active_only=true');
      if (res && res.ok) {
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
      const techRes = await smartFetch('/projects/technicians-lookup');
      if (techRes && techRes.ok) {
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

  // Fetch all initial lookups when modal opens
  const fetchInitialLookups = useCallback(async () => {
    setLoadingLookups(true);
    try {
      const [invRes] = await Promise.all([
        smartFetch('/projects/invoices-lookup').catch(() => null),
        fetchTechnicians(),
        fetchServicePresets(),
        fetchJobTypes()
      ]);

      if (invRes && invRes.ok) {
        const iData = await invRes.json();
        if (iData.success) setInvoices(iData.data || []);
      }
    } catch (err) {
      console.error('Error fetching initial lookups:', err);
    } finally {
      setLoadingLookups(false);
    }
  }, [fetchTechnicians, fetchServicePresets, fetchJobTypes]);

  return {
    invoices,
    setInvoices,
    technicians,
    setTechnicians,
    servicePresets,
    setServicePresets,
    jobTypes,
    setJobTypes,
    loadingLookups,
    setLoadingLookups,
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
  };
}
