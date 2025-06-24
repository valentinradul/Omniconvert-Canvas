
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Hypothesis, PECTI, ObservationContent } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import ObservationContentEditor from '@/components/ObservationContentEditor';
import DraftIndicator from '@/components/DraftIndicator';
import { toast } from 'sonner';
import { useDraftState } from '@/hooks/useDraftState';

const formSchema = z.object({
  observation: z.string().min(1, { message: 'Observation is required' }),
  initiative: z.string().min(1, { message: 'Initiative is required' }),
  metric: z.string().min(1, { message: 'Metric is required' }),
});

interface EditHypothesisFormProps {
  hypothesis: Hypothesis;
  onSave: (updatedHypothesis: Partial<Hypothesis>) => void;
  onCancel: () => void;
}

const EditHypothesisForm: React.FC<EditHypothesisFormProps> = ({ 
  hypothesis, 
  onSave, 
  onCancel 
}) => {
  const defaultValues = {
    observation: hypothesis.observation || '',
    initiative: hypothesis.initiative || '',
    metric: hypothesis.metric || '',
    observationContent: hypothesis.observationContent || { 
      text: hypothesis.observation || '', 
      externalUrls: [], 
      imageUrls: [] 
    }
  };

  const {
    formData,
    hasSavedDraft,
    updateField,
    clearDraft,
    saveDraft,
    clearDraftOnSubmit
  } = useDraftState({
    storageKey: `edit-hypothesis-${hypothesis.id}`,
    defaultValues
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      observation: formData.observation,
      initiative: formData.initiative,
      metric: formData.metric,
    },
  });

  // Update form values when formData changes
  useEffect(() => {
    form.setValue('observation', formData.observation);
    form.setValue('initiative', formData.initiative);
    form.setValue('metric', formData.metric);
  }, [formData, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const updatedHypothesis: Partial<Hypothesis> = {
      observation: values.observation,
      initiative: values.initiative,
      metric: values.metric,
      observationContent: formData.observationContent
    };

    onSave(updatedHypothesis);
    clearDraftOnSubmit();
    toast.success('Hypothesis updated successfully');
  };

  const handleObservationChange = (content: ObservationContent) => {
    updateField('observationContent', content);
    updateField('observation', content.text);
    form.setValue('observation', content.text);
  };

  const handleCancel = () => {
    clearDraft();
    onCancel();
  };

  return (
    <div className="space-y-6">
      <DraftIndicator
        hasSavedDraft={hasSavedDraft}
        onSaveDraft={saveDraft}
        onClearDraft={clearDraft}
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="observation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Because we observed:</FormLabel>
                  <ObservationContentEditor
                    value={formData.observationContent}
                    onChange={handleObservationChange}
                    showTextArea={true}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initiative"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>We will do:</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what you will do"
                      value={formData.initiative}
                      onChange={(e) => {
                        updateField('initiative', e.target.value);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metric"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>With the measurable goal to improve:</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the metric you want to improve"
                      value={formData.metric}
                      onChange={(e) => {
                        updateField('metric', e.target.value);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel} type="button">
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditHypothesisForm;
