#!/bin/bash
# Quick Reference: Common Deployment Commands
# Usage: Refer to this file for quick command copying

# ============================================
# 1. LOCAL DEVELOPMENT
# ============================================

# Start development servers
docker-compose up

# View logs
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs mongo

# Stop all services
docker-compose down

# Full reset (remove volumes)
docker-compose down -v


# ============================================
# 2. PRODUCTION DEPLOYMENT - FIRST TIME
# ============================================

# Create .env from template
cp backend/.env.production.example backend/.env

# Edit environment variables
nano backend/.env

# Build production images (no cache)
docker-compose build --no-cache

# Create volume for data persistence
docker volume create mongo_data

# Start services in background
docker-compose up -d

# Verify services are running
docker-compose ps

# Check API health
curl http://localhost:5000/api/health


# ============================================
# 3. PRODUCTION DEPLOYMENT - UPDATES
# ============================================

# Pull latest code
git pull origin main

# Build new images
docker-compose build

# Stop old containers
docker-compose down

# Start new containers
docker-compose up -d

# Monitor deplyment
docker-compose logs -f api


# ============================================
# 4. DATABASE OPERATIONS
# ============================================

# Connect to MongoDB
docker-compose exec mongo mongosh

# Backup MongoDB
docker-compose exec mongo mongodump --out /backup

# Restore MongoDB
docker-compose exec mongo mongorestore /backup

# View MongoDB logs
docker-compose logs mongo


# ============================================
# 5. MONITORING & DEBUGGING
# ============================================

# View last 100 lines of logs
docker-compose logs --tail=100 api

# Follow logs in real-time
docker-compose logs -f api

# Check container resource usage
docker stats

# Check container details
docker inspect $(docker-compose ps -q api)

# Execute command in container
docker-compose exec api node -v

# SSH into container
docker-compose exec api /bin/sh


# ============================================
# 6. SSL/TLS CERTIFICATE (Let's Encrypt)
# ============================================

# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Auto-renew setup
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Check certificate details
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout

# View expiration date
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates


# ============================================
# 7. ERROR RECOVERY / ROLLBACK
# ============================================

# Stop all services
docker-compose down

# View logs before restart
docker-compose logs --tail=200 api

# Restart services
docker-compose up -d

# Force rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Rollback to previous version
git revert HEAD
docker-compose down
docker-compose build --no-cache
docker-compose up -d


# ============================================
# 8. CLEANUP & MAINTENANCE
# ============================================

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Remove everything (hard reset)
docker system prune -a

# Show disk usage
docker system df

# View networks
docker network ls

# View volumes
docker volume ls


# ============================================
# 9. ENVIRONMENT VARIABLE MANAGEMENT
# ============================================

# Show all environment variables in container
docker-compose exec api env

# Update single environment variable
# Edit backend/.env then:
docker-compose down
docker-compose up -d

# Verify environment variable is set
docker-compose exec api sh -c 'echo $JWT_SECRET'

# Check if MONGODB_URI is set correctly
docker-compose exec api sh -c 'echo $MONGODB_URI'


# ============================================
# 10. TESTING & VALIDATION
# ============================================

# Test API health
curl http://localhost:5000/api/health

# Test API endpoint
curl -H "Content-Type: application/json" http://localhost:5000/api/events

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/auth/me

# Test frontend
curl http://localhost:8080

# Test database connectivity
docker-compose exec api node -e "console.log(process.env.MONGODB_URI)"


# ============================================
# 11. PERFORMANCE TUNING
# ============================================

# Check container memory limits
docker-compose exec api cat /sys/fs/cgroup/memory.limit_in_bytes

# Monitor memory usage
docker stats --no-stream

# View number of processes
docker-compose exec api ps aux | wc -l

# Check Node.js memory
docker-compose exec api node -e "console.log(require('os').totalmem()/1024/1024+' MB')"


# ============================================
# 12. SECURITY CHECKS
# ============================================

# Verify JWT_SECRET is set and strong
[ -z "$JWT_SECRET" ] && echo "JWT_SECRET is NOT set" || echo "JWT_SECRET is set (length: ${#JWT_SECRET})"

# Check if .env file exists
[ -f backend/.env ] && echo ".env file exists" || echo ".env file MISSING"

# Verify .env is not readable by others
ls -la backend/.env  # Should show rw------- or similar

# Check for hardcoded secrets in code
grep -r "sk_live_\|sk_test_\|MONGODB_URI=" --include="*.js" backend/src | grep -v ".env"


# ============================================
# 13. DOCKER COMPOSE OPERATIONS
# ============================================

# Show compose file being used
docker-compose config

# Validate docker-compose.yml syntax
docker-compose config --quiet && echo "Valid" || echo "Invalid"

# Create only specific service
docker-compose up -d mongo

# Scale services (if applicable)
docker-compose up -d --scale api=3

# View service dependencies
docker-compose config --services

# List all containers
docker-compose ps -a


# ============================================
# 14. CI/CD & GITHUB ACTIONS
# ============================================

# Verify GitHub Actions is set up
ls -la .github/workflows/

# Local test of GitHub Actions
# Requires: https://github.com/nektos/act
act push

# View repository secrets (requires gh CLI)
gh secret list

# Set repository secret
gh secret set MY_SECRET --body "value"


# ============================================
# Emergency Commands
# ============================================

# EMERGENCY STOP (hard kill)
docker kill $(docker ps -q)

# EMERGENCY RESTART
docker-compose restart

# EMERGENCY RESET (DO NOT USE LIGHTLY - removes data)
docker-compose down -v
rm backend/.env
cp backend/.env.production.example backend/.env


# ============================================
# Helpful Aliases (add to ~/.bashrc)
# ============================================

# Add to ~/.bashrc:
# alias docker-logs='docker-compose logs -f api'
# alias docker-ps='docker-compose ps'
# alias docker-start='docker-compose up -d'
# alias docker-stop='docker-compose down'
# alias docker-restart='docker-compose restart'
# alias docker-build='docker-compose build --no-cache'


# ============================================
# Documentation Links
# ============================================

# Full deployment guide:
# cat DEPLOYMENT.md

# Security checklist:
# cat docs/SECURITY_CHECKLIST.md

# Docker production guide:
# cat docs/DOCKER_PRODUCTION.md

# Quick start summary:
# cat DEPLOYMENT_READY.md
