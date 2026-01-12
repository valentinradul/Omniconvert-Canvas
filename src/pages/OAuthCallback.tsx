import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage(errorDescription || error);
        
        // Notify parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth_error',
            error: errorDescription || error,
          }, window.location.origin);
        }
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Missing authorization code or state');
        return;
      }

      try {
        // Decode state to determine provider
        const stateData = JSON.parse(atob(state));
        const { service } = stateData;

        // Determine which OAuth function to call
        let oauthFunction = 'oauth-google';
        let provider = 'google_ads';

        if (service === 'analytics') {
          provider = 'google_analytics';
        } else if (service === 'search_console') {
          provider = 'google_search_console';
        } else if (!service) {
          // Check URL for hints about provider
          const referer = document.referrer;
          if (referer.includes('facebook.com') || referer.includes('meta.com')) {
            oauthFunction = 'oauth-meta';
            provider = 'meta_ads';
          } else if (referer.includes('linkedin.com')) {
            oauthFunction = 'oauth-linkedin';
            provider = 'linkedin_ads';
          }
        }

        // Exchange code for tokens
        const { data, error: exchangeError } = await supabase.functions.invoke(oauthFunction, {
          body: {
            action: 'callback',
            code,
            state,
            redirectUri: window.location.origin + '/oauth/callback',
          },
        });

        if (exchangeError || !data?.success) {
          throw new Error(data?.error || 'Failed to complete authorization');
        }

        setStatus('success');
        setMessage(`Successfully connected!`);

        // Notify parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth_success',
            provider: data.provider || provider,
          }, window.location.origin);

          // Close popup after a short delay
          setTimeout(() => {
            window.close();
          }, 1500);
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage(err.message || 'Authorization failed');

        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth_error',
            error: err.message,
          }, window.location.origin);
        }
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-lg text-muted-foreground">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <p className="text-lg font-medium text-green-600">{message}</p>
            <p className="text-sm text-muted-foreground">This window will close automatically...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-red-500" />
            <p className="text-lg font-medium text-red-600">Authorization Failed</p>
            <p className="text-sm text-muted-foreground">{message}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
}
