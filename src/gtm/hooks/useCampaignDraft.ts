import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCampaignDraftOptions<T> {
  storageKey: string;
  defaultValues: T;
  autoSaveInterval?: number; // in milliseconds, 0 to disable
}

export function useCampaignDraft<T extends Record<string, any>>({
  storageKey,
  defaultValues,
  autoSaveInterval = 5000, // Auto-save every 5 seconds by default
}: UseCampaignDraftOptions<T>) {
  const [formData, setFormData] = useState<T>(defaultValues);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const formDataRef = useRef(formData);

  // Keep ref in sync with state
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        // Merge with defaults to ensure all fields exist
        const mergedData = { ...defaultValues, ...parsed.data };
        setFormData(mergedData);
        setHasSavedDraft(true);
        if (parsed.savedAt) {
          setLastSaved(new Date(parsed.savedAt));
        }
      }
    } catch (error) {
      console.warn('Failed to load draft:', error);
    }
    setIsInitialized(true);
  }, [storageKey]); // Only run on mount

  // Auto-save interval
  useEffect(() => {
    if (!isInitialized || autoSaveInterval <= 0) return;

    const intervalId = setInterval(() => {
      saveDraftToStorage(formDataRef.current);
    }, autoSaveInterval);

    return () => clearInterval(intervalId);
  }, [isInitialized, autoSaveInterval, storageKey]);

  // Save draft to localStorage
  const saveDraftToStorage = useCallback((data: T) => {
    try {
      const draftData = {
        data,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(draftData));
      setLastSaved(new Date());
      setHasSavedDraft(true);
    } catch (error) {
      console.warn('Failed to save draft:', error);
    }
  }, [storageKey]);

  // Manual save draft
  const saveDraft = useCallback(() => {
    saveDraftToStorage(formData);
  }, [formData, saveDraftToStorage]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasSavedDraft(false);
      setLastSaved(null);
    } catch (error) {
      console.warn('Failed to clear draft:', error);
    }
  }, [storageKey]);

  // Reset form to defaults and clear draft
  const resetForm = useCallback(() => {
    setFormData(defaultValues);
    clearDraft();
  }, [defaultValues, clearDraft]);

  // Update a single field
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update multiple fields at once
  const updateFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Clear draft after successful save (call this after database save succeeds)
  const onSaveSuccess = useCallback(() => {
    clearDraft();
    setFormData(defaultValues);
  }, [clearDraft, defaultValues]);

  return {
    formData,
    setFormData,
    updateField,
    updateFields,
    hasSavedDraft,
    isInitialized,
    lastSaved,
    saveDraft,
    clearDraft,
    resetForm,
    onSaveSuccess,
  };
}
