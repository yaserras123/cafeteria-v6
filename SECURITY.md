# Security Guidelines - Cafeteria V6

## Environment Variables

All sensitive configuration must be stored in environment variables, never in source code.

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/db

# Authentication
JWT_SECRET=<generate with: openssl rand -base64 32>
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://oauth-server.com
OWNER_OPEN_ID=10
```

### Optional Environment Variables

```bash
# AWS S3
AWS_ACCESS_KEY_ID=<your_key>
AWS_SECRET_ACCESS_KEY=<your_secret>
AWS_REGION=us-east-1
S3_BUCKET_NAME=bucket-name

# Redis (for real-time updates)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=<your_password>

# Logging & Monitoring
SENTRY_DSN=https://key@sentry.io/project
LOG_LEVEL=info
```

## Setup Instructions

### 1. Local Development

```bash
# Copy example file
cp .env.example .env

# Edit .env with your local values
nano .env

# Ensure .env is in .gitignore (it is)
grep ".env" .gitignore
```

### 2. Production Deployment

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add all required variables
3. Set different values for Production/Preview/Development

**Docker:**
```bash
# Pass secrets via environment
docker run -e DATABASE_URL=... -e JWT_SECRET=... app:latest
```

**Manual Server:**
```bash
# Set environment variables before starting
export DATABASE_URL=...
export JWT_SECRET=...
npm start
```

## Security Best Practices

### 1. JWT Secret
- Generate with: `openssl rand -base64 32`
- Minimum 32 characters
- Rotate regularly in production
- Use different secret for each environment

### 2. Database Credentials
- Use strong passwords (20+ characters)
- Rotate credentials regularly
- Use separate credentials for each environment
- Enable SSL/TLS for database connections

### 3. OAuth Configuration
- Keep OAUTH_SERVER_URL private
- Rotate VITE_APP_ID periodically
- Use HTTPS only for OAuth endpoints
- Validate all OAuth tokens server-side

### 4. AWS S3 Access
- Use IAM roles instead of access keys when possible
- Rotate access keys every 90 days
- Use separate credentials for each environment
- Enable bucket versioning and lifecycle policies

### 5. Redis (if used)
- Use strong passwords
- Enable TLS/SSL
- Restrict network access
- Use separate instances per environment

## Secrets Rotation

### Quarterly Rotation Schedule
- JWT_SECRET: Rotate and update all services
- Database password: Update and test failover
- AWS keys: Rotate and update IAM policies
- OAuth credentials: Refresh with provider

### Emergency Rotation
If a secret is compromised:
1. Immediately generate new secret
2. Update all services
3. Revoke old credentials
4. Monitor for suspicious activity
5. Document incident

## Code Review Checklist

Before committing code:
- [ ] No hardcoded secrets in code
- [ ] No API keys in comments
- [ ] No passwords in configuration files
- [ ] Environment variables used for all secrets
- [ ] .env file in .gitignore
- [ ] .env.example has placeholders only

## Monitoring & Alerts

### What to Monitor
- Failed authentication attempts
- Unauthorized API access
- Database connection errors
- Unusual API usage patterns
- Secret rotation failures

### Alert Thresholds
- 5+ failed logins in 5 minutes: Alert
- Unauthorized API calls: Immediate alert
- Database errors: Alert after 3 occurrences
- Missing environment variables: Immediate alert

## Incident Response

### If Secrets Are Exposed
1. **Immediate**: Revoke the secret
2. **Within 1 hour**: Update all services
3. **Within 24 hours**: Rotate all related secrets
4. **Within 48 hours**: Audit logs for misuse
5. **Within 1 week**: Post-incident review

### Escalation Path
1. Security team notified
2. DevOps updates credentials
3. All services redeployed
4. Logs reviewed for unauthorized access
5. Incident documented

## Resources

- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

## Questions?

Contact the security team or refer to the main README.md for additional information.
