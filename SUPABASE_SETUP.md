# Virtexa Directory — Supabase Setup

## 1. Create the listings table

Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New query):

```sql
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

-- If you already created the table, add the newer columns:
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS services_offered TEXT[] DEFAULT '{}';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS gmb_link TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE vendors ALTER COLUMN rating DROP DEFAULT;
ALTER TABLE vendors ALTER COLUMN review_count DROP DEFAULT;
ALTER TABLE vendors ALTER COLUMN years_active DROP DEFAULT;

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public directory)
DROP POLICY IF EXISTS "Public can read vendors" ON vendors;
CREATE POLICY "Public can read vendors" ON vendors
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_vendors_city ON vendors (city);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors (category);
CREATE INDEX IF NOT EXISTS idx_vendors_verified ON vendors (verified);
```

## 2. Add ownership, claims and access rules

Run the whole of
[`supabase/migrations/20260928000000_claims_and_security.sql`](supabase/migrations/20260928000000_claims_and_security.sql)
in the SQL Editor. It is safe to re-run. It:

- lets anyone submit a **free** listing, but only an admin can set `paid` / `verified`;
- lets a listing be edited or deleted only by its owners (people signed in with an
  email in `vendor_owners`), and only for the details fields — not badges or ratings;
- adds `listing_claims` for "Claim this listing" requests;
- removes the old `listing_otp` table and the old "anyone can update/delete" policies.

> **Partner Badge automation:** the browser can no longer set `paid`. If your
> payment/CRM webhook updates `vendors.paid` in Supabase, it must use the
> **service role** key (Dashboard → Project Settings → API), never the publishable key.

## 3. Turn on email codes for sign-in

Owners sign in with a code emailed by Supabase Auth.

1. **Authentication → Sign In / Providers → Email**: make sure Email is enabled.
2. **Authentication → Emails → Templates**: in both **Confirm signup** (used the
   first time someone signs in) and **Magic Link** (used after that), include the
   code, e.g.

   ```html
   <h2>Your Virtexa verification code</h2>
   <p>Enter this code to continue: <strong>{{ .Token }}</strong></p>
   <p>It expires in 1 hour. If you didn't request it, you can ignore this email.</p>
   ```

   Without `{{ .Token }}` the email only contains a link and people can't finish.
   The code box accepts 6–10 digits, so any OTP length setting works.
3. **Authentication → Emails → SMTP Settings**: set up your own SMTP provider.
   Supabase's built-in email sender is limited to a handful of emails per hour,
   which is not enough for real visitors.

## 4. Reviewing claims

When someone claims a listing they verify their email first, then a row appears in
**Table Editor → `listing_claims`** with `status = pending` (a "Claim Listing"
submission is also sent to the CRM).

- `email_matches_website = true` means their email domain matches the listing's
  website — a strong sign they work there. Otherwise, check with the business
  (for example, call the phone number on the listing).
- To **approve**, change `status` to `approved`. They become an owner automatically
  and can sign in on the Manage Listing page to edit it.
- To **reject**, change `status` to `rejected`.

## 5. Real-time updates

In **Database → Replication**, toggle the `vendors` table on (or run the SQL below) so
the directory updates instantly when a listing is submitted:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE vendors;
```

## 6. Importing real businesses from OpenStreetMap

```bash
node scripts/import-osm.mjs                      # Virginia, 2 per category
node scripts/import-osm.mjs --per-category 1     # 1 per category
node scripts/import-osm.mjs --state NC           # another state
```

The script picks the most complete businesses (name, city, and a phone or website
required) from OpenStreetMap and writes `supabase/seed/osm-<state>.sql`. Review the
list it prints, then run that file in the SQL Editor. Imported listings show as
**Unclaimed** with a "Claim this listing" button until an owner's claim is approved.

---

**Troubleshooting:** If submissions reach your CRM but don't appear in the directory, check:
1. The `vendors` table exists and step 2 has been run
2. Real-time replication is enabled
3. Your browser console for Supabase error messages
