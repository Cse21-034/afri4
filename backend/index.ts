import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { pool } from "./db.js";

const app = express();

// CORS configuration for frontend deployment
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://www.loadxafrica.com',
      'https://loadxafrica.com',
      'http://localhost:3000',
      'https://localhost:3000',
      'https://afri4-7fb5.vercel.app',
      'https://afri4-iota.vercel.app',
    ].filter((o): o is string => Boolean(o));
    
    console.log(`[CORS DEBUG] Incoming request from origin: ${origin || 'NO ORIGIN'}`);
    console.log(`[CORS DEBUG] Allowed origins:`, allowedOrigins);
    
    if (!origin) {
      console.log('[CORS DEBUG] Request with no origin - ALLOWED');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('[CORS DEBUG] Origin matched - ALLOWED');
      callback(null, true);
    } else {
      console.log('[CORS DEBUG] Origin not in allowlist - BLOCKED');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  if (path.startsWith("/api")) {
    console.log(`\n[REQUEST] ${req.method} ${path}`);
    console.log(`[REQUEST] Headers:`, JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`[REQUEST] Body:`, JSON.stringify(req.body, null, 2));
    }
    if (req.query && Object.keys(req.query).length > 0) {
      console.log(`[REQUEST] Query:`, JSON.stringify(req.query, null, 2));
    }
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      console.log(`${new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })} [express] ${logLine}`);
      
      if (capturedJsonResponse) {
        console.log(`[RESPONSE] Status: ${res.statusCode}`);
        console.log(`[RESPONSE] Body:`, JSON.stringify(capturedJsonResponse, null, 2));
      }
    }
  });

  next();
});

