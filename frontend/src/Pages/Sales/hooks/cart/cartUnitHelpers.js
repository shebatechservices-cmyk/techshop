/**
 * Helper routines for switching between base units and sub units in sale cart.
 */
export function computeSwitchedUnitItem(it, targetUnitType) {
  const convRate = Number(it.conversion_rate || 1);
  if (targetUnitType === 'sub_unit') {
    const subPrice =
      it.sub_unit_selling_price && Number(it.sub_unit_selling_price) > 0
        ? Number(it.sub_unit_selling_price)
        : convRate > 1
        ? Number((Number(it.base_unit_price || it.unit_price) / convRate).toFixed(2))
        : Number(it.base_unit_price || it.unit_price);

    const baseCost = Number(it.base_unit_cost ?? it.cost_price ?? 0);
    const subCost =
      convRate > 1
        ? Number((baseCost / convRate).toFixed(2))
        : baseCost;

    return {
      ...it,
      unit_type: 'sub_unit',
      unit_name: it.sub_unit_name || 'Meter',
      unit_price: subPrice,
      cost_price: subCost,
    };
  } else {
    const maxBaseStock =
      convRate > 1
        ? Math.floor(Number(it.stock || 0) / convRate)
        : Number(it.stock || 0);

    const baseCost = Number(it.base_unit_cost ?? it.cost_price ?? 0);

    return {
      ...it,
      unit_type: 'base_unit',
      unit_name: it.base_unit_name || 'Pcs',
      unit_price: Number(it.base_unit_price || it.unit_price),
      cost_price: baseCost,
      quantity:
        it.quantity > maxBaseStock && maxBaseStock > 0 ? maxBaseStock : it.quantity,
    };
  }
}

export function applyItemPatch(it, patch, setError) {
  let safePatch = { ...patch };
  if (safePatch.quantity !== undefined && safePatch.quantity !== '') {
    const isSubUnit = it.unit_type === 'sub_unit';
    const convRate = Number(it.conversion_rate || 1);
    const maxStock = isSubUnit
      ? Number(it.stock || 0)
      : convRate > 1
      ? Math.floor(Number(it.stock || 0) / convRate)
      : Number(it.stock || 0);

    const numQty = Number(safePatch.quantity);
    if (numQty > maxStock && maxStock > 0) {
      safePatch.quantity = maxStock;
      if (setError) {
        setError(`Cannot exceed available stock (${maxStock} ${it.unit_name || ''}) for "${it.name}".`);
      }
    } else if (numQty <= 0) {
      safePatch.quantity = 1;
    }
  }
  return { ...it, ...safePatch };
}
