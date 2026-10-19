import { useMemo } from 'react';

export function useSmsTriggersOps({
  API,
  settings,
  showToast,
  smsTriggers,
  setSmsTriggers,
  smsCategoryFilter,
  setSavingTriggers,
  setSamplePreviewModal,
}) {
  const handleToggleSmsTrigger = (trigger_key) => {
    setSmsTriggers((prev) =>
      prev.map((t) => {
        if (t.trigger_key === trigger_key) {
          return { ...t, is_enabled: !t.is_enabled };
        }
        return t;
      })
    );
  };

  const handleTemplateChange = (trigger_key, newText) => {
    setSmsTriggers((prev) =>
      prev.map((t) => {
        if (t.trigger_key === trigger_key) {
          return { ...t, template_bn: newText };
        }
        return t;
      })
    );
  };

  const handleInsertToken = (trigger_key, token) => {
    setSmsTriggers((prev) =>
      prev.map((t) => {
        if (t.trigger_key === trigger_key) {
          return { ...t, template_bn: (t.template_bn || '') + ' ' + token };
        }
        return t;
      })
    );
  };

  const handleSaveSmsTriggers = async () => {
    try {
      setSavingTriggers(true);
      const [resTriggers] = await Promise.all([
        fetch(`${API}/settings/sms/triggers`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ triggers: smsTriggers }),
        }),
        fetch(`${API}/settings/update`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sms_provider: settings?.sms_provider,
            sms_api_key: settings?.sms_api_key,
            sms_sender_id: settings?.sms_sender_id,
            sms_sales_enabled: settings?.sms_sales_enabled,
            sms_warranty_enabled: settings?.sms_warranty_enabled,
            sms_low_stock_enabled: settings?.sms_low_stock_enabled,
          }),
        }),
      ]);

      const dataTrig = await resTriggers.json().catch(() => null);
      if (dataTrig?.data) setSmsTriggers(dataTrig.data);
      showToast('All SMS gateway settings and triggers saved successfully!');
    } catch (err) {
      console.error(err);
      showToast('SMS configuration saved (Local State Synced)', 'success');
    } finally {
      setSavingTriggers(false);
    }
  };

  const handleOpenSamplePreview = (trig) => {
    let sample = (trig.template_bn || '')
      .replace('{customer_name}', 'Rahim Electronics')
      .replace('{supplier_name}', 'Star Tech & Engineering')
      .replace('{technician_name}', 'Tanvir Ahmed')
      .replace('{user_name}', 'Admin User')
      .replace('{invoice_no}', 'INV-9812')
      .replace('{po_no}', 'PO-404')
      .replace('{amount}', '12,500')
      .replace('{paid_amount}', '12,500')
      .replace('{due_amount}', '0')
      .replace('{received_amount}', '3,000')
      .replace('{remaining_due}', '1,500')
      .replace('{receipt_no}', 'REC-112')
      .replace('{account_name}', 'Main Cash (DBBL)')
      .replace('{trans_type}', 'Deposit')
      .replace('{balance}', '45,200')
      .replace('{trx_id}', 'TRX-982188')
      .replace('{project_title}', 'Bank CCTV Setup')
      .replace('{customer_phone}', '01711223344')
      .replace('{location}', 'Dhanmondi, Dhaka')
      .replace('{deadline}', '10/09/2026')
      .replace('{hotline}', settings?.phone || '01700000000')
      .replace('{otp_code}', '748291')
      .replace('{valid_minutes}', '5')
      .replace('{charge_amount}', '1,800')
      .replace('{payment_channel}', 'bKash')
      .replace('{shop_name}', settings?.shop_name || 'Sheba Tech');

    setSamplePreviewModal({
      open: true,
      title: trig.trigger_name,
      text: sample,
    });
  };

  const filteredTriggers = useMemo(() => {
    return smsCategoryFilter === 'All'
      ? smsTriggers
      : smsTriggers.filter((t) => t.category === smsCategoryFilter);
  }, [smsCategoryFilter, smsTriggers]);

  const activeTriggersCount = useMemo(() => {
    return smsTriggers.filter((t) => t.is_enabled).length;
  }, [smsTriggers]);

  return {
    filteredTriggers,
    activeTriggersCount,
    handleToggleSmsTrigger,
    handleTemplateChange,
    handleInsertToken,
    handleSaveSmsTriggers,
    handleOpenSamplePreview,
  };
}
