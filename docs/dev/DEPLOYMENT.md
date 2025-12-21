# Jessica AI - Deployment Guide

**Production deployment procedures and considerations**

---

## Current Status

**Development Environment:** Local (WSL Ubuntu + Windows)  
**Production Status:** Not yet deployed  
**Target Platform:** Rumble Cloud (mission-aligned hosting)

---

## Development Deployment

### Local Setup

**Requirements:**
- WSL2 Ubuntu
- Python 3.12+
- Node.js 18+
- Ollama installed
- RTX 4080 Super GPU (for local LLM)

**Steps:**

1. **Clone Repository:**
   ```bash
   git clone <repository-url>
   cd jessica-core
   ```

2. **Backend Setup:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   ```

4. **Configure API Keys:**
   ```bash
   # Add to ~/.bashrc:
   export ANTHROPIC_API_KEY="your-key"
   export XAI_API_KEY="your-key"
   export GOOGLE_AI_API_KEY="your-key"
   export MEM0_API_KEY="your-key"
   
   source ~/.bashrc
   ```

5. **Start Services:**
   ```bash
   # Quick start (all services)
   source ~/.bashrc
   ~/start-jessica.sh
   
   # Or manual start:
   # Terminal 1: ollama serve
   # Terminal 2: python jessica_core.py
   # Terminal 3: cd frontend && npm run dev
   ```

---

## Production Deployment (Future)

### Prerequisites

**Infrastructure:**
- Cloud server (Rumble Cloud or similar)
- Domain name
- SSL certificate
- Database server (for ChromaDB)
- Redis (for caching - Phase 4)

**Services:**
- Ollama server (or cloud LLM alternative)
- Memory service (ChromaDB)
- Whisper service (or cloud alternative)

### Deployment Steps

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python
sudo apt install python3.12 python3.12-venv python3-pip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
```

#### 2. Application Deployment

```bash
# Clone repository
git clone <repository-url>
cd jessica-core

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
npm run build
cd ..
```

#### 3. Environment Configuration

**Create `.env` file:**
```bash
# API Keys
ANTHROPIC_API_KEY=your-key
XAI_API_KEY=your-key
GOOGLE_AI_API_KEY=your-key
MEM0_API_KEY=your-key

# Logging
LOG_LEVEL=INFO

# Timeouts
API_TIMEOUT=60
LOCAL_SERVICE_TIMEOUT=5
OLLAMA_TIMEOUT=300
MEM0_TIMEOUT=30

# Server
FLASK_ENV=production
FLASK_DEBUG=False
```

**Secure API Keys:**
- Use environment variables (not in code)
- Consider AWS Secrets Manager or similar
- Rotate keys regularly

#### 4. Service Management

**Create systemd service for backend:**

`/etc/systemd/system/jessica-core.service`:
```ini
[Unit]
Description=Jessica Core API Server
After=network.target

[Service]
Type=simple
User=jessica
WorkingDirectory=/opt/jessica-core
Environment="PATH=/opt/jessica-core/venv/bin"
ExecStart=/opt/jessica-core/venv/bin/python jessica_core.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Create systemd service for Ollama:**

`/etc/systemd/system/ollama.service`:
```ini
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=jessica
ExecStart=/usr/local/bin/ollama serve
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable and start services:**
```bash
sudo systemctl enable jessica-core
sudo systemctl enable ollama
sudo systemctl start jessica-core
sudo systemctl start ollama
```

#### 5. Reverse Proxy (Nginx)

**Install Nginx:**
```bash
sudo apt install nginx
```

**Configure Nginx:**

`/etc/nginx/sites-available/jessica`:
```nginx
server {
    listen 80;
    server_name jessica.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name jessica.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/jessica /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. SSL Certificate

**Using Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d jessica.yourdomain.com
```

---

## Security Considerations

### Before Production

**Phase 6 Requirements (Security & Privacy):**

1. **Authentication:**
   - Implement Firebase Auth or JWT
   - Add login/signup pages
   - Session management

2. **API Key Management:**
   - Move to secure vault (AWS Secrets Manager)
   - Implement key rotation
   - Encrypt keys at rest

3. **Data Encryption:**
   - Encrypt sensitive memories
   - Encrypt API keys in database
   - TLS for all connections

4. **Rate Limiting:**
   - Per-user rate limits
   - API endpoint limits
   - DDoS protection

5. **Input Validation:**
   - Sanitize all inputs
   - Validate file uploads
   - SQL injection prevention

