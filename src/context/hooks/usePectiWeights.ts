
import { useState, useEffect } from 'react';
import { PECTIWeights, DEFAULT_PECTI_WEIGHTS } from '@/types';
import { getInitialData } from '../utils/dataUtils';

export const usePectiWeights = (currentCompany?: any) => {
  const [pectiWeights, setPectiWeights] = useState<PECTIWeights>(() =>
    getInitialData('pectiWeights', DEFAULT_PECTI_WEIGHTS)
  );
  
  useEffect(() => {
    localStorage.setItem('pectiWeights', JSON.stringify(pectiWeights));
  }, [pectiWeights]);

  const updatePectiWeights = (weights: Partial<PECTIWeights>) => {
    setPectiWeights(prev => ({
      ...prev,
      ...weights
    }));
  };
  
  return {
    pectiWeights,
    updatePectiWeights
  };
};
