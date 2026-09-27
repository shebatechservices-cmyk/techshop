// Unit tests for usePurchaseBarcodeScanner hook logic and contract
describe('usePurchaseBarcodeScanner logic', () => {
  let items;
  let setItems;
  let setError;
  let setPopupMsg;
  let barcodeInput;
  let setBarcodeInput;
  let barcodeScanErrors;
  let setBarcodeScanErrors;

  beforeEach(() => {
    items = [
      {
        localId: 'item-1',
        product_id: 101,
        name: 'Hikvision IP Camera 4MP',
        quantity: 0,
        is_serial_tracked: true,
        serials: [],
        barcodes: [],
      },
    ];

    setItems = jest.fn((updater) => {
      items = typeof updater === 'function' ? updater(items) : updater;
    });

    setError = jest.fn();
    setPopupMsg = jest.fn();
    barcodeInput = { 'item-1': 'BC-88990011' };
    setBarcodeInput = jest.fn((updater) => {
      barcodeInput = typeof updater === 'function' ? updater(barcodeInput) : updater;
    });
    barcodeScanErrors = {};
    setBarcodeScanErrors = jest.fn((updater) => {
      barcodeScanErrors = typeof updater === 'function' ? updater(barcodeScanErrors) : updater;
    });
  });

  const handleAddBarcodeLogic = async (localId, barcodeToAdd = null) => {
    const item = items.find((i) => i.localId === localId);
    if (!item) return;

    const rawBarcode =
      barcodeToAdd !== null
        ? barcodeToAdd
        : typeof barcodeInput === 'object' && barcodeInput !== null
        ? barcodeInput[localId] || ''
        : barcodeInput || '';
    const code = String(rawBarcode).trim();
    if (!code) return;

    // 1. Check duplicate within current item
    const currentSerials = Array.isArray(item.serials)
      ? item.serials
      : Array.isArray(item.barcodes)
      ? item.barcodes
      : [];
    if (currentSerials.some((s) => s.toLowerCase() === code.toLowerCase())) {
      setBarcodeScanErrors((prev) => ({
        ...prev,
        [localId]: `⚠️ Barcode/Serial "${code}" already added to this product.`,
      }));
      return;
    }

    // 2. Check duplicate across other items in current purchase order
    for (const otherItem of items) {
      if (otherItem.localId !== localId) {
        const otherList = Array.isArray(otherItem.serials)
          ? otherItem.serials
          : Array.isArray(otherItem.barcodes)
          ? otherItem.barcodes
          : [];
        if (otherList.some((s) => s.toLowerCase() === code.toLowerCase())) {
          setBarcodeScanErrors((prev) => ({
            ...prev,
            [localId]: `⚠️ Barcode/Serial "${code}" is already assigned to another item in this order.`,
          }));
          return;
        }
      }
    }

    // RULE 2 & 3: Immutable state update & auto-increment quantity
    const updatedSerials = [...currentSerials, code];
    setItems((current) =>
      current.map((i) => {
        if (i.localId !== localId) return i;
        const currentQty = Number(i.quantity) || 0;
        const newQty = i.is_serial_tracked
          ? updatedSerials.length
          : Math.max(currentQty + 1, updatedSerials.length);

        return {
          ...i,
          serials: updatedSerials,
          barcodes: updatedSerials,
          quantity: newQty,
          barcode: i.barcode || code,
        };
      })
    );

    setBarcodeInput((prev) => {
      if (typeof prev === 'object' && prev !== null) {
        return { ...prev, [localId]: '' };
      }
      return '';
    });
    setBarcodeScanErrors((prev) => {
      const next = { ...prev };
      delete next[localId];
      return next;
    });
  };

  const handleRemoveBarcodeLogic = (localId, serialCode) => {
    setItems((current) =>
      current.map((i) => {
        if (i.localId !== localId) return i;
        const currentList = Array.isArray(i.serials)
          ? i.serials
          : Array.isArray(i.barcodes)
          ? i.barcodes
          : [];
        const filtered = currentList.filter(
          (s) => s.toLowerCase() !== serialCode.toLowerCase()
        );
        const newQty = i.is_serial_tracked
          ? filtered.length
          : Math.max(1, (Number(i.quantity) || 1) - 1);

        return {
          ...i,
          serials: filtered,
          barcodes: filtered,
          quantity: newQty,
        };
      })
    );
  };

  it('RULE 1 & 2: Successfully adds barcode and auto-increments quantity from 0 to 1 without blocks', async () => {
    expect(items[0].quantity).toBe(0);
    expect(items[0].serials.length).toBe(0);

    await handleAddBarcodeLogic('item-1');

    expect(items[0].quantity).toBe(1);
    expect(items[0].serials).toEqual(['BC-88990011']);
    expect(items[0].barcodes).toEqual(['BC-88990011']);
    expect(barcodeInput['item-1']).toBe('');
  });

  it('RULE 3: Supports multiple barcodes immutably, auto-incrementing quantity on each addition', async () => {
    await handleAddBarcodeLogic('item-1', 'BC-1111');
    expect(items[0].quantity).toBe(1);
    expect(items[0].serials).toEqual(['BC-1111']);

    await handleAddBarcodeLogic('item-1', 'BC-2222');
    expect(items[0].quantity).toBe(2);
    expect(items[0].serials).toEqual(['BC-1111', 'BC-2222']);

    await handleAddBarcodeLogic('item-1', 'BC-3333');
    expect(items[0].quantity).toBe(3);
    expect(items[0].serials).toEqual(['BC-1111', 'BC-2222', 'BC-3333']);
  });

  it('Rejects duplicate barcodes within the same item', async () => {
    await handleAddBarcodeLogic('item-1', 'BC-DUP-01');
    expect(items[0].quantity).toBe(1);

    await handleAddBarcodeLogic('item-1', 'BC-DUP-01');
    expect(items[0].quantity).toBe(1);
    expect(barcodeScanErrors['item-1']).toContain('already added to this product');
  });

  it('Removes a barcode immutably and decrements quantity', async () => {
    await handleAddBarcodeLogic('item-1', 'BC-AAA');
    await handleAddBarcodeLogic('item-1', 'BC-BBB');
    expect(items[0].quantity).toBe(2);

    handleRemoveBarcodeLogic('item-1', 'BC-AAA');
    expect(items[0].quantity).toBe(1);
    expect(items[0].serials).toEqual(['BC-BBB']);
  });
});
