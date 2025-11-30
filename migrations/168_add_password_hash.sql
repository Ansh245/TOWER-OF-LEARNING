-- migration: add password_hash to users
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS password_hash text NOT NULL DEFAULT 'default_hash';
