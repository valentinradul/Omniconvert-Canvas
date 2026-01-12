import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/context/company/CompanyContext';
import { toast } from 'sonner';

export type OAuthProvider = 'google_ads' | 'google_analytics' | 'google_search_console' | 'meta_ads' | 'linkedin_ads';

interface OAuthToken {
  id: string;
  company_id: string;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  account_id: string | null;
  account_name: string | null;
  created_at: string;
  updated_at: string;
}

interface UseOAuthReturn {
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  tokenData: OAuthToken | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const PROVIDER_CONFIG: Record<OAuthProvider, { 
  oauthFunction: string; 
  service?: string;
  name: string;
}> = {
  google_ads: { oauthFunction: 'oauth-google', service: 'ads', name: 'Google Ads' },
  google_analytics: { oauthFunction: 'oauth-google', service: 'analytics', name: 'Google Analytics' },
  google_search_console: { oauthFunction: 'oauth-google', service: 'search_console', name: 'Google Search Console' },
  meta_ads: { oauthFunction: 'oauth-meta', name: 'Meta Ads' },
  linkedin_ads: { oauthFunction: 'oauth-linkedin', name: 'LinkedIn Ads' },
};

export function useOAuth(provider: OAuthProvider): UseOAuthReturn {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [tokenData, setTokenData] = useState<OAuthToken | null>(null);

  const config = PROVIDER_CONFIG[provider];

  const refreshStatus = useCallback(async () => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('company_oauth_tokens')
        .select('*')
        .eq('company_id', companyId)
        .eq('provider', provider)
        .maybeSingle();

      if (error) {
        console.error('Error fetching OAuth status:', error);
        setIsConnected(false);
        setTokenData(null);
      } else if (data) {
        setIsConnected(true);
        setTokenData(data as OAuthToken);
      } else {
        setIsConnected(false);
        setTokenData(null);
      }
    } catch (err) {
      console.error('Error checking OAuth status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, provider]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Listen for OAuth callback messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'oauth_success' && event.data?.provider === provider) {
        toast.success(`Connected to ${config.name}!`);
        refreshStatus();
        setIsConnecting(false);
      } else if (event.data?.type === 'oauth_error' && event.data?.provider === provider) {
        toast.error(event.data.error || `Failed to connect to ${config.name}`);
        setIsConnecting(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [provider, config.name, refreshStatus]);

  const connect = useCallback(async () => {
    if (!companyId) {
      toast.error('No company selected');
      return;
    }

    setIsConnecting(true);

    try {
      // Get the redirect URI (callback page in the app)
      const redirectUri = `${window.location.origin}/oauth/callback`;

      // Get OAuth URL from edge function
      const { data, error } = await supabase.functions.invoke(config.oauthFunction, {
        body: {
          action: 'start',
          companyId,
          service: config.service,
          redirectUri,
        },
      });

      if (error || !data?.authUrl) {
        throw new Error(data?.error || 'Failed to start OAuth flow');
      }

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        data.authUrl,
        `${provider}_oauth`,
        `width=${width},height=${height},left=${left},top=${top},popup=1`
      );

      if (!popup) {
        toast.error('Please allow popups to connect your account');
        setIsConnecting(false);
        return;
      }

      // Check if popup is closed without completing
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Give a small delay to allow message to be received
          setTimeout(() => {
            setIsConnecting(false);
          }, 500);
        }
      }, 500);
    } catch (err: any) {
      console.error('OAuth connect error:', err);
      toast.error(err.message || `Failed to connect to ${config.name}`);
      setIsConnecting(false);
    }
  }, [companyId, config, provider]);

  const disconnect = useCallback(async (): Promise<boolean> => {
    if (!companyId) return false;

    try {
      const { error } = await supabase.functions.invoke(config.oauthFunction, {
        body: {
          action: 'disconnect',
          companyId,
          service: config.service,
        },
      });

      if (error) throw error;

      setIsConnected(false);
      setTokenData(null);
      toast.success(`Disconnected from ${config.name}`);
      return true;
    } catch (err: any) {
      console.error('OAuth disconnect error:', err);
      toast.error(`Failed to disconnect from ${config.name}`);
      return false;
    }
  }, [companyId, config]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!tokenData) return null;

    // Check if token is expired
    if (tokenData.token_expires_at) {
      const expiresAt = new Date(tokenData.token_expires_at);
      const now = new Date();
      
      // If token expires in less than 5 minutes, refresh it
      if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
        try {
          const { data, error } = await supabase.functions.invoke(config.oauthFunction, {
            body: {
              action: 'refresh',
              companyId,
              service: config.service,
            },
          });

          if (error || !data?.access_token) {
            console.error('Failed to refresh token:', error);
            return tokenData.access_token;
          }

          // Update local state
          setTokenData(prev => prev ? { ...prev, access_token: data.access_token } : null);
          return data.access_token;
        } catch (err) {
          console.error('Token refresh error:', err);
          return tokenData.access_token;
        }
      }
    }

    return tokenData.access_token;
  }, [tokenData, companyId, config]);

  return {
    isConnected,
    isLoading,
    isConnecting,
    tokenData,
    connect,
    disconnect,
    refreshStatus,
    getAccessToken,
  };
}
