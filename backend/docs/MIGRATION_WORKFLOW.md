# Database Migration Workflow

**Last Updated**: January 2025  
**Purpose**: Guide for managing database migrations in NextSaaS backend

---

## Overview

This project uses **Prisma** as the ORM and migration tool. Migrations are stored in `backend/prisma/migrations/` and are version-controlled.

---

## Prisma Migration Commands

### Development Workflow

#### 1. Create a New Migration

When you modify `schema.prisma`, create a migration:

```bash
cd backend
npm run prisma:migrate
```

This will:
- Generate migration SQL based on schema changes
- Apply the migration to your development database
- Regenerate Prisma Client

**Example**:
```bash
# After modifying schema.prisma to add a new field
npm run prisma:migrate

# Prisma will prompt for a migration name
# Enter: add_user_avatar_field
# This creates: prisma/migrations/YYYYMMDDHHMMSS_add_user_avatar_field/
```

#### 2. Create Migration Without Applying

To create a migration file without applying it:

```bash
npx prisma migrate dev --create-only
```

This is useful when:
- You want to review the SQL before applying
- You need to modify the migration SQL manually
- You're working in a team and want to review changes

#### 3. Apply Pending Migrations

To apply migrations that haven't been run yet:

```bash
npm run prisma:migrate
```

Or explicitly:

```bash
npx prisma migrate dev
```

#### 4. Reset Database (Development Only)

⚠️ **WARNING**: This deletes all data!

```bash
npx prisma migrate reset
```

This will:
- Drop the database
- Create a new database
- Apply all migrations
- Run seed script (if configured)

**Use only in development!**

---

## Production Workflow

### 1. Review Migrations

Before deploying to production:

```bash
# Check migration status
npx prisma migrate status

# Review migration files
ls -la prisma/migrations/
```

### 2. Apply Migrations in Production

**Option A: Using Prisma Migrate (Recommended)**

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Apply migrations
npx prisma migrate deploy
```

**Option B: Using Migration Files Directly**

If you need more control:

```bash
# Generate migration SQL
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migration.sql

# Review the SQL
cat migration.sql

# Apply manually (using psql or your database client)
psql $DATABASE_URL < migration.sql
```

### 3. Verify Migration Status

After deployment:

```bash
npx prisma migrate status
```

Should show: `All migrations have been applied`

---

## Migration Best Practices

### 1. Always Review Generated SQL

Before applying migrations, review the generated SQL:

```bash
# View migration SQL
cat prisma/migrations/YYYYMMDDHHMMSS_migration_name/migration.sql
```

### 2. Test Migrations Locally First

Always test migrations in development before production:

```bash
# 1. Create migration in development
npm run prisma:migrate

# 2. Test with sample data
npm run seed  # (if seed script exists)

# 3. Verify everything works
npm test

# 4. Then deploy to production
```

### 3. Use Descriptive Migration Names

When prompted for a migration name, use clear, descriptive names:

✅ **Good**:
- `add_user_avatar_field`
- `create_payment_tables`
- `add_oauth_fields_to_user`

❌ **Bad**:
- `update`
- `fix`
- `changes`

### 4. Never Edit Applied Migrations

Once a migration is applied to production, **never edit it**. Instead:
- Create a new migration to fix issues
- Use `prisma migrate resolve` to mark migrations as applied if needed

### 5. Backup Before Migrations

Always backup your database before applying migrations in production:

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Rollback Strategy

### Prisma Doesn't Support Automatic Rollbacks

Prisma doesn't have built-in rollback support. To rollback:

### Option 1: Create Reverse Migration

Create a new migration that reverses the changes:

```bash
# Example: If you added a field, create a migration to remove it
# Edit schema.prisma to remove the field
npm run prisma:migrate
# Name: remove_user_avatar_field
```

### Option 2: Manual SQL Rollback

Write manual SQL to reverse changes:

```sql
-- Example: Remove a column
ALTER TABLE users DROP COLUMN avatar;
```

### Option 3: Restore from Backup

If migration caused issues:

```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

---

## Migration File Structure

Each migration is stored in its own directory:

```
prisma/migrations/
├── 20251210094625_app_migration/
│   └── migration.sql
├── 20251210_add_payment_tables/
│   └── migration.sql
├── 20251210_add_gdpr_tables/
│   └── migration.sql
└── migration_lock.toml
```

**Migration naming format**: `YYYYMMDDHHMMSS_migration_name`

---

## Common Migration Scenarios

### Adding a New Field

```prisma
// schema.prisma
model User {
  // ... existing fields
  avatar String? // New field
}
```

```bash
npm run prisma:migrate
# Name: add_user_avatar_field
```

### Removing a Field

```prisma
// schema.prisma
model User {
  // ... existing fields
  // Remove: oldField String?
}
```

```bash
npm run prisma:migrate
# Name: remove_user_old_field
```

### Adding a New Table

```prisma
// schema.prisma
model Product {
  id        String   @id @default(uuid())
  name      String
  price     Float
  createdAt DateTime @default(now())
}
```

```bash
npm run prisma:migrate
# Name: create_product_table
```

### Adding a Relation

```prisma
// schema.prisma
model User {
  // ... existing fields
  products Product[] // New relation
}

model Product {
  // ... existing fields
  userId String
  user   User   @relation(fields: [userId], references: [id])
}
```

```bash
npm run prisma:migrate
# Name: add_user_product_relation
```

---

## Troubleshooting

### Migration Fails with "Migration Already Applied"

If Prisma thinks a migration is applied but it's not:

```bash
npx prisma migrate resolve --applied YYYYMMDDHHMMSS_migration_name
```

### Migration Fails with "Database is Not in Sync"

If your database schema doesn't match migrations:

```bash
# Check status
npx prisma migrate status

# If needed, mark migrations as applied
npx prisma migrate resolve --applied <migration_name>
```

### Migration Fails with "Foreign Key Constraint"

If migration fails due to existing data:

1. Review the migration SQL
2. Modify to handle existing data (e.g., set default values)
3. Create a new migration

### Database Connection Issues

If migrations fail due to connection:

```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma db pull  # This will fail if connection is bad
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Database Migrations

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npx prisma generate
      - run: cd backend && npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Summary

**Development**:
1. Modify `schema.prisma`
2. Run `npm run prisma:migrate`
3. Test locally
4. Commit migration files

**Production**:
1. Backup database
2. Review migrations
3. Run `npx prisma migrate deploy`
4. Verify with `npx prisma migrate status`

**Best Practices**:
- ✅ Always review migration SQL
- ✅ Test migrations locally first
- ✅ Use descriptive migration names
- ✅ Backup before production migrations
- ✅ Never edit applied migrations

---

## Additional Resources

- [Prisma Migration Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma CLI Reference](https://www.prisma.io/docs/reference/api-reference/command-reference)
- [PostgreSQL Backup/Restore](https://www.postgresql.org/docs/current/backup.html)
