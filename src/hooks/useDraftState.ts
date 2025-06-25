
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface UseDraftStateOptions {
  storageKey: string;
  defaultValues: Record<string, any>;
  onClear?: () => void;
  onSave?: () => void;
}

export const useDraftState = <T extends Record<string, any>>({
  storageKey,
  defaultValues,
  onClear,
  onSave
}: UseDraftStateOptions) => {
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [formData, setFormData] = useState<T>(defaultValues as T);

  // Helper function to clean corrupted values
  const cleanValue = (value: any): any => {
    if (value === undefined || value === null) {
      return undefined;
    }
    
    // Check for corrupted undefined objects
    if (typeof value === 'object' && value !== null) {
      if ((value as any)._type === 'undefined') {
        return undefined;
      }
      
      // Clean nested objects
      if (Array.isArray(value)) {
        return value.map(cleanValue).filter(v => v !== undefined);
      }
      
      // Clean object properties
      const cleanedObj: any = {};
      for (const [key, val] of Object.entries(value)) {
        const cleanedVal = cleanValue(val);
        if (cleanedVal !== undefined) {
          cleanedObj[key] = cleanedVal;
        }
      }
      return Object.keys(cleanedObj).length > 0 ? cleanedObj : undefined;
    }
    
    return value;
  };

  // Helper function to save form state to localStorage
  const saveFormState = (data: T) => {
    try {
      // Clean the data before saving - remove undefined values and corrupted objects
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        const cleanedValue = cleanValue(value);
        if (cleanedValue !== undefined) {
          acc[key] = cleanedValue;
        }
        return acc;
      }, {} as any);
      
      localStorage.setItem(storageKey, JSON.stringify(cleanData));
      console.log('Form state saved to localStorage:', storageKey, cleanData);
    } catch (error) {
      console.error('Error saving form state:', error);
    }
  };

  // Helper function to load form state from localStorage
  const loadFormState = (): T | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Clean any corrupted values from the parsed data
        const cleanedParsed = Object.entries(parsed).reduce((acc, [key, value]) => {
          const cleanedValue = cleanValue(value);
          if (cleanedValue !== undefined) {
            acc[key] = cleanedValue;
          }
          return acc;
        }, {} as any);
        
        console.log('Form state loaded from localStorage:', storageKey, cleanedParsed);
        return cleanedParsed;
      }
    } catch (error) {
      console.error('Error parsing saved form state:', error);
      localStorage.removeItem(storageKey);
    }
    return null;
  };

  // Initialize form state from localStorage on component mount
  useEffect(() => {
    console.log('Initializing form state for:', storageKey);
    const savedState = loadFormState();
    
    if (savedState && Object.keys(savedState).length > 0) {
      console.log('Restoring saved state:', savedState);
      // Merge saved state with default values to ensure all fields exist
      const mergedState = { ...defaultValues, ...savedState };
      setFormData(mergedState as T);
      setHasSavedDraft(true);
    } else {
      console.log('No saved state found, using defaults');
      setFormData(defaultValues as T);
      setHasSavedDraft(false);
    }
    
    setIsInitialized(true);
  }, [storageKey]);

  // Auto-save form state whenever any field changes (but only after initialization)
  useEffect(() => {
    if (!isInitialized) {
      console.log('Not initialized yet, skipping auto-save');
      return;
    }
    
    // Check if there's actually some content to save
    const hasContent = Object.values(formData).some(value => {
      const cleanedValue = cleanValue(value);
      if (cleanedValue === undefined) return false;
      
      if (typeof cleanedValue === 'string') return cleanedValue.trim().length > 0;
      if (typeof cleanedValue === 'number') return true;
      if (typeof cleanedValue === 'boolean') return true;
      if (Array.isArray(cleanedValue)) return cleanedValue.length > 0;
      if (typeof cleanedValue === 'object') return Object.keys(cleanedValue).length > 0;
      
      return true;
    });
    
    console.log('Auto-save check - hasContent:', hasContent, formData);
    
    if (hasContent) {
      saveFormState(formData);
      if (!hasSavedDraft) {
        setHasSavedDraft(true);
      }
    }
  }, [formData, isInitialized, hasSavedDraft, defaultValues, storageKey]);

  const clearDraft = () => {
    console.log('Clearing draft for:', storageKey);
    localStorage.removeItem(storageKey);
    setFormData(defaultValues as T);
    setHasSavedDraft(false);
    onClear?.();
    toast.success('Draft cleared');
  };

  const saveDraft = () => {
    saveFormState(formData);
    setHasSavedDraft(true);
    onSave?.();
    toast.success('Draft saved successfully!');
  };

  const updateField = <K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearDraftOnSubmit = () => {
    localStorage.removeItem(storageKey);
    setHasSavedDraft(false);
  };

  return {
    formData,
    hasSavedDraft,
    isInitialized,
    updateField,
    clearDraft,
    saveDraft,
    clearDraftOnSubmit,
    setFormData
  };
};
