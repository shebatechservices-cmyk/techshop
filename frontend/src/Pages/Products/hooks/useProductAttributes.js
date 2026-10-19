import { useAttributeCascading } from "./attributes/useAttributeCascading";
import { useAttributeQuickOps } from "./attributes/useAttributeQuickOps";

export default function useProductAttributes({ onEntityCreated } = {}) {
  const cascading = useAttributeCascading();
  const quickOps = useAttributeQuickOps({ cascading, onEntityCreated });

  return {
    ...cascading,
    ...quickOps,
  };
}
