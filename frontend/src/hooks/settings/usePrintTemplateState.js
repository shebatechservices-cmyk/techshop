import { useState } from 'react';

export function usePrintTemplateState() {
  const [previewMode, setPreviewMode] = useState('thermal');

  return {
    previewMode,
    setPreviewMode,
  };
}
