/**
 * Formats the exact and complete title from the Product Catalog:
 * Brand + Name + Model + Series/Variant
 */
export const fullCatalogName = (product) => {
  if (!product) return '';
  const brand = (product.brand_name || product.brand || '').trim();
  const name = (product.name || product.product_name || '').trim();
  const model = (product.model_name || product.model || '').trim();
  const series = (product.series_name || product.series || '').trim();

  const parts = [];
  if (brand) parts.push(brand);
  if (name) {
    if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
      const rest = name.slice(brand.length).trim();
      if (rest) parts.push(rest);
    } else {
      parts.push(name);
    }
  }
  if (model) {
    const combined = parts.join(' ').toLowerCase();
    if (!combined.includes(model.toLowerCase())) {
      parts.push(model);
    }
  }
  if (series) {
    const combined = parts.join(' ').toLowerCase();
    if (!combined.includes(series.toLowerCase())) {
      parts.push(series);
    }
  }
  return parts.filter(Boolean).join(' ') || name || 'Product';
};

export const productLabel = fullCatalogName;

/**
 * Checks if a product is serial/barcode tracked in the catalog schema
 */
export const isProductSerialTracked = (product) => {
  if (!product) return false;
  const val =
    product.isSerialRequired ??
    product.is_serial_required ??
    product.is_serial_tracked ??
    product.tracks_serial ??
    product.has_serial ??
    product.is_serialized ??
    product.has_serials;

  if (val === true || val === 1 || val === 'true' || val === '1' || val === 't' || val === 'TRUE') return true;
  if (val === false || val === 0 || val === 'false' || val === '0' || val === 'f' || val === 'FALSE') return false;
  return Boolean(val);
};

/**
 * Checks if a product requires warranty tracking in the catalog schema
 */
export const isProductWarrantyRequired = (product) => {
  if (!product) return false;
  const val =
    product.isWarrantyRequired ??
    product.is_warranty_required ??
    product.requires_warranty;

  if (val === true || val === 1 || val === 'true' || val === '1' || val === 't' || val === 'TRUE') return true;
  if (val === false || val === 0 || val === 'false' || val === '0' || val === 'f' || val === 'FALSE') return false;
  if (product.warranty_months !== null && product.warranty_months !== undefined && Number(product.warranty_months) > 0) return true;
  return Boolean(val);
};

