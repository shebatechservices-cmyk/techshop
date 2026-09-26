import React, { useState } from "react";

export default function BundleKitBuilder({
  form,
  setForm,
  handleFieldChange,
  categories = [],
  selectedCategory,
  handleCategoryChange,
  availableComponents = [],
}) {
  const [componentProductId, setComponentProductId] = useState("");
  const [componentQty, setComponentQty] = useState(1);
  const [componentCustomPrice, setComponentCustomPrice] = useState("");

  const handleAddComponent = () => {
    if (!componentProductId) return;
    const selectedProd = availableComponents.find((p) => String(p.id) === String(componentProductId));
    if (!selectedProd) return;

    const qty = Math.max(1, parseInt(componentQty, 10) || 1);
    const unitPrice = componentCustomPrice !== "" ? Number(componentCustomPrice) : Number(selectedProd.selling_price || selectedProd.sale_price || 0);

    const existingIndex = (form.bundle_items || []).findIndex(
      (bi) => String(bi.product_id) === String(selectedProd.id)
    );

    let updatedList = [...(form.bundle_items || [])];
    if (existingIndex >= 0) {
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        quantity: updatedList[existingIndex].quantity + qty,
        unit_price: unitPrice,
      };
    } else {
      updatedList.push({
        product_id: selectedProd.id,
        component_name: selectedProd.name,
        component_sku: selectedProd.sku,
        component_stock: selectedProd.stock || 0,
        quantity: qty,
        unit_price: unitPrice,
      });
    }

    setForm((prev) => {
      const sumPrices = updatedList.reduce((acc, it) => acc + (Number(it.unit_price || 0) * Number(it.quantity || 1)), 0);
      return {
        ...prev,
        bundle_items: updatedList,
        selling_price: prev.selling_price > 0 ? prev.selling_price : sumPrices,
      };
    });

    setComponentProductId("");
    setComponentQty(1);
    setComponentCustomPrice("");
  };

  const handleRemoveComponent = (prodId) => {
    setForm((prev) => ({
      ...prev,
      bundle_items: (prev.bundle_items || []).filter((bi) => String(bi.product_id) !== String(prodId)),
    }));
  };

  const bundleComponentSum = (form.bundle_items || []).reduce(
    (acc, it) => acc + Number(it.unit_price || 0) * Number(it.quantity || 1),
    0
  );

  return (
    <div className="space-y-4 bg-purple-50/40 p-5 rounded-xl border border-purple-200">
      <div className="flex items-center justify-between border-b border-purple-200 pb-2.5">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-purple-900 flex items-center gap-2">
            <span>🎁 Bundle Kit Package Configuration</span>
          </h3>
          <p className="text-xs text-purple-700 mt-0.5">
            Group multiple catalog items (e.g. 4x Cameras, DVR, HDD, Cable Box) into a single sellable package.
          </p>
        </div>
      </div>

      {/* Bundle Package Name & SKU */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
            <span>Package / Kit Name</span>
            <span className="text-rose-500">*</span>
          </label>
          <input
            name="name"
            value={form.name || ""}
            onChange={handleFieldChange}
            placeholder="e.g. Hikvision 4-Camera Full HD Surveillance Package"
            required
            className="w-full px-3.5 py-2.5 border border-purple-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-slate-800"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
            <span>Package SKU (Auto Generated)</span>
          </label>
          <div className="flex gap-2">
            <input
              name="sku"
              value={form.sku || ""}
              onChange={handleFieldChange}
              placeholder="e.g. KIT-SURV-4CH"
              required
              className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 font-mono"
            />
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, sku: `KIT-${Math.floor(100000 + Math.random() * 900000)}` }))}
              title="Generate New Package SKU"
              className="px-3.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg cursor-pointer text-base font-bold"
            >
              🎲
            </button>
          </div>
        </div>
      </div>

      {/* Package Selling Price & Barcode */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-purple-900 flex items-center gap-1">
            <span>Package Selling Price (Tk)</span>
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            name="selling_price"
            value={form.selling_price || ""}
            onChange={handleFieldChange}
            min="0"
            placeholder={`e.g. ${bundleComponentSum || 16500}`}
            required
            className="w-full px-3.5 py-2.5 border border-purple-300 rounded-lg text-sm font-bold text-purple-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {bundleComponentSum > 0 && (
            <span className="text-xs text-slate-500 font-medium">
              Components sum: ৳{bundleComponentSum.toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-slate-700">Package Barcode (Optional)</label>
          <input
            name="barcode"
            value={form.barcode || ""}
            onChange={handleFieldChange}
            placeholder="Scan / enter kit barcode"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 font-mono"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-slate-700">Category (Optional)</label>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
          >
            <option value="">Select category for package</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Component Selector Form */}
      <div className="bg-white p-4 rounded-xl border border-purple-200 space-y-3.5">
        <span className="text-sm font-bold text-slate-800 block">
          ➕ Add Items into this Package:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_120px_auto] gap-2.5 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Select Item</label>
            <select
              value={componentProductId}
              onChange={(e) => {
                const pId = e.target.value;
                setComponentProductId(pId);
                const found = availableComponents.find((p) => String(p.id) === String(pId));
                if (found) {
                  setComponentCustomPrice(found.selling_price || found.sale_price || 0);
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 text-slate-800"
            >
              <option value="">-- Choose item to include --</option>
              {availableComponents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.sku ? `(${p.sku})` : ""} | Stock: {p.stock || 0}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Qty in Kit</label>
            <input
              type="number"
              min="1"
              value={componentQty}
              onChange={(e) => setComponentQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center font-bold text-slate-800"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Item Unit Price</label>
            <input
              type="number"
              min="0"
              value={componentCustomPrice}
              onChange={(e) => setComponentCustomPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-right font-bold text-slate-800"
            />
          </div>

          <button
            type="button"
            onClick={handleAddComponent}
            disabled={!componentProductId}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            + Add
          </button>
        </div>

        {/* Selected Bundle Items Table */}
        {(form.bundle_items || []).length > 0 ? (
          <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-xs">
                <tr>
                  <th className="p-2.5">Component Item</th>
                  <th className="p-2.5 text-center">Qty in Kit</th>
                  <th className="p-2.5 text-right">Unit Price</th>
                  <th className="p-2.5 text-right">Total</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {form.bundle_items.map((bi) => (
                  <tr key={bi.product_id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-medium text-slate-800">
                      {bi.component_name || `Product #${bi.product_id}`}
                      {bi.component_sku && (
                        <span className="text-xs text-slate-400 block font-mono">
                          SKU: {bi.component_sku}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-center font-bold text-slate-700">{bi.quantity}</td>
                    <td className="p-2.5 text-right font-mono">৳{Number(bi.unit_price || 0).toLocaleString()}</td>
                    <td className="p-2.5 text-right font-bold font-mono text-purple-900">
                      ৳{(Number(bi.unit_price || 0) * Number(bi.quantity || 1)).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(bi.product_id)}
                        className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer px-2 py-1 rounded hover:bg-rose-50"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-5 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-sm">
            No components added yet. Select items above to include them in this bundle kit.
          </div>
        )}
      </div>
    </div>
  );
}
