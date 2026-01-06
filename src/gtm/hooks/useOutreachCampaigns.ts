import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import type { OutreachCampaign } from '../types';

export const useOutreachCampaigns = () => {
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentCompany } = useCompany();
  const { user } = useAuth();

  const fetchCampaigns = useCallback(async () => {
    if (!user) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('gtm_outreach_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (currentCompany) {
        query = query.eq('company_id', currentCompany.id);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      setCampaigns((data || []) as OutreachCampaign[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
      console.error('Error fetching outreach campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentCompany]);

  const createCampaign = async (campaign: Omit<OutreachCampaign, 'id' | 'created_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error: insertError } = await supabase
        .from('gtm_outreach_campaigns')
        .insert([{
          ...campaign,
          user_id: user.id,
          company_id: currentCompany?.id || null,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      const newCampaign = data as OutreachCampaign;
      setCampaigns(prev => [newCampaign, ...prev]);
      return newCampaign;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
      throw err;
    }
  };

  const updateCampaign = async (id: string, updates: Partial<OutreachCampaign>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('gtm_outreach_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updatedCampaign = data as OutreachCampaign;
      setCampaigns(prev => prev.map(c => c.id === id ? updatedCampaign : c));
      return updatedCampaign;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update campaign');
      throw err;
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('gtm_outreach_campaigns')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign');
      throw err;
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    refetch: fetchCampaigns,
  };
};
