# Virtexa Directory — Supabase Setup

Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New query):

```sql
-- Directory listings table
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT NOT NULL,
  address TEXT NOT NULL,
  rating NUMERIC,
  review_count INTEGER,
  years_active INTEGER,
  tags TEXT[] DEFAULT '{}',
  paid BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  bio TEXT,
  long_bio TEXT,
  services_offered TEXT[] DEFAULT '{}',
  gmb_link TEXT,
  facebook TEXT,
  instagram TEXT,
  linkedin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If you already created the table, add the new columns:
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS services_offered TEXT[] DEFAULT '{}';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS gmb_link TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE vendors ALTER COLUMN rating DROP DEFAULT;
ALTER TABLE vendors ALTER COLUMN review_count DROP DEFAULT;
ALTER TABLE vendors ALTER COLUMN years_active DROP DEFAULT;

-- Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public directory)
CREATE POLICY "Public can read vendors" ON vendors
  FOR SELECT USING (true);

-- Anyone can insert (free listings via the form)
CREATE POLICY "Public can insert vendors" ON vendors
  FOR INSERT WITH CHECK (true);

-- Anyone can update (claim & edit listing flow)
CREATE POLICY "Public can update vendors" ON vendors
  FOR UPDATE USING (true) WITH CHECK (true);

-- Anyone can delete (claim & delete listing flow)
CREATE POLICY "Public can delete vendors" ON vendors
  FOR DELETE USING (true);

-- Index for faster city/category filtering
CREATE INDEX IF NOT EXISTS idx_vendors_city ON vendors (city);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors (category);
CREATE INDEX IF NOT EXISTS idx_vendors_verified ON vendors (verified);
```

## Enable Real-time (required for live directory updates)

In your Supabase Dashboard:

1. Go to **Database → Replication**
2. Find the `vendors` table and toggle **ON** (or run the SQL below)

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE vendors;
```

This enables the directory to update instantly when a new listing is submitted — no page refresh needed.

## Email Verification Table (for Claim & Manage flow)

Run this SQL to create the `listing_otp` table that stores one-time verification codes:

```sql
CREATE TABLE IF NOT EXISTS listing_otp (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE listing_otp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage OTP" ON listing_otp
  FOR ALL USING (true) WITH CHECK (true);
```

This allows the Claim & Manage page to send and verify 6-digit codes via email before anyone can edit or delete a listing.

---

**Troubleshooting:** If submissions reach your CRM but don't appear in the directory, check:
1. The `vendors` table exists (run the SQL above)
2. Row Level Security policies are created (the SQL above includes them)
3. Real-time replication is enabled (the SQL/step above)
4. Check your browser console for Supabase error messages
