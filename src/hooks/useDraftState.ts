
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

  // Helper function to save form state to localStorage
  const saveFormState = (data: T) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log('Form state saved to localStorage:', storageKey, data);
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
        console.log('Form state loaded from localStorage:', storageKey, parsed);
        return parsed;
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
    
    if (savedState) {
      console.log('Restoring saved state:', savedState);
      setFormData(savedState);
      setHasSavedDraft(true);
    } else {
      console.log('No saved state found, using defaults');
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
      if (typeof value === 'string') return value.trim();
      if (typeof value === 'number') return value !== (defaultValues as any)[Object.keys(formData).find(k => formData[k as keyof T] === value) as string];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
      return value !== undefined && value !== null;
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
