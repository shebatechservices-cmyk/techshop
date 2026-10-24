export const getProductLabel = (product) =>
  [product.brand_name, product.name, product.model_name, product.series_name]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(" ");

export const matchesProductFilter = (p, { query = "", status = "ALL", category = "ALL" } = {}) => {
  // 1. Status Filter
  if (status === "active" && p.status !== "active") return false;
  if (status === "inactive" && p.status === "active") return false;
  if (status === "low_stock" && !(Number(p.stock) <= Number(p.min_stock))) return false;

  // 2. Category Filter
  if (category && category !== "ALL" && (p.category_name || "") !== category) {
    return false;
  }

  // 3. Search Query Filter
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const label = getProductLabel(p).toLowerCase();
  const name = (p.name || p.product_name || "").toLowerCase();
  const brand = (p.brand_name || p.brand || "").toLowerCase();
  const model = (p.model_name || p.model || "").toLowerCase();
  const series = (p.series_name || p.series || "").toLowerCase();
  const sku = (p.sku || "").toLowerCase();
  const barcode = (p.barcode || "").toLowerCase();
  const cat = (p.category_name || "").toLowerCase();
  const sub = (p.sub_category_name || "").toLowerCase();
  const desc = (p.description || "").toLowerCase();

  return (
    label.includes(q) ||
    name.includes(q) ||
    brand.includes(q) ||
    model.includes(q) ||
    series.includes(q) ||
    sku.includes(q) ||
    barcode.includes(q) ||
    cat.includes(q) ||
    sub.includes(q) ||
    desc.includes(q)
  );
};