// Function to run database migrations
async function runMigrations() {
  console.log('\n[MIGRATION] ===================================');
  console.log('[MIGRATION] Starting database setup...');
  console.log('[MIGRATION] ===================================\n');

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('[MIGRATION] ✓ Database connection successful');

    // Create enums
    const enums = [
      { name: 'user_role', values: ['trucking_company', 'shipping_entity', 'super_admin', 'customer_support'] },
      { name: 'cargo_type', values: ['general', 'refrigerated', 'hazardous', 'bulk', 'containers'] },
      { name: 'industry', values: ['agriculture', 'manufacturing', 'retail', 'mining', 'logistics', 'construction'] },
      { name: 'job_status', values: ['available', 'taken', 'completed'] },
      { name: 'country', values: ['BWA', 'ZAF', 'NAM', 'ZWE', 'ZMB'] },
      { name: 'subscription_status', values: ['active', 'inactive', 'trial'] },
      { name: 'notification_type', values: ['job_match', 'job_taken', 'job_completed', 'payment_confirmed', 'subscription_expiring'] },
      { name: 'dispute_status', values: ['open', 'in_review', 'resolved', 'closed'] }
    ];

    for (const enumDef of enums) {
      await pool.query(`
        DO $$ BEGIN
          CREATE TYPE ${enumDef.name} AS ENUM (${enumDef.values.map(v => `'${v}'`).join(', ')});
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    }
    console.log('[MIGRATION] ✓ Enums created/verified');

    // Create users table with enhanced authentication fields
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
        verified BOOLEAN NOT NULL DEFAULT false,
        subscription_status subscription_status NOT NULL DEFAULT 'inactive',
        subscription_expires_at TIMESTAMP,
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        email_verified BOOLEAN NOT NULL DEFAULT false,
        email_verification_token VARCHAR(255),
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        login_attempts INTEGER NOT NULL DEFAULT 0,
        account_locked BOOLEAN NOT NULL DEFAULT false,
        lock_expires TIMESTAMP,
        two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
        two_factor_secret VARCHAR(255),
        two_factor_code VARCHAR(10),
        two_factor_expires TIMESTAMP,
        backup_codes JSON,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('[MIGRATION] ✓ Users table created/verified');

    // Add 2FA columns to existing table if they don't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='two_factor_enabled') THEN
          ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN NOT NULL DEFAULT false;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='two_factor_secret') THEN
          ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='two_factor_code') THEN
          ALTER TABLE users ADD COLUMN two_factor_code VARCHAR(10);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='two_factor_expires') THEN
          ALTER TABLE users ADD COLUMN two_factor_expires TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='backup_codes') THEN
          ALTER TABLE users ADD COLUMN backup_codes JSON;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='email_verification_token') THEN
          ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='password_reset_token') THEN
          ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='password_reset_expires') THEN
          ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='login_attempts') THEN
          ALTER TABLE users ADD COLUMN login_attempts INTEGER NOT NULL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='account_locked') THEN
          ALTER TABLE users ADD COLUMN account_locked BOOLEAN NOT NULL DEFAULT false;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='lock_expires') THEN
          ALTER TABLE users ADD COLUMN lock_expires TIMESTAMP;
        END IF;
      END $$;
    `);
    console.log('[MIGRATION] ✓ Enhanced authentication columns added/verified');

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
    console.log('[MIGRATION] ✓ Jobs table created/verified');

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
    console.log('[MIGRATION] ✓ Chats table created/verified');

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
    console.log('[MIGRATION] ✓ Notifications table created/verified');

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
    console.log('[MIGRATION] ✓ Ratings table created/verified');

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
    console.log('[MIGRATION] ✓ Disputes table created/verified');

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(email_verification_token)',
      'CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(password_reset_token)',
      'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)',
      'CREATE INDEX IF NOT EXISTS idx_jobs_shipper ON jobs(shipper_id)',
      'CREATE INDEX IF NOT EXISTS idx_jobs_carrier ON jobs(carrier_id)',
      'CREATE INDEX IF NOT EXISTS idx_chats_job ON chats(job_id)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status)',
      'CREATE INDEX IF NOT EXISTS idx_disputes_admin ON disputes(admin_id)'
    ];

    for (const indexQuery of indexes) {
      await pool.query(indexQuery);
    }
    console.log('[MIGRATION] ✓ Indexes created/verified');

    console.log('\n[MIGRATION] ===================================');
    console.log('[MIGRATION] ✅ Database setup completed successfully!');
    console.log('[MIGRATION] ===================================\n');
  } catch (error) {
    console.error('\n[MIGRATION] ===================================');
    console.error('[MIGRATION] ❌ Database setup failed:');
    console.error('[MIGRATION]', error);
    console.error('[MIGRATION] ===================================\n');
    throw error;
  }
}

(async () => {
  try {
    // Run migrations first
    await runMigrations();

    // Then register routes
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error('[ERROR] ============================================');
      console.error('[ERROR] Status:', status);
      console.error('[ERROR] Message:', message);
      console.error('[ERROR] Stack:', err.stack);
      console.error('[ERROR] Full error:', JSON.stringify(err, null, 2));
      console.error('[ERROR] ============================================');

      res.status(status).json({ message });
      throw err;
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'connected'
      });
    });

    // API not found handler
    app.use('/api/*', (req, res) => {
      res.status(404).json({ message: 'API endpoint not found' });
    });

    // Start server
    const port = parseInt(process.env.PORT || '5000', 10);
    
    console.log('\n[SERVER STARTUP] ===================================');
    console.log('[SERVER STARTUP] Environment:', process.env.NODE_ENV || 'development');
    console.log('[SERVER STARTUP] Frontend URL:', process.env.FRONTEND_URL || 'not set');
    console.log('[SERVER STARTUP] Port:', port);
    console.log('[SERVER STARTUP] Host: 0.0.0.0');
    console.log('[SERVER STARTUP] ===================================\n');
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log(`${new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })} [express] serving on port ${port}`);
      console.log('[SERVER] ✓ Server successfully started and listening for requests\n');
      console.log('[SERVER] 📍 Health check: http://localhost:' + port + '/health');
      console.log('[SERVER] 📍 API endpoints available at http://localhost:' + port + '/api/*');
    });
  } catch (error) {
    console.error('[STARTUP] Failed to start server:', error);
    process.exit(1);
  }
})();
