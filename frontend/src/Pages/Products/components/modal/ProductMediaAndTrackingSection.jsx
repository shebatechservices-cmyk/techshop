import React from "react";
import API_BASE from "../../../../services/api";

export default function ProductMediaAndTrackingSection({
  form,
  setForm,
  handleFieldChange,
  featureImageFile,
  setFeatureImageFile,
  featureImagePreview,
  setFeatureImagePreview,
  galleryImageFiles,
  setGalleryImageFiles,
  galleryImagePreviews,
  fileInputKey,
  setFileInputKey,
}) {
  return (
    <div className="space-y-4">
      {/* Image Uploads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-200">
        {/* Feature Image */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">
            📸 Feature Image (Inventory & POS)
          </label>
          <input
            key={`feat-${fileInputKey}`}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={(event) => setFeatureImageFile(event.target.files?.[0] || null)}
            className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
          />
          <small className="text-[11px] text-slate-400">
            Format: JPG, PNG, or WebP | Max 2MB (1:1 square)
          </small>
          {(featureImagePreview || form.image_url) && (
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1">
              <img
                src={
                  featureImagePreview ||
                  (form.image_url.startsWith("http")
                    ? form.image_url
                    : `${API_BASE}${form.image_url}`)
                }
                alt="Feature Preview"
                className="w-12 h-12 object-cover rounded-md border border-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Uploaded</span>
                <button
                  type="button"
                  onClick={() => {
                    setFeatureImageFile(null);
                    setFeatureImagePreview(null);
                    setForm((p) => ({ ...p, image_url: "" }));
                    setFileInputKey((k) => k + 1);
                  }}
                  className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Gallery Images */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">
            🖼️ Gallery Images (E-Commerce)
          </label>
          <input
            key={`gal-${fileInputKey}`}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            multiple
            onChange={(event) => setGalleryImageFiles(Array.from(event.target.files || []))}
            className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
          />
          <small className="text-[11px] text-slate-400">Multiple product angles for online shop</small>
          {galleryImagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {galleryImagePreviews.map((previewUrl, idx) => (
                <div key={idx} className="relative w-11 h-11">
                  <img
                    src={previewUrl}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-full object-cover rounded border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryImageFiles((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold shadow-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5 pt-1">
        <label className="text-xs font-bold text-slate-700">Description</label>
        <textarea
          name="description"
          value={form.description || ""}
          onChange={handleFieldChange}
          rows={2}
          placeholder="Product specifications, key highlights, etc."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
        />
      </div>

      {/* Tracking Options */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        {/* Serial / Barcode Tracking */}
        <label
          className={`flex justify-between items-center p-3 rounded-xl border text-xs cursor-pointer transition-all ${
            form.is_serial_required || form.isSerialRequired || form.tracks_serial
              ? "bg-emerald-50/70 border-emerald-300"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div>
            <strong
              className={
                form.is_serial_required || form.isSerialRequired || form.tracks_serial
                  ? "text-emerald-900"
                  : "text-slate-800"
              }
            >
              📦 Requires Serial / Barcode Tracking
            </strong>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Strictly enforced in Purchase & Sale forms. Auto-calculates quantities from barcode scans.
            </p>
          </div>
          <input
            type="checkbox"
            checked={Boolean(
              form.is_serial_required ||
                form.isSerialRequired ||
                form.tracks_serial ||
                form.is_serial_tracked
            )}
            onChange={(e) => {
              const val = e.target.checked;
              setForm((current) => ({
                ...current,
                is_serial_required: val,
                is_serial_tracked: val,
                isSerialRequired: val,
                tracks_serial: val,
              }));
            }}
            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
        </label>

        {/* Warranty Tracking */}
        <label
          className={`flex justify-between items-center p-3 rounded-xl border text-xs cursor-pointer transition-all ${
            form.is_warranty_required || form.isWarrantyRequired
              ? "bg-blue-50/70 border-blue-300"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div>
            <strong
              className={
                form.is_warranty_required || form.isWarrantyRequired
                  ? "text-blue-900"
                  : "text-slate-800"
              }
            >
              🛡️ Requires Warranty Tracking
            </strong>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enforces warranty duration in Purchase and prints warranty policy on Customer Invoices.
            </p>
          </div>
          <input
            type="checkbox"
            checked={Boolean(
              form.is_warranty_required ||
                form.isWarrantyRequired ||
                Number(form.warranty_months || 0) > 0
            )}
            onChange={(e) => {
              const val = e.target.checked;
              setForm((current) => ({
                ...current,
                is_warranty_required: val,
                isWarrantyRequired: val,
                warranty_months: val
                  ? Number(current.warranty_months || 0) > 0
                    ? current.warranty_months
                    : "12"
                  : "0",
              }));
            }}
            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </label>

        {/* Warranty Duration Input */}
        {(form.isWarrantyRequired || Number(form.warranty_months || 0) > 0) && (
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-blue-900">Default Warranty Duration:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                value={form.warranty_months || ""}
                onChange={(e) => setForm((c) => ({ ...c, warranty_months: e.target.value }))}
                placeholder="12"
                className="w-20 px-2.5 py-1 rounded-md border border-blue-300 bg-white text-center font-bold text-xs"
              />
              <span className="font-semibold text-slate-600">Months</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
