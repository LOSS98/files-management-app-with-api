export const config = {
    // Environment
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Server Configuration
    port: parseInt(process.env.BACKEND_PORT || '3001', 10),
    host: '0.0.0.0',
    
    // Domain Configuration
    backendDomain: process.env.BACKEND_DOMAIN || 'localhost',
    backendProtocol: process.env.BACKEND_PROTOCOL || 'http',
    frontendDomain: process.env.FRONTEND_DOMAIN || 'localhost',
    frontendProtocol: process.env.FRONTEND_PROTOCOL || 'http',
    frontendPort: parseInt(process.env.FRONTEND_PORT || '3002', 10),
    
    // Production Domain
    productionDomain: process.env.PRODUCTION_DOMAIN,
    productionProtocol: process.env.PRODUCTION_PROTOCOL || 'https',
    
    // Security
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
    
    // Get full backend URL
    getBackendUrl(): string {
        if (this.nodeEnv === 'production' && this.productionDomain) {
            return `${this.productionProtocol}://${this.productionDomain}`;
        }
        return `${this.backendProtocol}://${this.backendDomain}:${this.port}`;
    },
    
    // Get full frontend URL
    getFrontendUrl(): string {
        if (this.nodeEnv === 'production' && this.productionDomain) {
            return `${this.productionProtocol}://${this.productionDomain}`;
        }
        return `${this.frontendProtocol}://${this.frontendDomain}:${this.frontendPort}`;
    },
    
    // Get CORS origins
    getCorsOrigins(): string[] | boolean {
        if (this.nodeEnv === 'production') {
            const origins = [this.getFrontendUrl()];
            if (this.productionDomain) {
                origins.push(`${this.productionProtocol}://${this.productionDomain}`);
                origins.push(`${this.productionProtocol}://www.${this.productionDomain}`);
            }
            return origins;
        }
        return true; // Allow all origins in development
    }
};