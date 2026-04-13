# Docker Production Deployment Guide
# ===================================

## Production Docker Compose Configuration

Create a `docker-compose.prod.yml` file with additional production configurations:

```yaml
version: '3.8'

services:
  mongo:
    image: mongo:7
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo_data:/data/db
      - mongo_config:/data/configdb
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: ./backend
    restart: always
    expose:
      - "5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGODB_URI: mongodb://${MONGO_USER}:${MONGO_PASSWORD}@mongo:27017/smart_campus_os
      JWT_SECRET: ${JWT_SECRET}
      CLIENT_URL: ${CLIENT_URL}
      # Optional services
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      RAZORPAY_KEY_ID: ${RAZORPAY_KEY_ID}
      RAZORPAY_KEY_SECRET: ${RAZORPAY_KEY_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      mongo:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - app-network

  web:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        VITE_SOCKET_URL: ${VITE_SOCKET_URL}
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend/nginx.production.conf:/etc/nginx/conf.d/default.conf:ro
      # Uncomment for SSL/TLS
      # - /etc/letsencrypt/live/yourdomain.com/fullchain.pem:/etc/nginx/ssl/cert.pem:ro
      # - /etc/letsencrypt/live/yourdomain.com/privkey.pem:/etc/nginx/ssl/key.pem:ro
    depends_on:
      - api
    networks:
      - app-network

volumes:
  mongo_data:
    driver: local
  mongo_config:
    driver: local

networks:
  app-network:
    driver: bridge
```

## Deployment Commands

### 1. Initial Setup
```bash
# Create production environment file
cp backend/.env.production.example backend/.env

# Edit with actual values
nano backend/.env

# Build images
docker-compose -f docker-compose.prod.yml build --no-cache
```

### 2. Start Services
```bash
# Start in detached mode
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### 3. Database Backup
```bash
# Backup MongoDB
docker-compose exec mongo mongodump --out /backup

# Restore MongoDB
docker-compose exec mongo mongorestore /backup
```

### 4. Monitoring
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View resource usage
docker stats

# View logs for specific service
docker-compose -f docker-compose.prod.yml logs api
```

## Health Checks

Services include health checks:
- **MongoDB**: Responds to ping command
- **API**: HTTP GET /api/health returns 200

View health status:
```bash
docker-compose -f docker-compose.prod.yml ps
```

Status will show `(healthy)` or `(unhealthy)`

## SSL/TLS Setup with Let's Encrypt

```bash
# 1. Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# 2. Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# 3. Update paths in nginx.production.conf
# 4. Reload Nginx

# 5. Auto-renew (automatic with Certbot)
sudo systemctl enable certbot.timer
```

## Scaling

### Horizontal Scaling (Multiple API instances)

```yaml
services:
  api-1:
    extends: api
  api-2:
    extends: api
  api-3:
    extends: api
  
  # Use a reverse proxy/load balancer in front
```

### Resource Limits

```yaml
services:
  api:
    mem_limit: 512m
    cpus: 1
  web:
    mem_limit: 256m
    cpus: 0.5
```

## Production Best Practices

1. ✅ Use managed databases (MongoDB Atlas) instead of self-hosted
2. ✅ Enable automated backups
3. ✅ Setup monitoring and alerts
4. ✅ Use strong, unique JWT_SECRET
5. ✅ Enable HTTPS/TLS
6. ✅ Regular security updates
7. ✅ Setup CI/CD for automated deployments
8. ✅ Implement proper logging and debugging
9. ✅ Rate limiting enabled
10. ✅ CORS properly configured
