# Cafeteria V6 - Production Deployment Guide

## Overview

This guide covers deploying Cafeteria V6 to production using:
- **Frontend & Backend**: Vercel (Node.js runtime)
- **Database**: Supabase (PostgreSQL)
- **Version Control**: GitHub

## Prerequisites

Before deploying, ensure you have:
- GitHub account with repository access
- Vercel account (free tier available)
- Supabase account (free tier available)
- OAuth provider configured (Manus OAuth or alternative)
- AWS account (optional, for S3 image uploads)

## Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Select your organization
4. Enter project name: `cafeteria-v6-prod`
5. Set a strong database password
6. Select region closest to your users
7. Click "Create new project"

### 1.2 Get Database URL

1. Go to Project Settings → Database
2. Copy the connection string under "Connection pooling"
3. Replace `[PASSWORD]` with your database password
4. Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres`

### 1.3 Run Database Migrations

```bash
# Set DATABASE_URL locally
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"

# Run migrations
pnpm run db:push

# Verify schema
pnpm run db:studio
```

## Step 2: GitHub Setup

### 2.1 Create GitHub Repository

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Cafeteria V6 production-ready"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/cafeteria-v6.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 2.2 Repository Structure

```
cafeteria-v6/
├── client/              # React frontend
├── server/              # tRPC backend
├── drizzle/             # Database schema & migrations
├── dist/                # Build output (generated)
├── .env.example         # Local development
├── .env.production.example  # Production template
├── vercel.json          # Vercel configuration
├── package.json         # Dependencies
└── README.md            # Documentation
```

## Step 3: Vercel Deployment

### 3.1 Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Click "Import Git Repository"
4. Select your GitHub repository
5. Click "Import"

### 3.2 Configure Environment Variables

1. In Vercel, go to Project Settings → Environment Variables
2. Add the following variables:

**Production Environment:**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
JWT_SECRET=[generate with: openssl rand -base64 32]
VITE_APP_ID=your_production_app_id
OAUTH_SERVER_URL=https://your-oauth-server.com
OWNER_OPEN_ID=10
NODE_ENV=production
```

**Preview Environment (optional, for staging):**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID]-preview.supabase.co:5432/postgres
JWT_SECRET=[different secret for preview]
VITE_APP_ID=your_preview_app_id
NODE_ENV=preview
```

### 3.3 Deploy

1. Vercel will automatically deploy when you push to main branch
2. Monitor deployment in Vercel Dashboard
3. Check build logs if deployment fails

## Step 4: Verify Deployment

### 4.1 Test Application

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Test login flow
3. Verify database connectivity
4. Test core features:
   - Create marketer
   - Create cafeteria
   - Create sections and tables
   - Place order
   - Process payment

### 4.2 Monitor Logs

```bash
# View Vercel logs
vercel logs --prod

# View database logs (Supabase)
# Go to Supabase Dashboard → Logs
```

## Step 5: Post-Deployment Configuration

### 5.1 Configure Custom Domain (Optional)

1. In Vercel, go to Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for DNS propagation (up to 48 hours)

### 5.2 Enable HTTPS

- Automatic with Vercel (no action needed)
- Certificates auto-renew

### 5.3 Configure CORS

If frontend and backend are on different domains:

```typescript
// server/_core/index.ts
const cors = cors({
  origin: process.env.FRONTEND_URL || "https://your-app.vercel.app",
  credentials: true,
});
```

## Step 6: Monitoring & Maintenance

### 6.1 Set Up Alerts

**Vercel:**
- Go to Settings → Alerts
- Enable deployment failure notifications
- Set up performance alerts

**Supabase:**
- Go to Logs → Alerts
- Set up database error alerts
- Monitor connection pool usage

### 6.2 Regular Maintenance

| Task | Frequency | Notes |
|------|-----------|-------|
| Rotate JWT_SECRET | Every 90 days | Requires redeployment |
| Rotate DB password | Every 90 days | Update DATABASE_URL |
| Review access logs | Weekly | Check for suspicious activity |
| Database backup | Daily | Automatic with Supabase |
| Update dependencies | Monthly | Run `pnpm update` |

### 6.3 Backup Strategy

**Supabase Backups:**
- Automatic daily backups (free tier: 7-day retention)
- Upgrade for longer retention if needed
- Test restore procedure monthly

**Application Code:**
- Backed up by GitHub
- Tag releases: `git tag -a v1.0.0 -m "Production release"`

## Troubleshooting

### Build Fails on Vercel

**Problem**: Build fails with TypeScript errors

**Solution**:
```bash
# Verify locally
pnpm check
pnpm build

# Check for environment variables
echo $DATABASE_URL
echo $JWT_SECRET

# Redeploy
vercel --prod
```

### Database Connection Fails

**Problem**: `ECONNREFUSED` or timeout errors

**Solution**:
1. Verify DATABASE_URL is correct
2. Check Supabase project status
3. Verify IP whitelist (if applicable)
4. Check connection pool limits

### OAuth Login Fails

**Problem**: OAuth redirect or token exchange fails

**Solution**:
1. Verify OAUTH_SERVER_URL is correct
2. Check OAuth app credentials
3. Verify redirect URI matches configuration
4. Check logs for error details

## Performance Optimization

### Code Splitting

The build includes large chunks (>500kB). To optimize:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'trpc': ['@trpc/client', '@trpc/server'],
        }
      }
    }
  }
});
```

### Database Optimization

1. Add indexes for frequently queried columns
2. Monitor slow queries in Supabase
3. Use connection pooling (enabled by default)

### Caching

Consider adding Redis for:
- Session caching
- Real-time updates
- Rate limiting

## Security Checklist

- [ ] All environment variables set in Vercel
- [ ] No secrets in source code
- [ ] HTTPS enabled (automatic)
- [ ] Database SSL/TLS enabled
- [ ] JWT_SECRET is strong and unique
- [ ] OAuth credentials secured
- [ ] Database backups configured
- [ ] Monitoring and alerts enabled
- [ ] Access logs reviewed
- [ ] Incident response plan documented

## Rollback Procedure

If deployment causes issues:

```bash
# Option 1: Revert to previous commit
git revert HEAD
git push origin main
# Vercel will automatically redeploy

# Option 2: Manual rollback in Vercel
# Go to Deployments → Select previous version → Promote to Production

# Option 3: Database rollback (if schema changed)
# Contact Supabase support for point-in-time recovery
```

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Node.js Best Practices**: https://nodejs.org/en/docs/guides/
- **tRPC Documentation**: https://trpc.io/docs
- **Security Guide**: See SECURITY.md

## Next Steps

1. Set up monitoring and alerts
2. Configure custom domain
3. Set up CI/CD pipeline for automated testing
4. Plan regular security audits
5. Document runbooks for common issues
