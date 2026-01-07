import { useState, useEffect } from 'react';
import { useCompany } from '@/context/company/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoogleAnalyticsConfig {
  propertyId: string;
  accessToken: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  selectedMetrics: string[];
  dateRangeMonths: number;
}

interface Property {
  id: string;
  name: string;
  account: string;
}

interface SyncLog {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  records_processed: number | null;
  error_message: string | null;
}

export function useGoogleAnalyticsIntegration() {
  const { currentCompany } = useCompany();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncLog[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentConfig, setCurrentConfig] = useState<{
    propertyId: string;
    selectedMetrics: string[];
    dateRangeMonths: number;
  } | null>(null);

  useEffect(() => {
    if (currentCompany?.id) {
      checkConnectionStatus();
      loadSyncHistory();
    }
  }, [currentCompany?.id]);

  const checkConnectionStatus = async () => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_integrations')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('integration_type', 'google_analytics')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking GA connection:', error);
      }

      setIsConnected(!!data?.is_active);
      setLastSyncAt(data?.last_sync_at || null);
      
      if (data?.config) {
        const config = data.config as { 
          property_id: string; 
          selected_metrics: string[]; 
          date_range_months: number 
        };
        setCurrentConfig({
          propertyId: config.property_id,
          selectedMetrics: config.selected_metrics || [],
          dateRangeMonths: config.date_range_months || 3,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSyncHistory = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data: integration } = await supabase
        .from('company_integrations')
        .select('id')
        .eq('company_id', currentCompany.id)
        .eq('integration_type', 'google_analytics')
        .single();

      if (integration) {
        const { data, error } = await supabase
          .from('integration_sync_log')
          .select('*')
          .eq('integration_id', integration.id)
          .order('started_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          setSyncHistory(data);
        }
      }
    } catch (error) {
      console.error('Error loading sync history:', error);
    }
  };

  const testConnection = async (config: GoogleAnalyticsConfig): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to continue');
        return false;
      }

      const response = await supabase.functions.invoke('fetch-google-analytics', {
        body: {
          action: 'test-connection',
          companyId: currentCompany?.id,
          config,
        },
      });

      if (response.error) {
        toast.error('Connection test failed');
        return false;
      }

      return response.data?.success || false;
    } catch (error) {
      console.error('Connection test error:', error);
      toast.error('Failed to test connection');
      return false;
    }
  };

  const fetchProperties = async (config: GoogleAnalyticsConfig): Promise<Property[]> => {
    try {
      const response = await supabase.functions.invoke('fetch-google-analytics', {
        body: {
          action: 'get-properties',
          companyId: currentCompany?.id,
          config,
        },
      });

      if (response.error || !response.data?.success) {
        toast.error('Failed to fetch properties');
        return [];
      }

      setProperties(response.data.properties);
      return response.data.properties;
    } catch (error) {
      console.error('Fetch properties error:', error);
      toast.error('Failed to fetch properties');
      return [];
    }
  };

  const saveConfiguration = async (config: GoogleAnalyticsConfig): Promise<boolean> => {
    try {
      const response = await supabase.functions.invoke('fetch-google-analytics', {
        body: {
          action: 'save-config',
          companyId: currentCompany?.id,
          config,
        },
      });

      if (response.error) {
        toast.error('Failed to save configuration');
        return false;
      }

      setIsConnected(true);
      setCurrentConfig({
        propertyId: config.propertyId,
        selectedMetrics: config.selectedMetrics,
        dateRangeMonths: config.dateRangeMonths,
      });
      toast.success('Google Analytics connected successfully');
      return true;
    } catch (error) {
      console.error('Save config error:', error);
      toast.error('Failed to save configuration');
      return false;
    }
  };

  const syncData = async (): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    setIsSyncing(true);
    try {
      const response = await supabase.functions.invoke('fetch-google-analytics', {
        body: {
          action: 'sync',
          companyId: currentCompany.id,
        },
      });

      if (response.error || !response.data?.success) {
        toast.error(response.data?.error || 'Sync failed');
        return false;
      }

      toast.success(`Synced ${response.data.recordsProcessed} records`);
      await checkConnectionStatus();
      await loadSyncHistory();
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync data');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnect = async (): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    try {
      const response = await supabase.functions.invoke('fetch-google-analytics', {
        body: {
          action: 'disconnect',
          companyId: currentCompany.id,
        },
      });

      if (response.error) {
        toast.error('Failed to disconnect');
        return false;
      }

      setIsConnected(false);
      setCurrentConfig(null);
      setLastSyncAt(null);
      setSyncHistory([]);
      toast.success('Google Analytics disconnected');
      return true;
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect');
      return false;
    }
  };

  return {
    isConnected,
    isLoading,
    isSyncing,
    lastSyncAt,
    syncHistory,
    properties,
    currentConfig,
    testConnection,
    fetchProperties,
    saveConfiguration,
    syncData,
    disconnect,
    refreshStatus: checkConnectionStatus,
  };
}
