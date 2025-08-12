# 🚀 Production Deployment Guide

Guide simple et efficace pour déployer File Manager en production avec Docker, Nginx et SSL automatique.

## 📋 Prérequis

- **Serveur**: Ubuntu 20.04+ avec accès root
- **Domaine**: Nom de domaine pointé vers votre serveur
- **Ressources**: Minimum 2GB RAM, 20GB stockage
- **Ports ouverts**: 22 (SSH), 80 (HTTP), 443 (HTTPS)

## 🐳 Méthode Docker (Recommandée)

### Étape 1: Préparation du serveur

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des outils essentiels
sudo apt install -y curl wget git

# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installation de Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Redémarrage pour appliquer les permissions
sudo reboot
```

### Étape 2: Déploiement de l'application

```bash
# Clonage du repository
git clone https://github.com/LOSS98/files-management-app-with-api.git
cd files-management-app-with-api

# Configuration de l'environnement
cp .env.example .env
nano .env
```

**Configuration .env:**
```env
NODE_ENV=production
JWT_SECRET=your-super-secure-256-bit-secret-key-change-this-now
ADMIN_PASSWORD=YourSecureAdminPassword123!
```

**Démarrage avec Docker:**
```bash
# Construction et démarrage des conteneurs
docker-compose up -d --build

# Vérification du statut
docker-compose ps
docker-compose logs -f
```

### Étape 3: Configuration Nginx

```bash
# Installation de Nginx
sudo apt install nginx -y

# Suppression de la configuration par défaut
sudo rm /etc/nginx/sites-enabled/default

# Création de la configuration File Manager
sudo nano /etc/nginx/sites-available/file-manager
```

**Configuration Nginx (`/etc/nginx/sites-available/file-manager`):**
```nginx
# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Autoriser la validation Certbot
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Rediriger le reste vers HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Serveur HTTPS
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # Configuration SSL (sera gérée par Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Sécurité SSL moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # En-têtes de sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Compression Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Frontend - Application React
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
        
        # Timeout pour les gros fichiers
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Limite de taille des fichiers (1GB)
        client_max_body_size 1G;
    }
    
    # Fichiers statiques et téléchargements
    location /uploads {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Support des gros fichiers
        client_max_body_size 1G;
        proxy_request_buffering off;
    }
    
    # Sécurité - Bloquer l'accès aux fichiers sensibles
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

**Activation de la configuration:**
```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/file-manager /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Démarrer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Étape 4: Configuration DNS

**Configurez les enregistrements DNS de votre domaine:**

1. **Enregistrement A**: `your-domain.com` → `IP-de-votre-serveur`
2. **Enregistrement CNAME**: `www.your-domain.com` → `your-domain.com`

**Vérification de la propagation DNS:**
```bash
# Vérifier l'enregistrement A
nslookup your-domain.com

# Tester la connexion HTTP
curl -I http://your-domain.com
```

### Étape 5: Certificat SSL avec Certbot

```bash
# Installation de Certbot
sudo apt install snapd -y
sudo snap install --classic certbot

# Création du lien symbolique
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Obtention du certificat SSL (remplacez par votre domaine)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**Suivez les invites interactives:**
- Entrez votre adresse email pour les notifications de renouvellement
- Acceptez les conditions d'utilisation
- Choisissez si vous voulez partager votre email avec l'EFF
- Certbot configurera automatiquement Nginx

**Test du renouvellement automatique:**
```bash
# Test de renouvellement
sudo certbot renew --dry-run

# Vérification des certificats
sudo certbot certificates
```

### Étape 6: Configuration du pare-feu

```bash
# Configuration UFW
sudo ufw --force reset

# Politiques par défaut
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Autoriser SSH, HTTP et HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le pare-feu
sudo ufw --force enable

# Vérifier le statut
sudo ufw status verbose
```

### Étape 7: Vérification du déploiement

