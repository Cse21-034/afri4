-- Trigram search index for admin job search (GET /api/admin/jobs?search=).
-- Not managed by `npm run db:push` (Drizzle Kit doesn't create extensions), so this
-- has to be run once, directly against the database, whenever search starts feeling
-- slow at higher job volume. The ILIKE query in storage.ts#getAllJobsAdmin works
-- without this -- it just can't use an index until this exists, so it degrades to a
-- full table scan as the jobs table grows.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS jobs_pickup_address_trgm_idx ON jobs USING gin (pickup_address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS jobs_delivery_address_trgm_idx ON jobs USING gin (delivery_address gin_trgm_ops);
