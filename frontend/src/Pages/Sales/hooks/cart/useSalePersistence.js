import useSaleDraft from './useSaleDraft';
import useSaleEditHydration from './useSaleEditHydration';

export default function useSalePersistence({
  isOpen,
  editSale,
  products,
  draftData,
  handlers,
}) {
  const draftSub = useSaleDraft({
    isOpen,
    editSale,
    draftData,
    handlers,
  });

  useSaleEditHydration({
    isOpen,
    editSale,
    products,
    handlers,
  });

  return draftSub;
}
