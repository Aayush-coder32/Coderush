# 🔒 Production Security Checklist

Complete this checklist before deploying to production.

## Pre-Deployment Security Review

### Environment & Secrets
- [ ] JWT_SECRET is strong (32+ characters, random)
- [ ] JWT_SECRET is different from development
- [ ] All API keys are production keys (not test keys)
- [ ] .env file is NOT in git repository
- [ ] .env file has restrictive permissions (chmod 600)
- [ ] Database password is strong
- [ ] No hardcoded credentials in code
- [ ] All secrets stored in environment variables

### Database Security
- [ ] MongoDB Atlas is used for production
- [ ] Network access is restricted (IP whitelist)
- [ ] Database user has minimal required permissions
- [ ] Encryption at rest is enabled
- [ ] Encryption in transit (TLS) is enabled
- [ ] Automated backups are configured
- [ ] Backup retention policy is set
- [ ] Backup restoration tested

### API Security
- [ ] CORS origin matches production domain only
- [ ] Rate limiting is enabled
- [ ] HTTPS/TLS is enforced
- [ ] HTTP redirects to HTTPS
- [ ] Security headers are configured (Helmet.js)
- [ ] CORS headers are strict

### Authentication & Authorization
- [ ] JWT expiration is reasonable (7d recommended)
- [ ] Token refresh mechanism is implemented
- [ ] User roles and permissions are validated
- [ ] Admin routes require admin role
- [ ] Password hashing uses bcrypt

### Input Validation
- [ ] All user inputs are validated
- [ ] File uploads are restricted (size, type)
- [ ] SQL injection prevention measures
- [ ] XSS prevention measures
- [ ] CSRF protection enabled

### Frontend Security
- [ ] Build optimization enabled (minified, tree-shaked)
- [ ] Source maps NOT included in production build
- [ ] Security headers configured in Nginx
- [ ] X-Frame-Options set to SAMEORIGIN
- [ ] X-Content-Type-Options set to nosniff
- [ ] CSP headers configured

### Dependencies & Vulnerabilities
- [ ] All npm packages are up-to-date
- [ ] No known vulnerabilities (`npm audit`)
- [ ] Vulnerable packages are remediated
- [ ] Dependency audit automated (npm audit ci)

### Logging & Monitoring
- [ ] Error logging is enabled
- [ ] Logs don't contain sensitive data
- [ ] Centralized logging is configured
- [ ] Log retention policy is set
- [ ] Monitoring alerts are configured
- [ ] Error tracking (Sentry) configured

### Deployment Infrastructure
- [ ] Firewall rules are configured
- [ ] Unused ports are closed
- [ ] SSH key-based authentication only
- [ ] Public key is added to deployment server
- [ ] Automatic security updates enabled
- [ ] Fail2ban or similar is configured

### SSL/TLS Certificates
- [ ] Valid SSL/TLS certificate installed
- [ ] Certificate auto-renewal configured
- [ ] Certificate expiration alerts set
- [ ] Strong cipher suites configured
- [ ] TLS 1.2+ only

### Backup & Disaster Recovery
- [ ] Database backups automated
- [ ] Backup location is separate from production
- [ ] Restore procedure documented
- [ ] Restore procedure tested periodically
- [ ] RTO (Recovery Time Objective) defined
- [ ] RPO (Recovery Point Objective) defined

### Third-Party Services
- [ ] Stripe production keys configured
- [ ] Razorpay production keys configured
- [ ] Cloudinary production keys configured
- [ ] OpenAI production keys configured
- [ ] Email service configured correctly
- [ ] API rate limits configured

### API Endpoints
- [ ] Health check endpoint secured or public
- [ ] Admin endpoints require authentication
- [ ] Sensitive data NOT returned in errors
- [ ] Proper HTTP status codes returned
- [ ] Rate limiting prevents brute force

### Documentation
- [ ] Deployment procedure documented
- [ ] Rollback procedure documented
- [ ] Emergency procedures documented
- [ ] On-call runbook prepared
- [ ] Team training completed

## Post-Deployment Checks

- [ ] API health check passing
- [ ] Frontend loads correctly
- [ ] Authentication works
- [ ] SSL/TLS certificate valid
- [ ] No console errors
- [ ] Logs show normal operation
- [ ] Database connectivity verified
- [ ] All external services responding
- [ ] Rate limiting working
- [ ] CORS headers correct

## Monitoring & Alerts

Setup alerts for:
- [ ] CPU usage > 80%
- [ ] Memory usage > 90%
- [ ] Disk space < 10%
- [ ] API response time > 2s
- [ ] Error rate > 1%
- [ ] Database connection failures
- [ ] SSL certificate expiration < 30 days
- [ ] Backup failures

## Regular Maintenance

### Weekly
- [ ] Review error logs
- [ ] Check disk space
- [ ] Verify backups completed

### Monthly
- [ ] Update dependencies
- [ ] Review security logs
- [ ] Test restore procedure
- [ ] Update SSL certificates

### Quarterly
- [ ] Security audit
- [ ] Penetration testing
- [ ] Update incident response plan
- [ ] Review access logs

## Incident Response

### If compromised:
1. Take application offline immediately
2. Rotate all secrets
3. Review logs for unauthorized access
4. Update credentials
5. Run malware scan
6. Investigate root cause
7. Deploy patched version
8. Monitor closely

### If data breach:
1. Notify affected users immediately
2. Contact legal team
3. Review logs for data accessed
4. Change all passwords
5. Enable enhanced monitoring
6. Document incident thoroughly

## Security Contacts

- Security Team: [add email]
- Incident Response: [add email]
- On-Call: [add phone/email]

---

## Sign-Off

- [ ] Security lead review: ___________ Date: ______
- [ ] DevOps lead review: ___________ Date: ______
- [ ] Product manager approval: ___________ Date: ______

**Deployment Date:** __________

**Deployed by:** __________

---

**Last Updated:** April 2026
