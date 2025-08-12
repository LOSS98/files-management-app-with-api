# 🚀 Production Deployment Guide

Complete step-by-step guide for deploying File Manager to production with domain, SSL, and security best practices.

## 📋 Prerequisites

- Ubuntu 20.04+ server with root access
- Domain name pointed to your server
- Minimum 2GB RAM, 20GB storage
- Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)

## 🛠️ Step-by-Step Production Setup

### Step 1: Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 2: Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/file-manager
cd /var/www/file-manager

# Clone repository
sudo git clone https://github.com/your-username/file-manager.git .

# Install dependencies
sudo npm run install:all

# Build for production
sudo npm run build

# Set proper permissions
sudo chown -R www-data:www-data /var/www/file-manager
sudo chmod -R 755 /var/www/file-manager
```

### Step 3: Environment Configuration

```bash
# Create production environment file
sudo nano /var/www/file-manager/.env
```

Add the following configuration:
```env
NODE_ENV=production
JWT_SECRET=your-super-secure-256-bit-secret-key-change-this
ADMIN_PASSWORD=YourSecureAdminPassword123!
```

**Important Security Notes:**
- Use a strong JWT secret (minimum 32 characters)
- Use a complex admin password
- Never commit these values to version control

### Step 4: Database Setup

```bash
# Create data directories
sudo mkdir -p /var/www/file-manager/data
sudo mkdir -p /var/www/file-manager/uploads

# Set permissions
sudo chown -R www-data:www-data /var/www/file-manager/data
sudo chown -R www-data:www-data /var/www/file-manager/uploads
sudo chmod -R 755 /var/www/file-manager/data
sudo chmod -R 755 /var/www/file-manager/uploads
```

### Step 5: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Create File Manager configuration
sudo nano /etc/nginx/sites-available/file-manager
```

Add this Nginx configuration (replace `your-domain.com`):

