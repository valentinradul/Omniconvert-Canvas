
export const cleanupAuthState = () => {
  try {
    console.log('Starting comprehensive auth state cleanup...');
    
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || 
          key.includes('sb-') || 
          key.startsWith('supabase-auth-token') ||
          key.includes('auth-token') ||
          key.includes('access-token') ||
          key.includes('refresh-token')) {
        console.log('Removing localStorage key:', key);
        localStorage.removeItem(key);
      }
    });
    
    // Remove from sessionStorage if it exists
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || 
            key.includes('sb-') ||
            key.startsWith('supabase-auth-token') ||
            key.includes('auth-token') ||
            key.includes('access-token') ||
            key.includes('refresh-token')) {
          console.log('Removing sessionStorage key:', key);
          sessionStorage.removeItem(key);
        }
      });
    }
    
    // Clear any company-related storage as well
    localStorage.removeItem('currentCompanyId');
    localStorage.removeItem('userCompanies');
    
    // Clear any cached user data
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    
    console.log('Auth state cleanup completed successfully');
  } catch (error) {
    console.error('Error cleaning up auth state:', error);
  }
};

// Enhanced cleanup that also clears browser auth caches
export const deepCleanupAuthState = async () => {
  try {
    console.log('Starting deep auth state cleanup...');
    
    // First do the regular cleanup
    cleanupAuthState();
    
    // Clear any browser-cached credentials
    if ('credentials' in navigator) {
      try {
        // This helps clear any stored browser credentials
        await navigator.credentials.preventSilentAccess?.();
        console.log('Browser credentials cache cleared');
      } catch (err) {
        console.log('Could not clear browser credentials cache (not supported)');
      }
    }
    
    // Force a small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('Deep auth state cleanup completed');
  } catch (error) {
    console.error('Error during deep cleanup:', error);
  }
};
