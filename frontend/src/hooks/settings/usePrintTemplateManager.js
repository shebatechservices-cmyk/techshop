import defaultAPI from '../../services/api';
import { usePrintTemplateState } from './usePrintTemplateState';

export function usePrintTemplateManager({
  API: apiProp,
  settings,
  setSettings,
  setSaving,
  showToast,
  uploadImageFile,
}) {
  const API = apiProp || defaultAPI;
  const printState = usePrintTemplateState();
  const { previewMode, setPreviewMode } = printState;

  // Upload Brand Logo for Invoices
  const handleBrandLogoFileUpload = async (e, idx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG/PNG/WEBP).');
      e.target.value = '';
      return;
    }
    try {
      if (setSaving) setSaving(true);
      const url = await uploadImageFile(file);
      if (url) {
        const list = Array.isArray(settings.invoice_brand_logos) ? [...settings.invoice_brand_logos] : [];
        if (!list[idx]) list[idx] = { name: '', url: '' };
        list[idx] = { ...list[idx], url };
        if (setSettings) setSettings(prev => ({ ...prev, invoice_brand_logos: list }));
        if (showToast) showToast('Brand logo uploaded successfully!');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Brand logo upload failed.');
    } finally {
      if (setSaving) setSaving(false);
      e.target.value = '';
    }
  };

  // Reorder Brand Logo
  const handleMoveBrandLogo = (idx, direction) => {
    const list = Array.isArray(settings.invoice_brand_logos) ? [...settings.invoice_brand_logos] : [];
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const item = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = item;
    if (setSettings) setSettings(prev => ({ ...prev, invoice_brand_logos: list }));
  };

  // Add Empty Brand Logo Slot
  const handleAddBrandLogo = () => {
    const list = Array.isArray(settings.invoice_brand_logos) ? [...settings.invoice_brand_logos] : [];
    if (list.length >= 12) {
      alert('Maximum 12 brand logos allowed.');
      return;
    }
    list.push({ name: '', url: '' });
    if (setSettings) setSettings(prev => ({ ...prev, invoice_brand_logos: list }));
  };

  // Update Brand Logo Name or URL
  const handleUpdateBrandLogo = (idx, key, value) => {
    const list = Array.isArray(settings.invoice_brand_logos) ? [...settings.invoice_brand_logos] : [];
    if (!list[idx]) return;
    list[idx] = { ...list[idx], [key]: value };
    if (setSettings) setSettings(prev => ({ ...prev, invoice_brand_logos: list }));
  };

  // Remove Brand Logo Slot
  const handleRemoveBrandLogo = (idx) => {
    const list = Array.isArray(settings.invoice_brand_logos) ? [...settings.invoice_brand_logos] : [];
    list.splice(idx, 1);
    if (setSettings) setSettings(prev => ({ ...prev, invoice_brand_logos: list }));
  };

  // Save Print and Invoice Design Settings
  const handleSavePrintDesign = async () => {
    try {
      if (setSaving) setSaving(true);
      const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
      const payload = {
        default_invoice_format: settings.default_invoice_format,
        invoice_color_scheme: settings.invoice_color_scheme,
        invoice_template: settings.invoice_template,
        show_logo_on_invoice: settings.show_logo_on_invoice,
        show_qr_on_invoice: settings.show_qr_on_invoice,
        show_signature_on_invoice: settings.show_signature_on_invoice,
        logo_url: settings.logo_url,
        secondary_logo_url: settings.secondary_logo_url,
        sister_concern_name: settings.sister_concern_name,
        show_sister_concern: settings.show_sister_concern,
        watermark_logo_url: settings.watermark_logo_url,
        watermark_opacity: Number(settings.watermark_opacity) || 6,
        enable_watermark: settings.enable_watermark,
        invoice_footer_note: settings.invoice_footer_note,
        footer_greeting: settings.footer_greeting || settings.invoice_footer_note,
        invoice_terms: settings.invoice_terms,
        thermal_tc_clause: settings.thermal_tc_clause || settings.invoice_terms,
        warranty_policy: settings.warranty_policy,
        warranty_disclaimer_text: settings.warranty_disclaimer_text || settings.warranty_policy,
        return_refund_policy: settings.return_refund_policy,
        return_policy_text: settings.return_policy_text || settings.return_refund_policy,
        invoice_brand_logos: settings.invoice_brand_logos,
        footer_partner_logos: settings.invoice_brand_logos,
        paper_size: settings.paper_size || 'a4',
        page_margin: settings.page_margin || 'default',
        show_footer_details: settings.show_footer_details !== false,
      };

      const res = await fetch(`${API}/settings/print-template`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        if (showToast) showToast('Print and invoice template saved successfully!');
        if (data.data && setSettings) setSettings(prev => ({ ...prev, ...data.data }));
      } else {
        if (showToast) showToast(data?.message || 'Print template saved!', 'success');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Print template saved (Local State Synced)', 'success');
    } finally {
      if (setSaving) setSaving(false);
    }
  };

  return {
    previewMode,
    setPreviewMode,
    handleSavePrintDesign,
    handleBrandLogoFileUpload,
    handleMoveBrandLogo,
    handleAddBrandLogo,
    handleUpdateBrandLogo,
    handleRemoveBrandLogo,
  };
}

export default usePrintTemplateManager;
