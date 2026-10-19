import React from "react";
import SearchableSelect from "../../../../../components/shared/SearchableSelect";

export default function ModelSeriesFields({
  productNames = [],
  models = [],
  series = [],
  selectedBrand,
  selectedModel,
  selectedSeries,
  form,
  handleProductNameChange,
  handleModelChange,
  handleSeriesChange,
  openQuickAddModal,
  activeBrand,
}) {
  const activeProductName = form.name || "";
  const activeModel = models.find((m) => String(m.id) === String(selectedModel));

  const filteredProductNames = React.useMemo(() => {
    return productNames.filter((item) => String(item.brand_id) === String(selectedBrand));
  }, [productNames, selectedBrand]);

  const filteredModels = React.useMemo(() => {
    return models.filter((model) => String(model.brand_id) === String(selectedBrand));
  }, [models, selectedBrand]);

  const filteredSeries = React.useMemo(() => {
    return series.filter((item) => !selectedBrand || String(item.brand_id) === String(selectedBrand));
  }, [series, selectedBrand]);

  return (
    <>
      {/* Product Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
          <span>Product Name / Item Type</span>
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <SearchableSelect
            name="name"
            value={form.name || ""}
            valueKey="name"
            labelKey="name"
            disabled={!selectedBrand}
            disabledPlaceholder="Select brand first"
            onChange={handleProductNameChange}
            options={filteredProductNames}
            placeholder={
              filteredProductNames.length === 0
                ? "No product names for this brand (click + to add)"
                : "Select product name"
            }
            searchPlaceholder="Search product name..."
            required
          />
          <button
            type="button"
            disabled={!selectedBrand}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickAddModal("product_names", { parentName: activeBrand?.name, parentType: "Brand" });
            }}
            title={selectedBrand ? `Add new product name for ${activeBrand?.name || 'selected brand'}` : "Select brand first"}
            className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-lg shrink-0"
          >
            +
          </button>
        </div>
      </div>

      {/* Model */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
          <span>Model</span>
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <SearchableSelect
            name="model_id"
            value={selectedModel}
            disabled={!selectedBrand || !form.name}
            disabledPlaceholder={
              !selectedBrand
                ? "Select brand first"
                : !form.name
                ? "Select product name first"
                : "Select model"
            }
            onChange={handleModelChange}
            options={filteredModels}
            placeholder={
              filteredModels.length === 0
                ? "No models for this brand (click + to add)"
                : "Select model"
            }
            searchPlaceholder="Search model..."
            required
          />
          <button
            type="button"
            disabled={!selectedBrand || !form.name}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickAddModal("models", { parentName: activeProductName || activeBrand?.name, parentType: "Product Name" });
            }}
            title={
              !selectedBrand
                ? "Select brand first"
                : !form.name
                ? "Select product name first"
                : `Add new model for ${activeProductName || 'selected product'}`
            }
            className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-lg shrink-0"
          >
            +
          </button>
        </div>
      </div>

      {/* Series */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
          <span>Series</span>
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <SearchableSelect
            name="series_id"
            value={selectedSeries}
            disabled={!selectedModel}
            disabledPlaceholder="Select model first"
            onChange={handleSeriesChange}
            options={filteredSeries}
            placeholder={
              filteredSeries.length === 0
                ? "No series for this brand (click + to add)"
                : "Select series"
            }
            searchPlaceholder="Search series..."
            required
          />
          <button
            type="button"
            disabled={!selectedModel}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickAddModal("series", { parentName: activeBrand?.name || activeModel?.name, parentType: "Brand" });
            }}
            title={selectedBrand ? `Add new series for ${activeBrand?.name || 'selected brand'}` : "Select brand first"}
            className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-lg shrink-0"
          >
            +
          </button>
        </div>
      </div>
    </>
  );
}
