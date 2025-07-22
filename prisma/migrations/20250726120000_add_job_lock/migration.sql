CREATE TABLE IF NOT EXISTS "job_locks" (
  "name" text PRIMARY KEY,
  "expires_at" timestamp(3) NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT NOW()
); 