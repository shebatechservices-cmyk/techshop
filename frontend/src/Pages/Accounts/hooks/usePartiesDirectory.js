import { useState, useEffect, useCallback } from 'react';
import API from '../../../services/api';

export default function usePartiesDirectory(activeSubpage) {
  const [parties, setParties] = useState([]);
  const [partyTypeFilter, setPartyTypeFilter] = useState('all');
  const [partySearch, setPartySearch] = useState('');
  const [partyPage, setPartyPage] = useState(1);
  const [partyPagination, setPartyPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [partyCounts, setPartyCounts] = useState({ total: 0, customer: 0, supplier: 0, staff: 0 });
  const [loadingParties, setLoadingParties] = useState(false);

  // Party Profile Modal State
  const [selectedPartyModal, setSelectedPartyModal] = useState({
    isOpen: false,
    partyType: 'customer',
    partyId: null,
    initialTab: 'overview',
  });

  const loadPartiesData = useCallback(async () => {
    try {
      setLoadingParties(true);
      const queryParams = new URLSearchParams();
      if (partyTypeFilter !== 'all') queryParams.append('type', partyTypeFilter);
      if (partySearch.trim()) queryParams.append('search', partySearch.trim());
      queryParams.append('page', partyPage);
      queryParams.append('limit', 20);

      const res = await fetch(`${API}/parties?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setParties(data.data || []);
        setPartyPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
        if (data.counts) setPartyCounts(data.counts);
      }
    } catch (err) {
      console.error('loadPartiesData error:', err);
    } finally {
      setLoadingParties(false);
    }
  }, [partyTypeFilter, partySearch, partyPage]);

  useEffect(() => {
    if (activeSubpage === 'parties') {
      loadPartiesData();
    }
  }, [activeSubpage, loadPartiesData]);

  return {
    parties,
    setParties,
    partyTypeFilter,
    setPartyTypeFilter,
    partySearch,
    setPartySearch,
    partyPage,
    setPartyPage,
    partyPagination,
    setPartyPagination,
    partyCounts,
    setPartyCounts,
    loadingParties,
    setLoadingParties,
    selectedPartyModal,
    setSelectedPartyModal,
    loadPartiesData,
  };
}
