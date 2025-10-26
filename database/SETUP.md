# HIMS Database Setup Guide

## Overview
This guide provides step-by-step instructions to set up the Hospital Information Management System database.

---

## Option 1: Supabase (Recommended for Development)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Fill in project details:
   - **Name**: HIMS
   - **Database Password**: (Save this securely!)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

### Step 2: Get Connection Details
1. Go to Project Settings → Database
2. Copy the following:
   - **Connection String**: `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres`
   - **Anon Public Key**: For client-side queries
   - **Service Role Key**: For server-side admin queries

### Step 3: Run Migration
1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `database/schema.sql`
3. Paste and click "Run"
4. Wait for completion (may take 1-2 minutes)

### Step 4: Configure Environment Variables
Create `.env.local` in project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NODE_ENV=development
```

---

## Option 2: Local PostgreSQL

### Step 1: Install PostgreSQL
**Windows:**
```bash
# Download from https://www.postgresql.org/download/windows/
# Run installer and set password for 'postgres' user
```

**Mac (using Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# In psql shell:
CREATE DATABASE hims_db;
\c hims_db

# Run the migration
\i /path/to/database/schema.sql

# Exit psql
\q
```

### Step 3: Configure Environment Variables
Create `.env.local`:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/hims_db

# Application
NODE_ENV=development
```

---

## Option 3: Docker PostgreSQL

### Step 1: Create docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: hims_db
    environment:
      POSTGRES_DB: hims_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Step 2: Start Database
```bash
docker-compose up -d
```

### Step 3: Configure Environment Variables
Same as Option 2 above.

---

## Verification

### Check Tables Created
```sql
-- Connect to database and run:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- hospitals
- users
- user_sessions
- hospital_users
- patients
- appointments
- visits
- prescriptions
- prescription_items
- inventory
- stock_movements
- medical_tests

### Check Helper Functions
```sql
-- List all functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

Expected functions:
- calculate_age
- generate_patient_number
- generate_visit_number
- generate_prescription_number
- update_updated_at_column

### Test Sample Data
```sql
-- Check if sample hospital was created
SELECT * FROM hospitals;

-- Should return: City General Hospital
```

---

## Next Steps

### 1. Create First Admin User
```sql
-- Insert a user
INSERT INTO users (email, password_hash, first_name, last_name, email_verified)
VALUES (
  'admin@hospital.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5ztJ9IgOQJ9lG', -- password: admin123
  'System',
  'Admin',
  TRUE
) RETURNING id;

-- Map user to hospital (use the ID from above)
INSERT INTO hospital_users (hospital_id, user_id, role, employee_id)
VALUES (
  1, -- Hospital ID from sample data
  1, -- User ID from above
  'admin',
  'EMP001'
);
```

### 2. Create Test Data (Optional)
Run `database/seed.sql` if you want sample patients, appointments, etc.:

```bash
psql -U postgres -d hims_db -f database/seed.sql
```

---

## Database Maintenance

### Backup Database
```bash
# Supabase
# Use Supabase dashboard: Database → Backups

# Local PostgreSQL
pg_dump -U postgres hims_db > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
psql -U postgres -d hims_db < backup_20251026.sql
```

### Reset Database (Careful!)
```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE hims_db;"
psql -U postgres -c "CREATE DATABASE hims_db;"
psql -U postgres -d hims_db -f database/schema.sql
```

---

## Troubleshooting

### Connection Issues
```bash
# Test connection
psql -U postgres -h localhost -p 5432 -d hims_db

# Check if PostgreSQL is running
# Windows:
sc query postgresql-x64-16

# Mac/Linux:
ps aux | grep postgres
```

### Permission Issues
```sql
-- Grant permissions to user
GRANT ALL PRIVILEGES ON DATABASE hims_db TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

### Supabase Row Level Security (RLS)
If you enabled RLS, disable it for development:

```sql
-- Disable RLS on all tables
ALTER TABLE hospitals DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
-- (repeat for all tables)
```

---

## Production Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Enable SSL connections
- [ ] Set up automated backups
- [ ] Configure connection pooling
- [ ] Enable Row Level Security (RLS)
- [ ] Set up monitoring and alerts
- [ ] Create read replicas (if needed)
- [ ] Configure proper indexes
- [ ] Set up audit logging
- [ ] Implement data retention policies

---

## Schema Version
**Current Version**: 1.0.0  
**Last Updated**: October 26, 2025  
**Database**: PostgreSQL 14+

For questions or issues, refer to the main `TODO.md` file.
