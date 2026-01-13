import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';
import { useAuth } from '@/context/AuthContext';

export interface HubSpotPipeline {
  id: string;
  label: string;
  stages: { id: string; label: string }[];
}

export interface HubSpotProperty {
  name: string;
  label: string;
  type: string;
  fieldType: string;
}

export interface HubSpotDealPreview {
  id: string;
  name: string;
  amount: number;
  closeDate: string | null;
  stageId: string | null;
  pipelineId: string | null;
  forecastCategory: string | null;
  dealType: string | null;
  rawProperties: Record<string, string | null>;
}

export interface StageMapping {
  stageId: string;
  stageName: string;
  targetMetricId?: string;
  includeInSync: boolean;
}

export interface FieldMapping {
  clientNameField: string;
  amountField: string;
  closeDateField: string;
  countryField?: string;
  dealTypeField?: string; // For inbound/outbound classification
}

export interface HubSpotConfig {
  pipelines: string[];
  selectedStages: string[];
  stageMapping: StageMapping[];
  fieldMapping: FieldMapping;
}

export interface IntegrationStatus {
  isConnected: boolean;
  isActive: boolean;
  lastSyncAt: string | null;
  config: HubSpotConfig | null;
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

export function useHubSpotIntegration() {
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
        .eq('integration_type', 'hubspot')
        .maybeSingle();

      if (error) {
        console.error('Error fetching integration status:', error);
        setStatus({ isConnected: false, isActive: false, lastSyncAt: null, config: null });
      } else if (data) {
        const configData = data.config as unknown as HubSpotConfig | null;
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
        .eq('integration_type', 'hubspot')
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

  const getPipelines = async (accessToken?: string): Promise<HubSpotPipeline[]> => {
    if (!selectedCompanyId || !session?.access_token) {
      throw new Error('Not authenticated or no company selected');
    }

    const response = await supabase.functions.invoke('hubspot-sync', {
      body: {
        action: 'get-pipelines',
        companyId: selectedCompanyId,
        accessToken: accessToken || undefined,
        useStoredCredentials: !accessToken
      }
    });

    if (response.error) throw new Error(response.error.message || 'Failed to get pipelines');
    if (response.data.error) throw new Error(response.data.error);

    return response.data.pipelines || [];
  };

  const getDealProperties = async (accessToken?: string): Promise<HubSpotProperty[]> => {
    if (!selectedCompanyId || !session?.access_token) {
      throw new Error('Not authenticated or no company selected');
    }

    const response = await supabase.functions.invoke('hubspot-sync', {
      body: {
        action: 'get-deal-properties',
        companyId: selectedCompanyId,
        accessToken: accessToken || undefined,
        useStoredCredentials: !accessToken
      }
    });

    if (response.error) throw new Error(response.error.message || 'Failed to get deal properties');
    if (response.data.error) throw new Error(response.data.error);

    return response.data.properties || [];
  };

  const fetchDealsPreview = async (
    accessToken: string | undefined, 
    selectedStages: string[], 
    fieldMapping: FieldMapping,
    options?: {
      dateFrom?: string | null;
      dateTo?: string | null;
      sortBy?: 'closeDate' | 'amount' | 'name';
      sortOrder?: 'asc' | 'desc';
      dealTypeFilter?: 'all' | 'inbound' | 'outbound';
    }
  ): Promise<{ deals: HubSpotDealPreview[]; totalCount: number; filteredCount: number }> => {
    if (!selectedCompanyId || !session?.access_token) {
      throw new Error('Not authenticated or no company selected');
    }

    const response = await supabase.functions.invoke('hubspot-sync', {
      body: {
        action: 'fetch-deals',
        companyId: selectedCompanyId,
        accessToken: accessToken || undefined,
        useStoredCredentials: !accessToken,
        selectedStages,
        fieldMapping,
        dateFrom: options?.dateFrom || null,
        dateTo: options?.dateTo || null,
        sortBy: options?.sortBy || 'closeDate',
        sortOrder: options?.sortOrder || 'desc',
        dealTypeFilter: options?.dealTypeFilter || 'all'
      }
    });

    if (response.error) throw new Error(response.error.message || 'Failed to fetch deals');
    if (response.data.error) throw new Error(response.data.error);

    return {
      deals: response.data.deals || [],
      totalCount: response.data.totalCount || 0,
      filteredCount: response.data.filteredCount || 0
    };
  };

  const saveConfig = async (accessToken: string | undefined, config: HubSpotConfig): Promise<void> => {
    if (!selectedCompanyId || !session?.access_token) {
      throw new Error('Not authenticated or no company selected');
    }

    const response = await supabase.functions.invoke('hubspot-sync', {
      body: {
        action: 'save-config',
        companyId: selectedCompanyId,
        accessToken: accessToken || undefined,
        useStoredCredentials: !accessToken,
        config
      }
    });

    if (response.error) throw new Error(response.error.message || 'Failed to save configuration');
    if (response.data.error) throw new Error(response.data.error);

    await fetchStatus();
  };

  const syncNow = async (): Promise<{ dealsProcessed: number; recordsCreated: number; recordsUpdated: number; recordsSkipped: number }> => {
    if (!selectedCompanyId || !session?.access_token) {
      throw new Error('Not authenticated or no company selected');
    }

    setIsSyncing(true);
    try {
      const response = await supabase.functions.invoke('hubspot-sync', {
        body: {
          action: 'sync',
          companyId: selectedCompanyId
        }
      });

      if (response.error) throw new Error(response.error.message || 'Sync failed');

      await fetchStatus();
      await fetchSyncHistory();

      return {
        dealsProcessed: response.data.dealsProcessed || 0,
        recordsCreated: response.data.recordsCreated || 0,
        recordsUpdated: response.data.recordsUpdated || 0,
        recordsSkipped: response.data.recordsSkipped || 0
      };
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnect = async (): Promise<void> => {
    if (!selectedCompanyId || !session?.access_token) {
      throw new Error('Not authenticated or no company selected');
    }

    const response = await supabase.functions.invoke('hubspot-sync', {
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
    getPipelines,
    getDealProperties,
    fetchDealsPreview,
    saveConfig,
    syncNow,
    disconnect,
    refetch: fetchStatus
  };
}
