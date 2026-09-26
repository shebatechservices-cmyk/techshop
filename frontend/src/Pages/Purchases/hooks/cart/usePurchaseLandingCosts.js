import { useState } from 'react';
import { EXTRA_COST_CATEGORIES, money } from './purchaseCartHelpers';

export function usePurchaseLandingCosts(initialState = {}) {
  const [hasExtraCost, setHasExtraCost] = useState(initialState.hasExtraCost || false);
  const [extraCost, setExtraCost] = useState(initialState.extraCost || '');
  const [extraCostCategory, setExtraCostCategory] = useState(initialState.extraCostCategory || EXTRA_COST_CATEGORIES[0]);
  const [extraCostNotes, setExtraCostNotes] = useState(initialState.extraCostNotes || '');

  const resetLandingCosts = () => {
    setHasExtraCost(false);
    setExtraCost('');
    setExtraCostCategory(EXTRA_COST_CATEGORIES[0]);
    setExtraCostNotes('');
  };

  const extraCostValue = hasExtraCost ? money(extraCost) : 0;

  return {
    hasExtraCost,
    setHasExtraCost,
    extraCost,
    setExtraCost,
    extraCostCategory,
    setExtraCostCategory,
    extraCostNotes,
    setExtraCostNotes,
    extraCostValue,
    resetLandingCosts,
  };
}
