
// Network interceptor for debugging API requests + ngrok compatibility
export function installNetworkInterceptor() {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;
  
  window.fetch = async function(...args: Parameters<typeof fetch>): Promise<Response> {
    const [resource, config] = args;
    const url = typeof resource === 'string' ? resource : resource.url;
    const method = config?.method || 'GET';
    
    // Add ngrok headers to all requests
    const headers = new Headers(config?.headers);
    headers.set('ngrok-skip-browser-warning', 'true');
    headers.set('User-Agent', 'Hamly-App/1.0');
    
    const newConfig: RequestInit = {
      ...config,
      headers,
      mode: 'cors',
      credentials: 'omit',
    };
    
    console.log(`[NETWORK_INTERCEPTOR] 🌐 Request: ${method} ${url}`);
    console.log(`[NETWORK_INTERCEPTOR] 📋 Headers:`, Object.fromEntries(headers.entries()));
    
    try {
      const response = await originalFetch(resource, newConfig);
      console.log(`[NETWORK_INTERCEPTOR] ✅ Response: ${method} ${url} - Status: ${response.status}`);
      return response;
    } catch (error) {
      console.error(`[NETWORK_INTERCEPTOR] ❌ Error: ${method} ${url}`, error);
      throw error;
    }
  };
  
  console.log('[NETWORK_INTERCEPTOR] 📡 Network interceptor installed (with ngrok support)');
}
