# 📁 File Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3+-blue.svg)](https://reactjs.org/)

A modern, secure file management system with multi-application support. Built with TypeScript, featuring a Fastify backend and React frontend with comprehensive API management.

## ✨ Features

- **🔐 Dual Authentication**: JWT for admin panel, API keys for applications
- **📁 Multi-Application Support**: Isolated file storage per application
- **🖼️ Image Processing**: Convert images to WebP format for compression
- **🌐 Public File Access**: Make files publicly accessible without authentication
- **🛡️ Security First**: Input validation, file type restrictions, secure authentication
- **⚡ Modern Stack**: TypeScript, React, Fastify, SQLite
- **🐳 Docker Ready**: Complete containerization support
- **📊 Admin Dashboard**: User management, application management, file operations
- **🔄 Hot Reload**: Development-friendly with auto-reload
- **📅 Localized Dates**: French date format (dd/mm/yyyy)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/LOSS98/files-management-app-with-api.git
cd files-management-app-with-api

# Install all dependencies
npm run install:all

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start development servers
npm run dev
```

### Access Points
- **Admin Panel**: http://localhost:3000
- **API Server**: http://localhost:3001  
- **Default Login**: `admin` / `admin123`

## 🐳 Docker Deployment (Recommended)

```bash
# Start with Docker Compose
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

**For complete production deployment with SSL:** See [DEPLOYMENT.md](DEPLOYMENT.md)

## 📖 API Documentation

### Authentication Methods

- **Admin Routes**: JWT token in `Authorization: Bearer <token>`
- **File Routes**: API key in `X-API-Key: <api_key>`

### Core Endpoints

#### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### User Management
```http
GET    /api/admin/users           # List users
POST   /api/admin/users           # Create user
DELETE /api/admin/users/:id       # Delete user
```

#### Application Management
```http
GET    /api/admin/applications                    # List applications
POST   /api/admin/applications                    # Create application
DELETE /api/admin/applications/:id                # Delete application
PUT    /api/admin/applications/:id/regenerate-key # Regenerate API key
```

#### File Operations
```http
POST   /api/files/upload                     # Upload file (with is_public option)
GET    /api/files                            # List files
PUT    /api/files/:id/rename                 # Rename file
PATCH  /api/files/:id/visibility             # Toggle file visibility (public/private)
POST   /api/files/:id/convert-to-webp        # Convert image to WebP
DELETE /api/files/:id                       # Delete file
GET    /api/files/:id/download               # Download file
```

#### Public File Access
```http
GET    /public/:id                          # Access public file (no authentication)
GET    /public/:id/info                     # Get public file metadata
```

### File Upload & Access
- **Allowed Types**: JPEG, PNG, GIF, WebP, PDF, Plain Text
- **Max Size**: 1GB
- **Security**: Filename sanitization, type validation
- **Public Access**: Files can be made publicly accessible via `/public/{file_id}`
- **Privacy Control**: Toggle between public and private access per file
- **Web Integration**: Public files perfect for `<img src="/public/{file_id}">` tags

## 🏗️ Architecture

```
file-manager/
├── backend/              # Fastify API Server
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── auth.ts      # Authentication logic
│   │   ├── database.ts  # SQLite operations
│   │   ├── fileUtils.ts # File utilities
│   │   └── server.ts    # Main server
│   └── Dockerfile
├── frontend/            # React Admin Panel
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── services/    # API clients
│   │   └── utils/       # Utilities
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml   # Container orchestration
├── .env.example        # Environment template
└── README.md
```

## 🗄️ Database Schema

### Users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,        -- Bcrypt hashed
  role TEXT DEFAULT 'user',      -- 'admin' | 'user'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Applications
```sql
CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  api_key TEXT UNIQUE NOT NULL,  -- Format: app_32hexchars
  folder_path TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Files
```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  original_name TEXT NOT NULL,
  current_name TEXT NOT NULL,    -- UUID-based unique name
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,       -- MIME type
  size INTEGER NOT NULL,         -- Bytes
  is_public INTEGER DEFAULT 0,   -- 0 = private, 1 = public
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications (id)
);
```

## 🔒 Security Features

- **Authentication**: JWT tokens with configurable secrets
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive request validation
- **File Security**: Type whitelisting, size limits, sanitization
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Environment-based origins
- **Password Hashing**: Bcrypt with 12 rounds
- **API Key Management**: Secure key generation and rotation

## ⚙️ Configuration

### Environment Variables
```bash
NODE_ENV=production
JWT_SECRET=your-super-secure-256-bit-secret-key
ADMIN_PASSWORD=your-secure-admin-password
```

### Development Commands
```bash
# Development (auto-reload)
npm run dev

# Individual services
npm run dev:backend     # Backend only
npm run dev:frontend    # Frontend only

# Production build
npm run build
npm run start

# Dependencies
npm run install:all     # Install all dependencies
```

## 🧪 Testing

```bash
# TypeScript compilation check
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Security audit
npm audit
```

## 📦 Production Deployment

### 1. Quick Docker Deployment
```bash
# Create production environment
cp .env.example .env
# Edit .env with production values

