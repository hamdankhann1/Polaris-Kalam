# Polaris Kalam Hotel — Hostinger VPS Self-Hosted Guide
### Complete Setup: Free Local MongoDB Community Edition + Node.js + PM2 + Nginx

This guide explains how to host your entire project and database on your **Hostinger VPS** using **MongoDB Community Server (100% Free Open Source)**. You will never have to worry about cloud hosting costs, database limits, or third-party subscriptions.

---

## Architecture Overview

```
                          [ Internet / Visitors ]
                                    │
                                    ▼ (Port 80/443 SSL)
                        [ Nginx Reverse Proxy ]
                                    │
                         (Proxy to Port 3000)
                                    ▼
                      [ Node.js Server (server.js) ]
                      • Hosts Built Frontend (dist/)
                      • REST API (/api/bookings & /api/rooms)
                                    │
                            (Local Unix/TCP)
                                    ▼
                [ Local MongoDB Community Server: 27017 ]
                      • Database: polaris_hotel
                      • 100% Free & Unlimited on your VPS
```

---

## Step 1: Connect to Your Hostinger VPS

Open your terminal and SSH into your Hostinger VPS:
```bash
ssh root@YOUR_SERVER_IP
```

Update packages:
```bash
sudo apt update && sudo apt upgrade -y
```

---

## Step 2: Install MongoDB Community Server (Free Forever)

Run the following commands on Ubuntu 22.04 / 24.04:

```bash
# 1. Install gnupg and curl
sudo apt install -y gnupg curl

# 2. Import the official MongoDB public GPG Key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor --yes

# 3. Add MongoDB repository for Ubuntu
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 4. Update apt database and install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# 5. Start and enable MongoDB to auto-run on server reboot
sudo systemctl start mongod
sudo systemctl enable mongod

# 6. Verify MongoDB status
sudo systemctl status mongod
```

*(You will see `active (running)`. MongoDB is now running locally on `127.0.0.1:27017` at zero cost!)*

---

## Step 3: Install Node.js (v20 LTS) & PM2

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v
npm -v

# Install PM2 process manager (keeps the server running 24/7)
sudo npm install -g pm2
```

---

## Step 4: Deploy Your Polaris Kalam Hotel App

Create the application directory:
```bash
sudo mkdir -p /var/www/polaris
cd /var/www/polaris
```

Clone your Git repository (or upload your project files via SFTP / FileZilla):
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
```

Install dependencies & build the production frontend:
```bash
npm install
npm run build
```

Configure `.env` (optional, defaults to local MongoDB):
```bash
cp .env.example .env
```
*(The default `MONGODB_URI=mongodb://127.0.0.1:27017/polaris_hotel` connects directly to your local MongoDB Community Server!)*

Start the production server with PM2:
```bash
pm2 start server.js --name "polaris-hotel"
pm2 startup
pm2 save
```

Test that the server is running:
```bash
curl http://localhost:3000/api/health
```
You will receive:
```json
{"status":"ok","database":"mongodb_community","dbConnected":true,"dbName":"polaris_hotel"}
```

---

## Step 5: Configure Nginx & Domain (`polarishotels.pk`)

Install Nginx:
```bash
sudo apt install -y nginx
```

Create an Nginx configuration file for your site:
```bash
sudo nano /etc/nginx/sites-available/polarishotels.pk
```

Paste the following configuration:
```nginx
server {
    listen 80;
    server_name polarishotels.pk www.polarishotels.pk;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/polarishotels.pk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 6: Install Free SSL Certificate (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d polarishotels.pk -d www.polarishotels.pk
```
Certbot will automatically install the Let's Encrypt SSL certificate and set up automatic renewals.

---

## Operational Commands Summary

| Task | Command |
|---|---|
| Check server status | `pm2 status` |
| View live server logs | `pm2 logs polaris-hotel` |
| Restart web server | `pm2 restart polaris-hotel` |
| Check MongoDB status | `sudo systemctl status mongod` |
| Restart MongoDB | `sudo systemctl restart mongod` |
| Rebuild after code updates | `git pull && npm run build && pm2 restart polaris-hotel` |

---

## Backing Up Your Local Database (Optional & Free)

To create a snapshot backup of your local MongoDB database:
```bash
mongodump --db=polaris_hotel --out=/var/backups/mongodb_$(date +%F)
```
To restore if ever needed:
```bash
mongorestore --db=polaris_hotel /var/backups/mongodb_XXXX-XX-XX/polaris_hotel
```
All your guest booking data and room inventory is 100% self-contained on your own Hostinger server!
