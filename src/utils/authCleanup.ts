
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
          key.includes('refresh-token') ||
          key.includes('session')) {
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
            key.includes('refresh-token') ||
            key.includes('session')) {
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
    
    // Clear any IndexedDB storage that might contain auth data
    if ('indexedDB' in window) {
      try {
        // List all databases and clear any that might contain auth data
        if (indexedDB.databases) {
          const databases = await indexedDB.databases();
          for (const db of databases) {
            if (db.name && (db.name.includes('supabase') || db.name.includes('auth'))) {
              console.log('Clearing IndexedDB:', db.name);
              indexedDB.deleteDatabase(db.name);
            }
          }
        }
      } catch (err) {
        console.log('Could not clear IndexedDB (not supported or access denied)');
      }
    }
    
    // Force a small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Deep auth state cleanup completed');
  } catch (error) {
    console.error('Error during deep cleanup:', error);
  }
};

// Ultra cleanup for persistent login issues
export const ultraCleanupAuthState = async () => {
  try {
    console.log('Starting ultra auth state cleanup...');
    
    // Do deep cleanup first
    await deepCleanupAuthState();
    
    // Clear all possible storage mechanisms
    try {
      // Clear all localStorage
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        if (key.toLowerCase().includes('auth') || 
            key.toLowerCase().includes('token') || 
            key.toLowerCase().includes('session') ||
            key.toLowerCase().includes('supabase')) {
          console.log('Ultra cleanup removing localStorage key:', key);
          localStorage.removeItem(key);
        }
      });
      
      // Clear all sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        const sessionStorageKeys = Object.keys(sessionStorage);
        sessionStorageKeys.forEach(key => {
          if (key.toLowerCase().includes('auth') || 
              key.toLowerCase().includes('token') || 
              key.toLowerCase().includes('session') ||
              key.toLowerCase().includes('supabase')) {
            console.log('Ultra cleanup removing sessionStorage key:', key);
            sessionStorage.removeItem(key);
          }
        });
      }
      
    } catch (error) {
      console.error('Error in ultra cleanup:', error);
    }
    
    // Longer delay for ultra cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Ultra auth state cleanup completed');
  } catch (error) {
    console.error('Error during ultra cleanup:', error);
  }
};
