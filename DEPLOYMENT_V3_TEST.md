# CCEval v3.0 Test Environment Deployment Guide

This guide explains how to deploy v3.0 as a test/staging environment alongside the production v2.0 on the same GCP VM.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        GCP VM                               │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │   CCEval v2.0       │    │   CCEval v3.0       │        │
│  │   (Production)      │    │   (Test/Staging)    │        │
│  │   Port: 3000        │    │   Port: 3001        │        │
│  │   DB: cceval_prod   │    │   DB: cceval_test   │        │
│  └─────────────────────┘    └─────────────────────┘        │
│              │                       │                      │
│              ▼                       ▼                      │
│  ┌─────────────────────────────────────────────────┐       │
│  │              PostgreSQL Server                   │       │
│  │  ┌──────────────┐    ┌──────────────┐          │       │
│  │  │ cceval_prod  │    │ cceval_test  │          │       │
│  │  │  (v2 schema) │    │  (v3 schema) │          │       │
│  │  └──────────────┘    └──────────────┘          │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Create Test Database

SSH into your GCP VM and create a new database:

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create test database
CREATE DATABASE cceval_test;

# Grant permissions (replace 'your_user' with your actual DB user)
GRANT ALL PRIVILEGES ON DATABASE cceval_test TO your_user;

# Exit psql
\q
```

## Step 2: Clone v3.0 to Separate Directory

```bash
# Navigate to your projects directory
cd /home/your_user/projects

# Clone or copy for v3.0 test
git clone https://github.com/pragyaa-ai/cceval.git cceval-v3-test
cd cceval-v3-test

# Checkout v3.0.0 tag
git checkout v3.0.0
```

## Step 3: Configure Test Environment

Create `.env` file for the test environment:

```bash
# Copy example env
cp env.example .env

# Edit the environment file
nano .env
```

Update the following in `.env`:

```env
# Database - Use TEST database
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/cceval_test"

# NextAuth - Use different port
NEXTAUTH_URL=http://your-vm-ip:3001
NEXTAUTH_SECRET=your-different-secret-for-test

# OpenAI API Key (same as production)
OPENAI_API_KEY=sk-your-openai-api-key

# Google OAuth (create separate OAuth app for test, or use same)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Step 4: Install Dependencies and Setup Database

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations to create v3.0 schema
npx prisma migrate deploy

# OR for initial setup
npx prisma db push
```

## Step 5: Build and Run Test Environment

```bash
# Build the application
npm run build

# Option A: Run directly (for testing)
PORT=3001 npm run start

# Option B: Run with PM2 (recommended for persistent process)
pm2 start npm --name "cceval-v3-test" -- run start -- -p 3001

# Option C: Create a start script
echo '#!/bin/bash
export PORT=3001
npm run start' > start-test.sh
chmod +x start-test.sh
```

## Step 6: Configure Firewall (if needed)

If port 3001 is not open:

```bash
# GCP Console -> VPC Network -> Firewall Rules
# Add rule to allow TCP port 3001

# Or via gcloud CLI
gcloud compute firewall-rules create allow-cceval-test \
    --allow tcp:3001 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow CCEval v3 test environment"
```

## Step 7: Access Test Environment

- **Production (v2.0)**: `http://your-vm-ip:3000`
- **Test (v3.0)**: `http://your-vm-ip:3001`

## Step 8: Seed Test Data (Optional)

Create a test organization and users:

```bash
# Run Prisma Studio to manage data
npx prisma studio
```

Or create via SQL:

```sql
-- Connect to test database
\c cceval_test

-- Create test organization
INSERT INTO "Organization" (id, name, slug, description, "updatedAt")
VALUES (
  'test-org-001',
  'Test Organization',
  'test-org',
  'Organization for testing v3.0 features',
  NOW()
);

-- Update a test user to belong to the organization
UPDATE "User" SET "organizationId" = 'test-org-001' WHERE email = 'your-test-email@example.com';
```

## Directory Structure on VM

```
/home/your_user/projects/
├── cceval/                 # v2.0 Production
│   ├── .env               # Production config (port 3000, cceval_prod)
│   └── ...
│
└── cceval-v3-test/        # v3.0 Test/Staging
    ├── .env               # Test config (port 3001, cceval_test)
    └── ...
```

## PM2 Process Management

If using PM2 for process management:

```bash
# View all processes
pm2 list

# Expected output:
# ┌─────────────────────┬────┬─────────┬──────┬───────────┐
# │ Name                │ id │ status  │ port │ memory    │
# ├─────────────────────┼────┼─────────┼──────┼───────────┤
# │ cceval-prod         │ 0  │ online  │ 3000 │ 150mb     │
# │ cceval-v3-test      │ 1  │ online  │ 3001 │ 150mb     │
# └─────────────────────┴────┴─────────┴──────┴───────────┘

# View logs for test environment
pm2 logs cceval-v3-test

# Restart test environment
pm2 restart cceval-v3-test

# Stop test environment
pm2 stop cceval-v3-test
```

## Testing Checklist

Before promoting v3.0 to production:

### Basic Functionality
- [ ] Login/logout works correctly
- [ ] Organization is populated in session
- [ ] Existing evaluation flow works (batches, candidates)

### New Features (v3.0)
- [ ] Scenarios tab is visible in dashboard
- [ ] Can create new scenario
- [ ] Can add criteria manually
- [ ] AI transcript analysis works
- [ ] Suggested criteria can be added
- [ ] Batch creation shows scenario selector
- [ ] Batches can be linked to scenarios

### Data Isolation
- [ ] Users only see their organization's scenarios
- [ ] Batches are scoped to organization
- [ ] API returns correct filtered data

### Performance
- [ ] Dashboard loads within acceptable time
- [ ] Voice evaluation works smoothly
- [ ] No memory leaks during extended use

## Promoting v3.0 to Production

Once testing is complete:

1. **Backup production database**
   ```bash
   pg_dump cceval_prod > cceval_prod_backup_$(date +%Y%m%d).sql
   ```

2. **Stop production v2.0**
   ```bash
   pm2 stop cceval-prod
   ```

3. **Update production code**
   ```bash
   cd /home/your_user/projects/cceval
   git fetch origin
   git checkout v3.0.0
   npm install
   npx prisma generate
   ```

4. **Run migrations on production database**
   ```bash
   npx prisma migrate deploy
   ```

5. **Restart production**
   ```bash
   pm2 restart cceval-prod
   ```

6. **Verify production is working**

7. **Stop and remove test environment (optional)**
   ```bash
   pm2 delete cceval-v3-test
   rm -rf /home/your_user/projects/cceval-v3-test
   # Drop test database
   sudo -u postgres psql -c "DROP DATABASE cceval_test;"
   ```

## Rollback Plan

If issues occur after promoting to production:

```bash
# Stop v3.0
pm2 stop cceval-prod

# Restore database from backup
psql cceval_prod < cceval_prod_backup_YYYYMMDD.sql

# Checkout v2.0
cd /home/your_user/projects/cceval
git checkout v2.0.0
npm install
npx prisma generate

# Restart
pm2 restart cceval-prod
```

## Support

For issues with deployment, check:
1. Application logs: `pm2 logs cceval-v3-test`
2. Database connectivity: `psql -d cceval_test -c "SELECT 1;"`
3. Port accessibility: `curl http://localhost:3001`

