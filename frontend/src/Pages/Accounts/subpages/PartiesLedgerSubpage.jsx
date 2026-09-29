import React from 'react';
import PartyFilterBar from '../components/PartyFilterBar';
import PartyTable from '../components/PartyTable';
import PartyPagination from '../components/PartyPagination';

export default function PartiesLedgerSubpage({
  parties = [],
  partyCounts = { total: 0, customer: 0, supplier: 0, staff: 0 },
  partyTypeFilter = 'all',
  setPartyTypeFilter,
  partySearch = '',
  setPartySearch,
  partyPage = 1,
  setPartyPage,
  partyPagination = { total: 0, page: 1, limit: 20, totalPages: 1 },
  loadingParties = false,
  onOpenPartyModal,
  onRefresh,
}) {
  return (
    <div>
      {/* Top Filter & Search Bar */}
      <PartyFilterBar
        partyCounts={partyCounts}
        partyTypeFilter={partyTypeFilter}
        setPartyTypeFilter={setPartyTypeFilter}
        partySearch={partySearch}
        setPartySearch={setPartySearch}
        setPartyPage={setPartyPage}
        onRefresh={onRefresh}
      />

      {/* Party Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <PartyTable
          parties={parties}
          loadingParties={loadingParties}
          partySearch={partySearch}
          onOpenPartyModal={onOpenPartyModal}
        />

        {/* Pagination Bar */}
        <PartyPagination
          partyPage={partyPage}
          setPartyPage={setPartyPage}
          partyPagination={partyPagination}
        />
      </div>
    </div>
  );
}