```nginx
# HTTP server - redirects to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Allow Certbot validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect everything else to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # Root directory for frontend
    root /var/www/file-manager/frontend/dist;
    index index.html;
    
    # SSL Configuration (will be managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Frontend - Single Page Application
    location / {\n        try_files $uri $uri/ /index.html;
        \n        # Cache static assets\n        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {\n            expires 1y;\n            add_header Cache-Control \"public, immutable\";\n            access_log off;\n        }\n    }\n    \n    # Backend API proxy\n    location /api {\n        proxy_pass http://localhost:3001;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection 'upgrade';\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_cache_bypass $http_upgrade;\n        \n        # Timeouts\n        proxy_connect_timeout 60s;\n        proxy_send_timeout 60s;\n        proxy_read_timeout 60s;\n        \n        # File upload size limit (10MB)\n        client_max_body_size 1G;\n    }\n    \n    # File uploads and downloads\n    location /uploads {\n        proxy_pass http://localhost:3001;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n        \n        # Large file support\n        client_max_body_size 1G;\n        proxy_request_buffering off;\n    }\n    \n    # Security - Block access to sensitive files\n    location ~ /\\. {\n        deny all;\n        access_log off;\n        log_not_found off;\n    }\n    \n    location ~ \\.(env|log)$ {\n        deny all;\n        access_log off;\n        log_not_found off;\n    }\n}\n```\n\n### Step 6: Enable Nginx Configuration\n\n```bash\n# Enable the site\nsudo ln -s /etc/nginx/sites-available/file-manager /etc/nginx/sites-enabled/\n\n# Test Nginx configuration\nsudo nginx -t\n\n# If test passes, start Nginx\nsudo systemctl start nginx\nsudo systemctl enable nginx\n\n# Check status\nsudo systemctl status nginx\n```\n\n### Step 7: Domain DNS Configuration\n\n**Configure your domain's DNS records:**\n\n1. **A Record**: `your-domain.com` → `your-server-ip`\n2. **CNAME Record**: `www.your-domain.com` → `your-domain.com`\n\n**Verify DNS propagation:**\n```bash\n# Check A record\nnslookup your-domain.com\n\n# Check from external service\ncurl -I http://your-domain.com\n```\n\n**Wait for DNS propagation** (can take up to 48 hours, usually much faster)\n\n### Step 8: SSL Certificate with Let's Encrypt\n\n```bash\n# Install Certbot\nsudo apt install snapd -y\nsudo snap install --classic certbot\n\n# Create symlink for global access\nsudo ln -s /snap/bin/certbot /usr/bin/certbot\n\n# Obtain SSL certificate (replace with your domain)\nsudo certbot --nginx -d your-domain.com -d www.your-domain.com\n```\n\n**Follow the interactive prompts:**\n- Enter email address for renewal notifications\n- Agree to terms of service\n- Choose whether to share email with EFF\n- Certbot will automatically configure Nginx\n\n**Test automatic renewal:**\n```bash\n# Dry run renewal test\nsudo certbot renew --dry-run\n\n# Check certificate info\nsudo certbot certificates\n```\n\n### Step 9: Create Systemd Service\n\n```bash\n# Create service file\nsudo nano /etc/systemd/system/file-manager.service\n```\n\nAdd this configuration:\n```ini\n[Unit]\nDescription=File Manager API Service\nAfter=network.target\nWants=network.target\n\n[Service]\nType=simple\nUser=www-data\nGroup=www-data\nWorkingDirectory=/var/www/file-manager\nEnvironment=NODE_ENV=production\nEnvironmentFile=/var/www/file-manager/.env\nExecStart=/usr/bin/node /var/www/file-manager/backend/dist/server.js\nRestart=always\nRestartSec=10\nKillMode=process\nTimeoutSec=300\n\n# Logging\nStandardOutput=syslog\nStandardError=syslog\nSyslogIdentifier=file-manager\n\n# Security hardening\nNoNewPrivileges=true\nPrivateTmp=true\nProtectHome=true\nProtectSystem=strict\nReadWritePaths=/var/www/file-manager/data /var/www/file-manager/uploads\n\n# Resource limits\nLimitNOFILE=65535\nLimitNPROC=4096\n\n[Install]\nWantedBy=multi-user.target\n```\n\n### Step 10: Start Services\n\n```bash\n# Reload systemd to recognize new service\nsudo systemctl daemon-reload\n\n# Start File Manager service\nsudo systemctl start file-manager\n\n# Enable auto-start on boot\nsudo systemctl enable file-manager\n\n# Check service status\nsudo systemctl status file-manager\n\n# Restart Nginx to apply SSL changes\nsudo systemctl restart nginx\n```\n\n### Step 11: Firewall Configuration\n\n```bash\n# Install and configure UFW firewall\nsudo ufw --force reset\n\n# Default policies\nsudo ufw default deny incoming\nsudo ufw default allow outgoing\n\n# Allow SSH (replace 22 with your SSH port if different)\nsudo ufw allow 22/tcp\n\n# Allow HTTP and HTTPS\nsudo ufw allow 'Nginx Full'\n\n# Enable firewall\nsudo ufw --force enable\n\n# Check status\nsudo ufw status verbose\n```\n\n### Step 12: Verify Deployment\n\n```bash\n# Check all services are running\nsudo systemctl status nginx file-manager\n\n# Test the application\ncurl -I https://your-domain.com\n\n# Check logs\nsudo journalctl -u file-manager -n 50\nsudo tail -f /var/log/nginx/access.log\n```\n\n**Access your application:**\n- **URL**: https://your-domain.com\n- **Admin Login**: `admin` / `YourSecureAdminPassword123!`\n\n## 🔧 Post-Deployment Configuration\n\n### Log Rotation\n\n```bash\n# Configure log rotation\nsudo nano /etc/logrotate.d/file-manager\n```\n\nAdd:\n```\n/var/log/nginx/*.log {\n    daily\n    missingok\n    rotate 52\n    compress\n    delaycompress\n    notifempty\n    create 644 www-data adm\n    postrotate\n        systemctl reload nginx\n    endscript\n}\n```\n\n### Monitoring Setup\n\n```bash\n# Create monitoring script\nsudo nano /usr/local/bin/file-manager-health.sh\n```\n\nAdd:\n```bash\n#!/bin/bash\n# Health check script\n\n# Check if service is running\nif ! systemctl is-active --quiet file-manager; then\n    echo \"File Manager service is down, restarting...\"\n    systemctl restart file-manager\nfi\n\n# Check if Nginx is running\nif ! systemctl is-active --quiet nginx; then\n    echo \"Nginx service is down, restarting...\"\n    systemctl restart nginx\nfi\n```\n\n```bash\n# Make executable\nsudo chmod +x /usr/local/bin/file-manager-health.sh\n\n# Add to crontab\nsudo crontab -e\n```\n\nAdd this line:\n```\n*/5 * * * * /usr/local/bin/file-manager-health.sh\n```\n\n### Backup Strategy\n\n```bash\n# Create backup script\nsudo nano /usr/local/bin/file-manager-backup.sh\n```\n\nAdd:\n```bash\n#!/bin/bash\n# Backup script for File Manager\n\nBACKUP_DIR=\"/backup/file-manager\"\nDATE=$(date +%Y%m%d_%H%M%S)\n\n# Create backup directory\nmkdir -p $BACKUP_DIR\n\n# Backup database\ncp /var/www/file-manager/data/database.sqlite $BACKUP_DIR/database_$DATE.sqlite\n\n# Backup uploads\ntar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/file-manager uploads/\n\n# Backup configuration\ncp /var/www/file-manager/.env $BACKUP_DIR/env_$DATE.backup\n\n# Remove backups older than 30 days\nfind $BACKUP_DIR -name \"*\" -type f -mtime +30 -delete\n\necho \"Backup completed: $DATE\"\n```\n\n```bash\n# Make executable\nsudo chmod +x /usr/local/bin/file-manager-backup.sh\n\n# Add daily backup to crontab\nsudo crontab -e\n```\n\nAdd:\n```\n0 2 * * * /usr/local/bin/file-manager-backup.sh\n```\n\n## 🛡️ Security Checklist\n\n- ✅ Strong JWT secret and admin password\n- ✅ SSL certificate with HTTPS redirect\n- ✅ Security headers configured\n- ✅ Firewall properly configured\n- ✅ Services running as non-root user\n- ✅ File permissions properly set\n- ✅ Log rotation configured\n- ✅ Automatic backups scheduled\n- ✅ Health monitoring in place\n\n## 🔄 Maintenance Commands\n\n### Application Updates\n```bash\n# Pull latest changes\ncd /var/www/file-manager\nsudo -u www-data git pull origin main\n\n# Rebuild\nsudo -u www-data npm run build\n\n# Restart service\nsudo systemctl restart file-manager\n```\n\n### Certificate Renewal\n```bash\n# Renew certificates (automatic via cron)\nsudo certbot renew\n\n# Check certificate expiry\nsudo certbot certificates\n```\n\n### Log Monitoring\n```bash\n# Application logs\nsudo journalctl -u file-manager -f\n\n# Nginx logs\nsudo tail -f /var/log/nginx/access.log\nsudo tail -f /var/log/nginx/error.log\n\n# System logs\nsudo tail -f /var/log/syslog\n```\n\n### Performance Monitoring\n```bash\n# System resources\nhtop\ndf -h\nfree -m\n\n# Service status\nsudo systemctl status file-manager nginx\n\n# Network connections\nsudo netstat -tulnp | grep -E ':(80|443|3001)'\n```\n\n## 🚨 Troubleshooting\n\n### Common Issues\n\n**Service won't start:**\n```bash\n# Check service status\nsudo systemctl status file-manager\n\n# View detailed logs\nsudo journalctl -u file-manager -n 100\n\n# Check environment file\nsudo cat /var/www/file-manager/.env\n```\n\n**SSL certificate issues:**\n```bash\n# Check certificate status\nsudo certbot certificates\n\n# Renew certificate\nsudo certbot renew --force-renewal\n\n# Test Nginx configuration\nsudo nginx -t\n```\n\n**Permission issues:**\n```bash\n# Fix ownership\nsudo chown -R www-data:www-data /var/www/file-manager\n\n# Fix permissions\nsudo chmod -R 755 /var/www/file-manager\n```\n\n**Domain not accessible:**\n```bash\n# Check DNS\nnslookup your-domain.com\n\n# Check firewall\nsudo ufw status\n\n# Check Nginx status\nsudo systemctl status nginx\n```\n\nYour File Manager application is now deployed securely in production! 🎉