export const config = {
    // Get API base URL from environment variables
    getApiBaseUrl(): string {
        // In production, use the production domain
        if (import.meta.env.PROD) {
            const productionDomain = import.meta.env.VITE_PRODUCTION_DOMAIN;
            const productionProtocol = import.meta.env.VITE_PRODUCTION_PROTOCOL || 'https';
            
            if (productionDomain) {
                return `${productionProtocol}://${productionDomain}/api`;
            }
        }
        
        // In development, use backend domain and port
        const backendDomain = import.meta.env.VITE_BACKEND_DOMAIN || 'localhost';
        const backendPort = import.meta.env.VITE_BACKEND_PORT || '3001';
        const backendProtocol = import.meta.env.VITE_BACKEND_PROTOCOL || 'http';
        
        return `${backendProtocol}://${backendDomain}:${backendPort}/api`;
    }
};