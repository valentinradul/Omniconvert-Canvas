
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Hypothesis, PECTI } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ObservationContentEditor from '@/components/ObservationContentEditor';
import { toast } from 'sonner';

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
  const [observationContent, setObservationContent] = useState(
    hypothesis.observationContent || { text: hypothesis.observation || '', externalUrls: [], imageUrls: [] }
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      observation: hypothesis.observation || '',
      initiative: hypothesis.initiative || '',
      metric: hypothesis.metric || '',
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const updatedHypothesis: Partial<Hypothesis> = {
      observation: values.observation,
      initiative: values.initiative,
      metric: values.metric,
      observationContent
    };

    onSave(updatedHypothesis);
    toast.success('Hypothesis updated successfully');
  };

  const handleObservationChange = (content: typeof observationContent) => {
    setObservationContent(content);
    form.setValue('observation', content.text);
  };

  return (
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
                  value={observationContent}
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
                    {...field}
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
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditHypothesisForm;