# Deploy with Docker
docker-compose up -d --build
```

### 2. Environment Variables
```bash
NODE_ENV=production
JWT_SECRET=your-production-secret-minimum-32-characters
ADMIN_PASSWORD=YourSecurePassword123!
```

### 3. Manual Production Setup

#### Step 1: Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build tools
sudo apt-get install -y build-essential

# Clone repository
git clone https://github.com/LOSS98/files-management-app-with-api.git
cd files-management-app-with-api
```

#### Step 2: Application Build
```bash
# Install dependencies
npm run install:all

# Build applications
npm run build

# Create production directories
sudo mkdir -p /var/www/file-manager
sudo cp -r . /var/www/file-manager/
sudo chown -R www-data:www-data /var/www/file-manager
```

#### Step 3: Environment Configuration
```bash
# Create production environment file
sudo nano /var/www/file-manager/.env
```

Add the following:
```env
NODE_ENV=production
JWT_SECRET=your-super-secure-256-bit-secret-key-here
ADMIN_PASSWORD=YourSecureAdminPassword123!
```

#### Step 4: Install and Configure Nginx
```bash
# Install Nginx
sudo apt install nginx -y

# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Create File Manager configuration
sudo nano /etc/nginx/sites-available/file-manager
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Simple HTTP configuration - Certbot will add HTTPS automatically
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 1G;
    }
    
    location /public {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Enable caching for public files
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000";
    }
}
```

#### Step 5: Enable Nginx Configuration
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/file-manager /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Step 6: Domain Configuration
```bash
# Configure your domain's DNS records:
# A Record: your-domain.com → your-server-ip
# CNAME Record: www.your-domain.com → your-domain.com

# Verify DNS propagation
nslookup your-domain.com
```

#### Step 7: SSL Certificate with Certbot
```bash
# Install Certbot
sudo apt install snapd -y
sudo snap install --classic certbot

# Create symlink
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

#### Step 8: Process Management with Systemd
```bash
# Create systemd service
sudo nano /etc/systemd/system/file-manager.service
```

Add this configuration:
```ini
[Unit]
Description=File Manager API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/file-manager
Environment=NODE_ENV=production
EnvironmentFile=/var/www/file-manager/.env
ExecStart=/usr/bin/node /var/www/file-manager/backend/dist/server.js
Restart=on-failure
RestartSec=10
KillMode=process

# Logging
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=file-manager

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/www/file-manager/data /var/www/file-manager/uploads

[Install]
WantedBy=multi-user.target
```

#### Step 9: Start Services
```bash
# Reload systemd
sudo systemctl daemon-reload

# Start and enable File Manager service
sudo systemctl start file-manager
sudo systemctl enable file-manager

# Check status
sudo systemctl status file-manager

# Restart Nginx to apply SSL configuration
sudo systemctl restart nginx
```

#### Step 10: Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Check firewall status
sudo ufw status
```

#### Step 11: Monitoring and Logs
```bash
# View application logs
sudo journalctl -u file-manager -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check service status
sudo systemctl status file-manager nginx
```

### 4. Production Maintenance

#### Updates and Deployment
```bash
# Pull latest changes
cd /var/www/file-manager
sudo -u www-data git pull origin main

# Rebuild application
sudo -u www-data npm run build

# Restart services
sudo systemctl restart file-manager
sudo systemctl reload nginx
```

#### Backup Strategy
```bash
# Database backup
sudo cp /var/www/file-manager/data/database.sqlite /backup/database-$(date +%Y%m%d).sqlite

# Files backup
sudo tar -czf /backup/uploads-$(date +%Y%m%d).tar.gz /var/www/file-manager/uploads

# Configuration backup
sudo cp /var/www/file-manager/.env /backup/env-$(date +%Y%m%d).backup
```

#### Security Monitoring
```bash
# Check for security updates
sudo apt list --upgradable

# Monitor failed login attempts
sudo grep "Invalid credentials" /var/log/syslog

# Check SSL certificate expiry
sudo certbot certificates
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Links
- 📖 [Full Documentation](README.md)
- 🚀 [Production Deployment Guide](DEPLOYMENT.md)
- 🤝 [Contributing Guidelines](CONTRIBUTING.md)
- 🔒 [Security Policy](SECURITY.md)

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

For security concerns, please review our [Security Policy](SECURITY.md).

## 🌟 Acknowledgments

- Built with [Fastify](https://www.fastify.io/) for high performance
- UI powered by [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/)
- Image processing with [Sharp](https://sharp.pixelplumbing.com/)
- Secure authentication with [bcrypt](https://www.npmjs.com/package/bcrypt) and [JWT](https://jwt.io/)

## 📊 Project Stats

- **Backend**: TypeScript + Fastify + SQLite
- **Frontend**: React 18.3+ + TypeScript + Tailwind CSS
- **Security**: JWT + API Keys + Input Validation
- **File Support**: Images, PDFs, Text files
- **Max File Size**: 1GB
- **Date Format**: dd/mm/yyyy (French)

---

**File Manager** - Modern, Secure, Open Source 🚀