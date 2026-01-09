import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';
import { toast } from 'sonner';

interface Site {
  siteUrl: string;
  permissionLevel: string;
}

interface SyncHistoryEntry {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  records_processed: number | null;
  error_message: string | null;
}

export function useGoogleSearchConsoleIntegration() {
  const { currentCompany } = useCompany();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [integrationId, setIntegrationId] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [config, setConfig] = useState<any>(null);

  const fetchIntegrationStatus = useCallback(async () => {
    if (!currentCompany?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: integration, error } = await supabase
        .from('company_integrations')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('integration_type', 'google_search_console')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching integration:', error);
        return;
      }

      if (integration) {
        setIntegrationId(integration.id);
        setIsConnected(integration.is_active);
        setLastSyncAt(integration.last_sync_at);
        setConfig(integration.config);

        // Fetch sync history
        const { data: history } = await supabase
          .from('integration_sync_log')
          .select('*')
          .eq('integration_id', integration.id)
          .order('started_at', { ascending: false })
          .limit(10);

        if (history) {
          setSyncHistory(history);
        }
      }
    } catch (error) {
      console.error('Error checking integration status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    fetchIntegrationStatus();
  }, [fetchIntegrationStatus]);

  const testConnection = async (credentials: {
    accessToken: string;
    refreshToken: string;
    clientId: string;
    clientSecret: string;
  }) => {
    if (!currentCompany?.id) {
      toast.error('No company selected');
      return null;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('fetch-google-search-console', {
        body: {
          action: 'test-connection',
          companyId: currentCompany.id,
          credentials,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data.success) throw new Error(response.data.error);

      setIntegrationId(response.data.integrationId);
      setSites(response.data.sites || []);
      toast.success('Successfully connected to Google Search Console');
      return response.data;
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect');
      return null;
    }
  };

  const saveConfig = async (siteUrl: string, dateRangePreset: string) => {
    if (!integrationId) {
      toast.error('No integration found');
      return false;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('fetch-google-search-console', {
        body: {
          action: 'save-config',
          integrationId,
          config: {
            siteUrl,
            dateRangePreset,
          },
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data.success) throw new Error(response.data.error);

      setIsConnected(true);
      setSelectedSite(siteUrl);
      toast.success('Configuration saved successfully');
      await fetchIntegrationStatus();
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
      return false;
    }
  };

  const syncData = async () => {
    if (!integrationId) {
      toast.error('No integration found');
      return false;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      toast.info('Syncing data from Google Search Console...');

      const response = await supabase.functions.invoke('fetch-google-search-console', {
        body: {
          action: 'sync',
          integrationId,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data.success) throw new Error(response.data.error);

      toast.success(`Synced ${response.data.recordsSynced} records successfully`);
      await fetchIntegrationStatus();
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync data');
      return false;
    }
  };

  const disconnect = async () => {
    if (!integrationId) {
      toast.error('No integration found');
      return false;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('fetch-google-search-console', {
        body: {
          action: 'disconnect',
          integrationId,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data.success) throw new Error(response.data.error);

      setIsConnected(false);
      setIntegrationId(null);
      setSites([]);
      setSelectedSite('');
      setSyncHistory([]);
      setConfig(null);
      toast.success('Disconnected from Google Search Console');
      return true;
    } catch (error) {
      console.error('Disconnect failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect');
      return false;
    }
  };

  return {
    isConnected,
    isLoading,
    integrationId,
    sites,
    selectedSite,
    lastSyncAt,
    syncHistory,
    config,
    testConnection,
    saveConfig,
    syncData,
    disconnect,
    refreshStatus: fetchIntegrationStatus,
  };
}
