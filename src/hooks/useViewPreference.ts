
import { useState, useEffect } from 'react';

type ViewPreference = 'all' | 'assigned';

export const useViewPreference = () => {
  const [viewPreference, setViewPreference] = useState<ViewPreference>('all');

  useEffect(() => {
    const saved = localStorage.getItem('departmentViewPreference');
    if (saved === 'all' || saved === 'assigned') {
      setViewPreference(saved);
    }
  }, []);

  const updateViewPreference = (preference: ViewPreference) => {
    setViewPreference(preference);
    localStorage.setItem('departmentViewPreference', preference);
  };

  return {
    viewPreference,
    updateViewPreference,
  };
};
