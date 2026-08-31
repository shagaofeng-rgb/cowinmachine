CREATE TABLE IF NOT EXISTS analytics_visitors (
  visitor_id text PRIMARY KEY,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  country_code text,
  region_code text,
  preferred_language text,
  first_channel text,
  device_type text,
  ip_hash text
);

CREATE TABLE IF NOT EXISTS analytics_sessions (
  session_id text PRIMARY KEY,
  visitor_id text NOT NULL REFERENCES analytics_visitors(visitor_id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  channel text NOT NULL DEFAULT 'direct',
  referrer_host text,
  landing_path text,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  device_type text,
  browser_name text,
  os_name text
);

CREATE TABLE IF NOT EXISTS analytics_events (
  event_id text PRIMARY KEY,
  visitor_id text NOT NULL REFERENCES analytics_visitors(visitor_id) ON DELETE CASCADE,
  session_id text NOT NULL REFERENCES analytics_sessions(session_id) ON DELETE CASCADE,
  event_name text NOT NULL,
  page_path text NOT NULL,
  page_title text,
  product_category text,
  product_slug text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS b2b_leads (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new',
  name text NOT NULL,
  company text NOT NULL,
  country text NOT NULL,
  email text NOT NULL,
  whatsapp text,
  category text NOT NULL,
  product_model text,
  product_url text,
  application text,
  material text,
  quantity text,
  message text NOT NULL,
  project_requirements text,
  visitor_id text REFERENCES analytics_visitors(visitor_id) ON DELETE SET NULL,
  session_id text REFERENCES analytics_sessions(session_id) ON DELETE SET NULL,
  source_channel text,
  landing_path text
);

CREATE TABLE IF NOT EXISTS b2b_lead_activities (
  id text PRIMARY KEY,
  lead_id text NOT NULL REFERENCES b2b_leads(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  note text,
  actor text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inquiry_rate_limits (
  fingerprint text NOT NULL,
  bucket_start timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  PRIMARY KEY (fingerprint, bucket_start)
);

CREATE TABLE IF NOT EXISTS seo_search_snapshots (
  id text PRIMARY KEY,
  observed_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL,
  date_start date,
  date_end date,
  country text,
  device text,
  query text,
  landing_path text,
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  ctr numeric(8,5),
  average_position numeric(10,3),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS b2b_admin_audit_logs (
  id text PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor text NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS analytics_events_occurred_at_idx ON analytics_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_page_idx ON analytics_events (page_path, occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_product_idx ON analytics_events (product_category, product_slug, occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_sessions_visitor_idx ON analytics_sessions (visitor_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS b2b_leads_created_at_idx ON b2b_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS b2b_leads_status_idx ON b2b_leads (status, created_at DESC);
CREATE INDEX IF NOT EXISTS seo_search_snapshots_observed_at_idx ON seo_search_snapshots (observed_at DESC);
