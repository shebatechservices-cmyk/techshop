export function getParentContext(entity, item, { categories = [], subCategories = [], brands = [], models = [] } = {}) {
  if (entity === "sub_categories") {
    const parent = categories.find((c) => String(c.id) === String(item.category_id));
    return parent
      ? { label: "Category", name: parent.name }
      : item.category_name
      ? { label: "Category", name: item.category_name }
      : null;
  }
  if (entity === "brands") {
    const parent = subCategories.find((s) => String(s.id) === String(item.sub_category_id));
    return parent
      ? { label: "Sub-category", name: parent.name }
      : item.sub_category_name
      ? { label: "Sub-category", name: item.sub_category_name }
      : null;
  }
  if (entity === "product_names") {
    const parent = brands.find((b) => String(b.id) === String(item.brand_id));
    return parent
      ? { label: "Brand", name: parent.name }
      : item.brand_name
      ? { label: "Brand", name: item.brand_name }
      : null;
  }
  if (entity === "models") {
    const parent = brands.find((b) => String(b.id) === String(item.brand_id));
    return parent
      ? { label: "Brand", name: parent.name }
      : item.brand_name
      ? { label: "Brand", name: item.brand_name }
      : null;
  }
  if (entity === "series") {
    const parent = models.find((m) => String(m.id) === String(item.model_id));
    return parent
      ? { label: "Model", name: parent.name }
      : item.model_name
      ? { label: "Model", name: item.model_name }
      : null;
  }
  return null;
}

export function filterAttributeItems(entity, items, searchQuery, lookupContext) {
  if (!searchQuery.trim()) return items;
  const q = searchQuery.trim().toLowerCase();
  return items.filter((item) => {
    const name = (item.name || "").toLowerCase();
    const parent = getParentContext(entity, item, lookupContext);
    const parentName = (parent?.name || "").toLowerCase();
    return name.includes(q) || parentName.includes(q);
  });
}
