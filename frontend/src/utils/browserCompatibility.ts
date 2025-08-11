/**
 * Browser Compatibility Utilities
 * Handles browser-specific issues and compatibility concerns
 */

export const suppressBrowserExtensionErrors = () => {
  // Prevent browser extension errors from appearing in the console
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ').toLowerCase();
    
    // Filter out common browser extension errors
    const extensionErrorPatterns = [
      'extension context invalidated',
      'could not establish connection',
      'message port closed',
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'ms-browser-extension://',
      'non-error promise rejection captured',
      'script error',
      'network error when attempting to fetch resource'
    ];
    
    const shouldSuppress = extensionErrorPatterns.some(pattern => 
      errorMessage.includes(pattern)
    );
    
    if (!shouldSuppress) {
      originalError.apply(console, args);
    }
  };
};

/**
 * Initialize browser compatibility features
 * This function should be called once when the app starts
 */
export const initBrowserCompatibility = () => {
  suppressBrowserExtensionErrors();
  
  // Only log in development mode
  if (import.meta.env.DEV) {
    console.log('🛡️ Browser compatibility features initialized');
  }
};