```bash
# Vérifier les services
sudo systemctl status nginx
docker-compose ps

# Tester l'application
curl -I https://your-domain.com

# Vérifier les logs
docker-compose logs -f
sudo tail -f /var/log/nginx/access.log
```

**Accès à votre application:**
- **URL**: https://your-domain.com
- **Connexion admin**: `admin` / `VotreMotDePasseSecurise123!`

## 🔧 Maintenance et Surveillance

### Surveillance automatique

**Script de surveillance (`/usr/local/bin/file-manager-health.sh`):**
```bash
#!/bin/bash
# Script de surveillance File Manager

cd /path/to/files-management-app-with-api

# Vérifier les conteneurs Docker
if ! docker-compose ps | grep -q "Up"; then
    echo "Conteneurs Docker arrêtés, redémarrage..."
    docker-compose restart
fi

# Vérifier Nginx
if ! systemctl is-active --quiet nginx; then
    echo "Nginx arrêté, redémarrage..."
    systemctl restart nginx
fi
```

```bash
# Rendre exécutable
sudo chmod +x /usr/local/bin/file-manager-health.sh

# Ajouter au crontab (vérification toutes les 5 minutes)
sudo crontab -e
*/5 * * * * /usr/local/bin/file-manager-health.sh
```

### Sauvegarde automatique

**Script de sauvegarde (`/usr/local/bin/file-manager-backup.sh`):**
```bash
#!/bin/bash
# Script de sauvegarde File Manager

BACKUP_DIR="/backup/file-manager"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/path/to/files-management-app-with-api"

# Créer le répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarder la base de données
docker-compose exec -T backend cat /app/data/database.sqlite > $BACKUP_DIR/database_$DATE.sqlite

# Sauvegarder les fichiers uploadés
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $APP_DIR uploads/

# Sauvegarder la configuration
cp $APP_DIR/.env $BACKUP_DIR/env_$DATE.backup

# Supprimer les sauvegardes de plus de 30 jours
find $BACKUP_DIR -name "*" -type f -mtime +30 -delete

echo "Sauvegarde terminée: $DATE"
```

```bash
# Rendre exécutable
sudo chmod +x /usr/local/bin/file-manager-backup.sh

# Ajouter au crontab (sauvegarde quotidienne à 2h du matin)
sudo crontab -e
0 2 * * * /usr/local/bin/file-manager-backup.sh
```

## 🔄 Mises à jour

### Mise à jour de l'application

```bash
# Aller dans le répertoire
cd /path/to/files-management-app-with-api

# Récupérer les dernières modifications
git pull origin main

# Reconstruire et redémarrer les conteneurs
docker-compose down
docker-compose up -d --build

# Vérifier le statut
docker-compose ps
```

### Renouvellement SSL

```bash
# Renouvellement automatique (configuré par cron)
sudo certbot renew

# Vérification manuelle de l'expiration
sudo certbot certificates
```

## 🚨 Dépannage

### Problèmes courants

**Les conteneurs ne démarrent pas:**
```bash
# Vérifier les logs
docker-compose logs

# Vérifier l'espace disque
df -h

# Vérifier la configuration
docker-compose config
```

**Problèmes SSL:**
```bash
# Vérifier le statut des certificats
sudo certbot certificates

# Renouveler le certificat
sudo certbot renew --force-renewal

# Tester la configuration Nginx
sudo nginx -t
```

**Problèmes de performance:**
```bash
# Surveiller les ressources
htop
docker stats

# Vérifier les logs d'erreur
sudo tail -f /var/log/nginx/error.log
docker-compose logs --tail=100
```

Votre application File Manager est maintenant déployée en production de manière sécurisée! 🎉

---

**Récapitulatif des étapes:**
1. ✅ Préparation serveur + Docker
2. ✅ Déploiement application avec Docker Compose  
3. ✅ Configuration Nginx reverse proxy
4. ✅ Configuration DNS domaine
5. ✅ Installation certificat SSL avec Certbot
6. ✅ Configuration pare-feu UFW
7. ✅ Surveillance et sauvegarde automatiques