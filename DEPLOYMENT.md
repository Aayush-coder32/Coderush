# 🚀 Deployment Guide - Smart Campus OS

This guide covers deploying the application to production.

## Pre-Deployment Checklist

- [ ] All environment variables are set (see `.env.production.example`)
- [ ] Database is provisioned (MongoDB Atlas recommended)
- [ ] JWT_SECRET is a strong random string (32+ characters)
- [ ] External services configured (Stripe, Cloudinary, OpenAI if needed)
- [ ] HTTPS/SSL certificates ready
- [ ] CI/CD pipeline configured

---

## Environment Setup

### 1. Backend Configuration

Create `.env` file in `backend/` directory:

```bash
# Copy the template
cp backend/.env.example backend/.env

# Edit with production values
nano backend/.env
```

**Required Environment Variables:**
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Set to "production"
- `MONGODB_URI` - MongoDB Atlas connection string (NOT localhost)
- `JWT_SECRET` - Strong random string (32+ characters)
- `CLIENT_URL` - Production frontend URL

**Optional (if using these services):**
- `CLOUDINARY_*` - Image upload service
- `STRIPE_*` - Payment processing
- `RAZORPAY_*` - Payment processing
- `OPENAI_API_KEY` - AI features
- `SMTP_*` - Email notifications

### 2. Generate Strong JWT Secret

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32|%{[byte](Get-Random -Max 256)}))
```

---

## Docker Deployment

### Local Docker Build

```bash
# Build images
docker-compose build

# Start services (development)
docker-compose up

# Start services (background)
docker-compose up -d

# Stop services
docker-compose down
```

### Production Docker Build

Create `.env.production` file with all production variables:

```bash
# Set environment file
export COMPOSE_FILE=docker-compose.yml
export ENV_FILE=.env.production

# Build for production
docker-compose --env-file .env.production build --no-cache

# Deploy
docker-compose --env-file .env.production up -d
```

---

## Database Setup

### MongoDB Atlas (Recommended)

1. Create cluster at [mongodb.com/cloud](https://mongodb.com/cloud)
2. Enable network access (whitelist your IP)
3. Create database user with strong password
4. Get connection string
5. URL-encode special characters in password

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```

### MongoDB Local (Development Only)

```bash
mongodb://localhost:27017/smart_campus_os
```

---

## Production Security Checklist

### Network Security
- [ ] Use HTTPS/TLS for all connections
- [ ] Enable CORS with strict origins
- [ ] Setup firewall rules
- [ ] Rate limiting enabled (done in code)

### Application Security
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] Sensitive data NOT in logs
- [ ] CORS origin matches production domain
- [ ] Helmet.js enabled (done in code)
- [ ] Rate limiting strict (auth: 5 req/15min)

### Database Security
- [ ] MongoDB Atlas network access restricted
- [ ] Database user has minimal permissions
- [ ] Regular backups enabled
- [ ] MongoDB Atlas Network Peering for private connection

---

## Deployment Platforms

### AWS (EC2 + RDS/DocumentDB)

```bash
# 1. SSH into EC2
ssh -i key.pem ec2-user@instance-ip

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Clone repository
git clone your-repo-url
cd Coderush

# 4. Create .env file with production values
nano backend/.env

# 5. Deploy
docker-compose up -d

# 6. Setup reverse proxy with Nginx
sudo apt install -y nginx
# Configure nginx to proxy to localhost:8080
```

### Google Cloud Run

```bash
# Build images
gcloud builds submit --tag gcr.io/PROJECT-ID/smart-campus-backend .

# Deploy backend
gcloud run deploy smart-campus-api \
  --image gcr.io/PROJECT-ID/smart-campus-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars MONGODB_URI=xxx,JWT_SECRET=xxx,etc
```

### Heroku

```bash
# Login
heroku login

# Create apps
heroku create smart-campus-api
heroku create smart-campus-web

# Set environment variables
heroku config:set -a smart-campus-api JWT_SECRET=xxx MONGODB_URI=xxx

# Deploy
git push heroku main
```

### DigitalOcean App Platform

1. Connect GitHub repo
2. Configure build settings
3. Set environment variables
4. Deploy

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check API health
curl https://yourdomain.com/api/health

# Response should be:
# {"ok": true, "service": "Smart Campus OS API"}
```

### Logs

```bash
# View logs
docker-compose logs -f api

# View specific service
docker-compose logs api

# Follow logs in real-time
docker-compose logs --follow
```

### Database Backups

- Enable MongoDB Atlas automated backups
- Backup frequency: Daily (recommended)
- Retention: 35 days minimum

### SSL/TLS Certificate

- Use Let's Encrypt with Certbot
- Auto-renewal recommended
- Setup via nginx reverse proxy

---

## Scaling & Performance

### Database Optimization
- Add indexes to frequently queried fields
- Monitor query performance
- Use MongoDB Atlas performance advisor

### Caching
- Implement Redis for session caching
- Cache static frontend assets (CDN)

### Load Balancing
- Use reverse proxy (Nginx)
- Deploy multiple API instances behind load balancer

---

## Troubleshooting

### Container won't start
```bash
docker-compose logs api
# Check for error messages
```

### Database connection fails
```bash
# Verify connection string
echo $MONGODB_URI

# Test connection
mongosh "$MONGODB_URI"
```

### CORS errors
- Verify CLIENT_URL matches frontend domain
- Check CORS configuration in `src/app.js`

### Port already in use
```bash
# Kill process on port
lsof -ti:5000 | xargs kill -9
```

---

## Rollback Procedure

```bash
# Stop current deployment
docker-compose down

# Checkout previous version
git checkout previous-commit

# Rebuild and restart
docker-compose up -d
```

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Test database connectivity
4. Review security checklist

---

**Last Updated:** April 2026
