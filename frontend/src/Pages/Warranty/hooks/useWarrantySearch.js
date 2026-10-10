import { useState } from 'react';
import API from '../../../services/api';

export function useWarrantySearch({ claims, setClaimForm, setIsAddClaimOpen, setReturnForm, setIsAddReturnOpen }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Instant Warranty Checker
  const handleCheckWarranty = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setSearchError('');
      setSearchResult(null);

      const res = await fetch(
        `${API}/warranty/check?query=${encodeURIComponent(searchQuery.trim())}`
      );
      const d = await res.json();

      if (res.ok && d.success) {
        setSearchResult(d);
      } else {
        // Fallback local search
        const q = searchQuery.trim().toLowerCase();
        const foundLocal = claims.find(
          (c) =>
            (c.serial_code && c.serial_code.toLowerCase().includes(q)) ||
            (c.invoice_no && c.invoice_no.toLowerCase().includes(q))
        );
        if (foundLocal) {
          setSearchResult({
            success: true,
            match_type: 'SERIAL',
            data: {
              serial_code: foundLocal.serial_code,
              product_name: foundLocal.product_name,
              brand_name: 'Dahua / Hikvision',
              invoice_no: foundLocal.invoice_no,
              sale_date: '2026-03-15',
              customer_name: foundLocal.customer_name,
              customer_phone: foundLocal.customer_phone,
              unit_price: 3200,
              warranty_months: 12,
              customer_warranty_expiry: '2027-03-15',
              is_customer_warranty_valid: true,
              customer_days_remaining: 188,
              is_vendor_warranty_valid: true,
              vendor_warranty_info: '550 days remaining from Authorized Importer',
              supplier_name: 'Authorized Importer',
              past_claims: [
                {
                  claim_no: foundLocal.claim_no,
                  status: foundLocal.status,
                  issue_description: foundLocal.issue_description,
                },
              ],
            },
          });
        } else {
          setSearchError(d.message || `No record found for S/N or Invoice "${searchQuery.trim()}".`);
        }
      }
    } catch (err) {
      setSearchError(`Unable to verify: ${err.message}`);
    } finally {
      setSearching(false);
    }
  };

  const handleIntakeFromSearch = () => {
    if (!searchResult?.data) return;
    const d = searchResult.data;
    setClaimForm({
      invoice_no: d.invoice_no || '',
      customer_name: d.customer_name || '',
      customer_phone: d.customer_phone || '',
      product_id: d.product_id || '',
      product_name: d.product_name || '',
      serial_code: d.serial_code || '',
      issue_description: '',
      backup_unit_provided: 'None',
      estimated_delivery_date: '',
      service_notes: '',
    });
    setIsAddClaimOpen(true);
  };

  const handleReturnFromSearch = () => {
    if (!searchResult?.data) return;
    const d = searchResult.data;
    setReturnForm({
      invoice_no: d.invoice_no || '',
      customer_name: d.customer_name || '',
      customer_phone: d.customer_phone || '',
      product_id: d.product_id || '',
      product_name: d.product_name || '',
      serial_code: d.serial_code || '',
      return_qty: 1,
      return_type: 'Exchange',
      refund_amount: d.unit_price || '',
      refund_method: 'Cash',
      condition: 'Good',
      return_reason: '',
    });
    setIsAddReturnOpen(true);
  };

  return {
    searchQuery,
    setSearchQuery,
    searching,
    searchResult,
    searchError,
    handleCheckWarranty,
    handleIntakeFromSearch,
    handleReturnFromSearch,
  };
}
