import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './shared/schema.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

async function runMigrations() {
  console.log('[MIGRATION] Starting database migrations...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  const db = drizzle(pool, { schema });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('[MIGRATION] Database connection successful');

    // Create tables using raw SQL
    console.log('[MIGRATION] Creating tables...');
    
    // Create enums
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('trucking_company', 'shipping_entity', 'super_admin', 'customer_support');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE cargo_type AS ENUM ('general', 'refrigerated', 'hazardous', 'bulk', 'containers');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE industry AS ENUM ('agriculture', 'manufacturing', 'retail', 'mining', 'logistics', 'construction');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE job_status AS ENUM ('available', 'taken', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE country AS ENUM ('BWA', 'ZAF', 'NAM', 'ZWE', 'ZMB');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'trial');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE notification_type AS ENUM ('job_match', 'job_taken', 'job_completed', 'payment_confirmed', 'subscription_expiring');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE dispute_status AS ENUM ('open', 'in_review', 'resolved', 'closed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('[MIGRATION] Enums created successfully');

    // Inside backend/migrate.ts, update the users table creation:
await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    role user_role NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    contact_person_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    physical_address TEXT NOT NULL,
    country country NOT NULL DEFAULT 'BWA',
    business_registration_number VARCHAR(100),
    fleet_size INTEGER,
    cargo_types JSON,
    documents JSON,
    verified BOOLEAN NOT NULL DEFAULT false, -- Added missing field
    subscription_status subscription_status NOT NULL DEFAULT 'inactive',
    subscription_expires_at TIMESTAMP,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    stripe_subscription_status VARCHAR(50), -- Added missing field causing the error
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    login_attempts INTEGER NOT NULL DEFAULT 0,
    account_locked BOOLEAN NOT NULL DEFAULT false,
    lock_expires TIMESTAMP,
    -- Added missing 2FA fields
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_secret VARCHAR(255),
    two_factor_code VARCHAR(10),
    two_factor_expires TIMESTAMP,
    backup_codes JSON,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`);
    console.log('[MIGRATION] Users table created');

    // Create jobs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        shipper_id INTEGER NOT NULL REFERENCES users(id),
        carrier_id INTEGER REFERENCES users(id),
        cargo_type cargo_type NOT NULL,
        cargo_weight INTEGER NOT NULL,
        cargo_volume INTEGER NOT NULL,
        industry industry NOT NULL,
        pickup_address TEXT NOT NULL,
        delivery_address TEXT NOT NULL,
        pickup_country country NOT NULL,
        delivery_country country NOT NULL,
        pickup_date TIMESTAMP NOT NULL,
        delivery_deadline TIMESTAMP NOT NULL,
        special_handling TEXT,
        insurance_required BOOLEAN NOT NULL DEFAULT false,
        notes TEXT,
        status job_status NOT NULL DEFAULT 'available',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        taken_at TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);

    console.log('[MIGRATION] Jobs table created');

    // Create chats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL REFERENCES jobs(id),
        participants JSON NOT NULL,
        messages JSON NOT NULL DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('[MIGRATION] Chats table created');

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type notification_type NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSON,
        read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('[MIGRATION] Notifications table created');

    // Create ratings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL REFERENCES jobs(id),
        rater_id INTEGER NOT NULL REFERENCES users(id),
        rated_user_id INTEGER NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('[MIGRATION] Ratings table created');

    // Create disputes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS disputes (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL REFERENCES jobs(id),
        reporter_id INTEGER NOT NULL REFERENCES users(id),
        reported_user_id INTEGER REFERENCES users(id),
        admin_id INTEGER REFERENCES users(id),
        status dispute_status NOT NULL DEFAULT 'open',
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        evidence JSON DEFAULT '[]',
        admin_notes TEXT,
        resolution TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMP
      );
    `);

    console.log('[MIGRATION] Disputes table created');

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_jobs_shipper ON jobs(shipper_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_jobs_carrier ON jobs(carrier_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_chats_job ON chats(job_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);');

    console.log('[MIGRATION] Indexes created');

    console.log('[MIGRATION] ✅ All migrations completed successfully!');
  } catch (error) {
    console.error('[MIGRATION] ❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('[MIGRATION] Process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[MIGRATION] Process failed:', error);
    process.exit(1);
  });
