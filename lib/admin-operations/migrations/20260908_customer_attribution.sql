-- Additive migration: customer attribution and visit-journey performance indexes.
-- No existing visitor, lead, analytics or content record is deleted.

CREATE TABLE IF NOT EXISTS b2b_customers (
  id text PRIMARY KEY,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  company text NOT NULL,
  country text NOT NULL,
  email_normalized text,
  whatsapp_normalized text,
  source_channel text
);

ALTER TABLE analytics_visitors ADD COLUMN IF NOT EXISTS customer_id text REFERENCES b2b_customers(id) ON DELETE SET NULL;
ALTER TABLE b2b_leads ADD COLUMN IF NOT EXISTS customer_id text REFERENCES b2b_customers(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS b2b_customers_email_unique ON b2b_customers (email_normalized) WHERE email_normalized IS NOT NULL;
CREATE INDEX IF NOT EXISTS b2b_customers_last_seen_idx ON b2b_customers (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS analytics_visitors_customer_idx ON analytics_visitors (customer_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS b2b_leads_customer_idx ON b2b_leads (customer_id, created_at DESC);
