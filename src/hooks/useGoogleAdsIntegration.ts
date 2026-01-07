import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';
import { useAuth } from '@/context/AuthContext';

export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: string;
  channelType?: string;
}

export interface GoogleAdsConfig {
  customerId: string;
  selectedCampaigns: string[];
  dateRangePreset: 'last_7d' | 'last_30d' | 'last_90d' | 'custom';
  customDateRange?: { from: string; to: string };
}

export interface IntegrationStatus {
  isConnected: boolean;
  isActive: boolean;
  lastSyncAt: string | null;
  config: GoogleAdsConfig | null;
}

export interface SyncLogEntry {
  id: string;
  syncType: string;
  status: string;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export function useGoogleAdsIntegration() {
  const { currentCompany } = useCompany();
  const { session } = useAuth();
  const selectedCompanyId = currentCompany?.id || null;
  
  const [status, setStatus] = useState<IntegrationStatus>({
    isConnected: false,
    isActive: false,
    lastSyncAt: null,
    config: null
  });
  const [syncHistory, setSyncHistory] = useState<SyncLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!selectedCompanyId) {
      setStatus({ isConnected: false, isActive: false, lastSyncAt: null, config: null });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_integrations')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('integration_type', 'google_ads')
        .maybeSingle();

      if (error) {
        console.error('Error fetching integration status:', error);
        setStatus({ isConnected: false, isActive: false, lastSyncAt: null, config: null });
      } else if (data) {
        const configData = data.config as unknown as GoogleAdsConfig | null;
        setStatus({
          isConnected: !!data.encrypted_credentials,
          isActive: data.is_active,
          lastSyncAt: data.last_sync_at,
          config: configData
        });
      } else {
        setStatus({ isConnected: false, isActive: false, lastSyncAt: null, config: null });
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId]);

  const fetchSyncHistory = useCallback(async () => {
    if (!selectedCompanyId) {
      setSyncHistory([]);
      return;
    }

    try {
      const { data: integration } = await supabase
        .from('company_integrations')
        .select('id')
        .eq('company_id', selectedCompanyId)
        .eq('integration_type', 'google_ads')
        .maybeSingle();

      if (!integration) {
        setSyncHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from('integration_sync_log')
        .select('*')
        .eq('integration_id', integration.id)
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching sync history:', error);
      } else {
        setSyncHistory((data || []).map(log => ({
          id: log.id,
          syncType: log.sync_type,
          status: log.status,
          recordsProcessed: log.records_processed || 0,
          recordsCreated: log.records_created || 0,
          recordsUpdated: log.records_updated || 0,
          errorMessage: log.error_message,
          startedAt: log.started_at,
          completedAt: log.completed_at
        })));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    fetchStatus();
    fetchSyncHistory();
  }, [fetchStatus, fetchSyncHistory]);

  const testConnection = async (
    accessToken: string, 
    customerId: string, 
    developerToken: string
  ): Promise<boolean> => {
    if (!selectedCompanyId || !session?.access_token) {
      throw new Error('Not authenticated or no company selected');
    }

    const response = await supabase.functions.invoke('fetch-google-ads', {
      body: {
        action: 'test-connection',
        companyId: selectedCompanyId,
        accessToken,
        customerId,
        developerToken
      }
    });

    if (response.error) throw new Error(response.error.message || 'Failed to test connection');
    if (response.data.error) throw new Error(response.data.error);

    return response.data.success || false;
  };

  const getCampaigns = async (
    accessToken: string, 
    customerId: string, 
    developerToken: string
  ): Promise<GoogleAdsCampaign[]> => {
    if (!selectedCompanyId || !session?.access_token) {
      throw new Error('Not authenticated or no company selected');
    }

    const response = await supabase.functions.invoke('fetch-google-ads', {
      body: {
        action: 'get-campaigns',
        companyId: selectedCompanyId,
        accessToken,
        customerId,
        developerToken
      }
    });

    if (response.error) throw new Error(response.error.message || 'Failed to get campaigns');
    if (response.data.error) throw new Error(response.data.error);

    return response.data.campaigns || [];
  };

  const saveConfig = async (
    accessToken: string, 
    refreshToken: string,
    customerId: string,
    developerToken: string,
    config: GoogleAdsConfig
  ): Promise<void> => {
    if (!selectedCompanyId || !session?.access_token) {
      throw new Error('Not authenticated or no company selected');
    }

    const response = await supabase.functions.invoke('fetch-google-ads', {
      body: {
        action: 'save-config',
        companyId: selectedCompanyId,
        accessToken,
        refreshToken,
        customerId,
        developerToken,
        config
      }
    });

    if (response.error) throw new Error(response.error.message || 'Failed to save configuration');
    if (response.data.error) throw new Error(response.data.error);

    await fetchStatus();
  };

  const syncNow = async (): Promise<{ campaignsProcessed: number; recordsCreated: number; recordsUpdated: number }> => {
    if (!selectedCompanyId || !session?.access_token) {
      throw new Error('Not authenticated or no company selected');
    }

    setIsSyncing(true);
    try {
      const response = await supabase.functions.invoke('fetch-google-ads', {
        body: {
          action: 'sync',
          companyId: selectedCompanyId
        }
      });

      if (response.error) throw new Error(response.error.message || 'Sync failed');
      if (response.data.error) throw new Error(response.data.error);

      await fetchStatus();
      await fetchSyncHistory();

      return {
        campaignsProcessed: response.data.campaignsProcessed || 0,
        recordsCreated: response.data.recordsCreated || 0,
        recordsUpdated: response.data.recordsUpdated || 0
      };
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnect = async (): Promise<void> => {
    if (!selectedCompanyId || !session?.access_token) {
      throw new Error('Not authenticated or no company selected');
    }

    const response = await supabase.functions.invoke('fetch-google-ads', {
      body: {
        action: 'disconnect',
        companyId: selectedCompanyId
      }
    });

    if (response.error) throw new Error(response.error.message || 'Failed to disconnect');

    await fetchStatus();
  };

  return {
    status,
    syncHistory,
    isLoading,
    isSyncing,
    testConnection,
    getCampaigns,
    saveConfig,
    syncNow,
    disconnect,
    refetch: fetchStatus
  };
}
