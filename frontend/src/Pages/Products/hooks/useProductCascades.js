export default function useProductCascades({ attributesState, setForm }) {
  // Callback when a new attribute (e.g. Brand, Category, Model) is created via inline quick add
  const handleEntityCreated = (entity, item) => {
    if (!item || !setForm) return;
    if (entity === "categories") {
      setForm((prev) => ({
        ...prev,
        category_id: String(item.id),
        sub_category_id: "",
        brand_id: "",
        model_id: "",
        series_id: "",
      }));
    } else if (entity === "sub_categories") {
      setForm((prev) => ({
        ...prev,
        sub_category_id: String(item.id),
        brand_id: "",
        model_id: "",
        series_id: "",
      }));
    } else if (entity === "brands") {
      setForm((prev) => ({
        ...prev,
        brand_id: String(item.id),
        model_id: "",
        series_id: "",
      }));
    } else if (entity === "product_names") {
      setForm((prev) => ({
        ...prev,
        name: item.name,
      }));
    } else if (entity === "models") {
      setForm((prev) => ({
        ...prev,
        model_id: String(item.id),
        series_id: "",
      }));
    } else if (entity === "series") {
      setForm((prev) => ({
        ...prev,
        series_id: String(item.id),
      }));
    }
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    attributesState.setSelectedCategory(value);
    attributesState.setSelectedSubCategory("");
    attributesState.setSelectedBrand("");
    attributesState.setSelectedModel("");
    attributesState.setSelectedSeries("");
    if (setForm) {
      setForm((prev) => ({
        ...prev,
        name: "",
        category_id: value,
        sub_category_id: "",
        brand_id: "",
        model_id: "",
        series_id: "",
      }));
    }
  };

  const handleSubCategoryChange = (e) => {
    const value = e.target.value;
    attributesState.setSelectedSubCategory(value);
    attributesState.setSelectedBrand("");
    attributesState.setSelectedModel("");
    attributesState.setSelectedSeries("");
    if (setForm) {
      setForm((prev) => ({
        ...prev,
        name: "",
        sub_category_id: value,
        brand_id: "",
        model_id: "",
        series_id: "",
      }));
    }
  };

  const handleBrandChange = (e) => {
    const value = e.target.value;
    attributesState.setSelectedBrand(value);
    attributesState.setSelectedModel("");
    attributesState.setSelectedSeries("");
    if (setForm) {
      setForm((prev) => ({
        ...prev,
        name: "",
        brand_id: value,
        model_id: "",
        series_id: "",
      }));
    }
  };

  const handleProductNameChange = (e) => {
    const value = e.target.value;
    attributesState.setSelectedModel("");
    attributesState.setSelectedSeries("");
    if (setForm) {
      setForm((prev) => ({
        ...prev,
        name: value,
        model_id: "",
        series_id: "",
      }));
    }
  };

  const handleModelChange = (e) => {
    const value = e.target.value;
    attributesState.setSelectedModel(value);
    attributesState.setSelectedSeries("");
    if (setForm) {
      setForm((prev) => ({ ...prev, model_id: value, series_id: "" }));
    }
  };

  const handleSeriesChange = (e) => {
    const value = e.target.value;
    attributesState.setSelectedSeries(value);
    if (setForm) {
      setForm((prev) => ({ ...prev, series_id: value }));
    }
  };

  return {
    handleEntityCreated,
    handleCategoryChange,
    handleSubCategoryChange,
    handleBrandChange,
    handleProductNameChange,
    handleModelChange,
    handleSeriesChange,
  };
}