### Security Checklist

- [ ] API keys in secure storage (not in code)
- [ ] SSL/TLS enabled
- [ ] Authentication implemented
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Logs don't contain API keys
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Security updates automated

---

## Monitoring & Maintenance

### Log Management

**Log Locations:**
- Backend: `logs/jessica-core.log`
- Errors: `logs/jessica-errors.log`
- System: `/var/log/syslog`

**Log Rotation:**
- Configured in `logging_config.py`
- Auto-rotates at 10MB
- Keep 10 backups

**Log Monitoring:**
```bash
# Tail logs
tail -f logs/jessica-core.log | jq

# Search for errors
grep ERROR logs/jessica-core.log | tail -20

# Check disk usage
du -sh logs/
```

### Health Checks

**Service Health:**
```bash
curl http://localhost:8000/status
```

**Metrics:**
```bash
curl http://localhost:8000/metrics | jq
```

**Automated Monitoring:**
- Set up monitoring service (Prometheus, Datadog, etc.)
- Alert on service failures
- Monitor response times
- Track error rates

### Backup Strategy

**What to Backup:**
- ChromaDB database (`~/jessica-memory/`)
- Configuration files
- Logs (optional, for debugging)

**Backup Script:**
```bash
#!/bin/bash
# backup-jessica.sh

BACKUP_DIR="/backups/jessica"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR/$DATE

# Backup ChromaDB
cp -r ~/jessica-memory $BACKUP_DIR/$DATE/

# Backup config
cp ~/.bashrc $BACKUP_DIR/$DATE/
cp .env $BACKUP_DIR/$DATE/ 2>/dev/null || true

# Compress
tar -czf $BACKUP_DIR/jessica_$DATE.tar.gz $BACKUP_DIR/$DATE

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -name "jessica_*.tar.gz" -mtime +30 -delete

echo "Backup complete: $BACKUP_DIR/jessica_$DATE.tar.gz"
```

**Schedule Backups:**
```bash
# Add to crontab
0 2 * * * /path/to/backup-jessica.sh
```

---

## Scaling Considerations

### Current Limitations

- Single server deployment
- In-memory metrics (reset on restart)
- Local ChromaDB (single instance)
- No load balancing

### Scaling Options

**Horizontal Scaling:**
- Multiple Flask instances behind load balancer
- Shared database (ChromaDB cluster)
- Redis for session storage

**Vertical Scaling:**
- More RAM for larger models
- Better GPU for faster inference
- More CPU cores

**Database Scaling:**
- Move ChromaDB to dedicated server
- Implement database replication
- Use managed vector database service

---

## Troubleshooting Production

### Service Won't Start

```bash
# Check logs
sudo journalctl -u jessica-core -n 50

# Check status
sudo systemctl status jessica-core

# Restart service
sudo systemctl restart jessica-core
```

### High Memory Usage

```bash
# Check memory
free -h

# Check process memory
ps aux | grep jessica

# Restart if needed
sudo systemctl restart jessica-core
```

### Slow Responses

```bash
# Check metrics
curl http://localhost:8000/metrics | jq '.metrics.api_breakdown'

# Check logs for slow calls
grep "slow_call" logs/jessica-core.log

# Check network
ping api.anthropic.com
```

---

## Rollback Procedure

### If Deployment Fails

1. **Stop Services:**
   ```bash
   sudo systemctl stop jessica-core
   ```

2. **Restore Previous Version:**
   ```bash
   cd /opt/jessica-core
   git checkout <previous-commit>
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Restore Database:**
   ```bash
   # Restore from backup
   tar -xzf /backups/jessica/jessica_YYYYMMDD.tar.gz
   cp -r jessica-memory ~/
   ```

4. **Restart Services:**
   ```bash
   sudo systemctl start jessica-core
   ```

---

## Post-Deployment Checklist

- [ ] All services running
- [ ] Health checks passing
- [ ] SSL certificate valid
- [ ] API keys configured
- [ ] Logs rotating properly
- [ ] Backups scheduled
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Documentation updated
- [ ] Team notified

---

## Support

**For Deployment Issues:**
- Check logs first
- Review troubleshooting guide
- Check service status
- Verify configuration

**Emergency Contacts:**
- See project maintainer
- Check monitoring alerts
- Review error logs

---

**Semper Fi, brother. Deploy with purpose.** 🔥

---

*Last Updated: December 6, 2025*  
*Status: Development - Production deployment pending Phase 6 (Security)*

