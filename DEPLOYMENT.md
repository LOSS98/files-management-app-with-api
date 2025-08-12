# 🚀 Production Deployment Guide

Simple and effective guide to deploy File Manager in production with Docker, Nginx and automatic SSL.

## 📋 Prerequisites

- **Server**: Ubuntu 20.04+ with root access
- **Domain**: Domain name pointed to your server
- **Resources**: Minimum 2GB RAM, 20GB storage
- **Open ports**: 22 (SSH), 80 (HTTP), 443 (HTTPS)

## 🐳 Docker Method (Recommended)

### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reboot to apply permissions
sudo reboot
```

### Step 2: Application Deployment

```bash
# Clone repository
git clone https://github.com/LOSS98/files-management-app-with-api.git
cd files-management-app-with-api

# Configure environment
cp .env.example .env
nano .env
```

**Environment Configuration (.env):**
```env
NODE_ENV=production
JWT_SECRET=your-super-secure-256-bit-secret-key-change-this-now
ADMIN_PASSWORD=YourSecureAdminPassword123!
```

**Start with Docker:**
```bash
# Build and start containers
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

### Step 3: Nginx Configuration (HTTP only)

```bash
# Install Nginx
sudo apt install nginx -y

# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Create File Manager configuration
sudo nano /etc/nginx/sites-available/file-manager
```

**Nginx HTTP Configuration (`/etc/nginx/sites-available/file-manager`):**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Frontend - React Application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for large files
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # File size limit (1GB)
        client_max_body_size 1G;
    }
    
    # Static files and downloads
    location /uploads {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Large file support
        client_max_body_size 1G;
        proxy_request_buffering off;
    }
    
    # Security - Block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ \.(env|log)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

**⚠️ Important Note:** This configuration is HTTP only. Certbot will automatically modify this configuration to add HTTPS and redirection.

**Enable configuration:**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/file-manager /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 4: DNS Configuration

**Configure your domain's DNS records:**

1. **A Record**: `your-domain.com` → `your-server-ip`
2. **CNAME Record**: `www.your-domain.com` → `your-domain.com`

**Verify DNS propagation:**
```bash
# Check A record
nslookup your-domain.com

# Test HTTP connection
curl -I http://your-domain.com
```

**⚠️ Important:** Wait for DNS propagation before proceeding to the next step.

### Step 5: SSL Certificate with Certbot (Automatic configuration)

```bash
# Install Certbot
sudo apt install snapd -y
sudo snap install --classic certbot

# Create symbolic link
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Obtain SSL certificate and automatically configure Nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**Follow the interactive prompts:**
- Enter your email address for renewal notifications
- Accept the terms of service
- Choose whether to share your email with EFF
- **Certbot will automatically:**
  - Generate SSL certificates
  - Modify your Nginx configuration
  - Add HTTP → HTTPS redirection
  - Configure SSL headers

**Test automatic renewal:**
```bash
# Test renewal
sudo certbot renew --dry-run

# Check certificates
sudo certbot certificates
```

**After Certbot, your Nginx configuration will look like this:**
```nginx
server {
    server_name your-domain.com www.your-domain.com;
    
    # Your existing configuration...
    
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.your-domain.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = your-domain.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 404; # managed by Certbot
}
```

### Step 6: Firewall Configuration

```bash
# Configure UFW
sudo ufw --force reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH, HTTP and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status verbose
```

### Step 7: Deployment Verification

```bash
# Check services
sudo systemctl status nginx
docker-compose ps

# Test application with HTTPS
curl -I https://your-domain.com

# Check logs
docker-compose logs -f
sudo tail -f /var/log/nginx/access.log
```

**Access your application:**
- **URL**: https://your-domain.com (automatically redirected)
- **Admin login**: `admin` / `YourSecurePassword123!`

## 🔧 Maintenance and Monitoring

### Automatic monitoring

**Monitoring script (`/usr/local/bin/file-manager-health.sh`):**
```bash
#!/bin/bash
# File Manager monitoring script

cd /path/to/files-management-app-with-api

# Check Docker containers
if ! docker-compose ps | grep -q "Up"; then
    echo "Docker containers stopped, restarting..."
    docker-compose restart
fi

# Check Nginx
if ! systemctl is-active --quiet nginx; then
    echo "Nginx stopped, restarting..."
    systemctl restart nginx
fi
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/file-manager-health.sh

# Add to crontab (check every 5 minutes)
sudo crontab -e
*/5 * * * * /usr/local/bin/file-manager-health.sh
```

### Automatic backup

**Backup script (`/usr/local/bin/file-manager-backup.sh`):**
```bash
#!/bin/bash
# File Manager backup script

BACKUP_DIR="/backup/file-manager"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/path/to/files-management-app-with-api"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T backend cat /app/data/database.sqlite > $BACKUP_DIR/database_$DATE.sqlite

# Backup uploaded files
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $APP_DIR uploads/

# Backup configuration
cp $APP_DIR/.env $BACKUP_DIR/env_$DATE.backup

# Remove backups older than 30 days
find $BACKUP_DIR -name "*" -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/file-manager-backup.sh

# Add to crontab (daily backup at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/file-manager-backup.sh
```

## 🔄 Updates

### Application update

```bash
# Go to directory
cd /path/to/files-management-app-with-api

# Pull latest changes
git pull origin main

# Rebuild and restart containers
docker-compose down
docker-compose up -d --build

# Check status
docker-compose ps
```

### SSL Renewal (Automatic)

```bash
# Renewal is automatic via cron
# Manual expiration check
sudo certbot certificates

# Manual renewal test
sudo certbot renew --dry-run
```

## 🚨 Troubleshooting

### Common issues

**Containers won't start:**
```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check configuration
docker-compose config
```

**SSL issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

**Performance issues:**
```bash
# Monitor resources
htop
docker stats

# Check error logs
sudo tail -f /var/log/nginx/error.log
docker-compose logs --tail=100
```

**DNS issues:**
```bash
# Check DNS propagation
nslookup your-domain.com
dig your-domain.com

# Test connectivity
ping your-domain.com
```

Your File Manager application is now securely deployed in production! 🎉

---

**Steps Summary:**
1. ✅ Server preparation + Docker
2. ✅ Application deployment with Docker Compose  
3. ✅ Simple Nginx HTTP configuration
4. ✅ Domain DNS configuration
5. ✅ Certbot automatically configures HTTPS + redirection
6. ✅ UFW firewall configuration
7. ✅ Automatic monitoring and backup

**Advantages of this method:**
- 🚀 **Simple**: HTTP Nginx configuration first
- 🔒 **Automatic**: Certbot handles all SSL
- ⚡ **Fast**: Fewer manual steps  
- 🛡️ **Secure**: Optimal SSL configuration by Certbot