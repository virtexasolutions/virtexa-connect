-- Virtexa Directory: listing ownership, claim requests, and locked-down access.
--
-- Run once in the Supabase SQL Editor after the base `vendors` table exists
-- (see SUPABASE_SETUP.md). Safe to re-run.
--
-- What this does:
--   * Removes the old "anyone can update/delete" policies and the public
--     `listing_otp` table (its codes were readable by anyone).
--   * Owners sign in with a 6-digit email code (Supabase Auth). Only the
--     emails listed in `vendor_owners` can edit or delete a listing.
--   * Adds `listing_claims`: a verified-email claim request that an admin
--     approves by setting status = 'approved'.
--   * New public submissions can no longer mark themselves paid/verified.

-- ---------------------------------------------------------------------------
-- 1. New vendor columns
-- ---------------------------------------------------------------------------
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'submitted';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS source_ref TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS claimed BOOLEAN NOT NULL DEFAULT FALSE;

DO $$ BEGIN
  ALTER TABLE vendors ADD CONSTRAINT vendors_source_check
    CHECK (source IN ('submitted', 'osm', 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Listings submitted through the form belong to whoever submitted them.
UPDATE vendors SET claimed = TRUE WHERE source = 'submitted' AND claimed = FALSE;

-- ---------------------------------------------------------------------------
-- 2. Owners (private: each signed-in user can only see their own rows)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_owners (
  vendor_id TEXT NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (vendor_id, owner_email)
);
CREATE INDEX IF NOT EXISTS idx_vendor_owners_email ON vendor_owners (owner_email);

-- Existing submitted listings: the email on the listing is the owner.
INSERT INTO vendor_owners (vendor_id, owner_email)
SELECT id, lower(trim(email)) FROM vendors
WHERE source = 'submitted' AND coalesce(trim(email), '') <> ''
ON CONFLICT DO NOTHING;

ALTER TABLE vendor_owners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read own rows" ON vendor_owners;
CREATE POLICY "Owners read own rows" ON vendor_owners
  FOR SELECT TO authenticated
  USING (owner_email = lower(auth.jwt() ->> 'email'));

-- True when the signed-in user owns the given listing.
CREATE OR REPLACE FUNCTION public.is_vendor_owner(v_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vendor_owners
    WHERE vendor_id = v_id AND owner_email = lower(auth.jwt() ->> 'email')
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. Vendor triggers: submitted listings are owned by the submitting email
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vendors_before_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.claimed := (NEW.source = 'submitted');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS vendors_before_insert ON vendors;
CREATE TRIGGER vendors_before_insert BEFORE INSERT ON vendors
  FOR EACH ROW EXECUTE FUNCTION public.vendors_before_insert();

CREATE OR REPLACE FUNCTION public.vendors_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.source = 'submitted' AND coalesce(trim(NEW.email), '') <> '' THEN
    INSERT INTO vendor_owners (vendor_id, owner_email)
    VALUES (NEW.id, lower(trim(NEW.email)))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS vendors_after_insert ON vendors;
CREATE TRIGGER vendors_after_insert AFTER INSERT ON vendors
  FOR EACH ROW EXECUTE FUNCTION public.vendors_after_insert();

-- ---------------------------------------------------------------------------
-- 4. Vendor access rules
-- ---------------------------------------------------------------------------
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert vendors" ON vendors;
DROP POLICY IF EXISTS "Public can update vendors" ON vendors;
DROP POLICY IF EXISTS "Public can delete vendors" ON vendors;
DROP POLICY IF EXISTS "Public can submit free listings" ON vendors;
DROP POLICY IF EXISTS "Owners can update their listings" ON vendors;
DROP POLICY IF EXISTS "Owners can delete their listings" ON vendors;

-- Free listings only: paid/verified are set by an admin after payment.
CREATE POLICY "Public can submit free listings" ON vendors
  FOR INSERT TO anon, authenticated
  WITH CHECK (source = 'submitted' AND paid = FALSE AND verified = FALSE);

CREATE POLICY "Owners can update their listings" ON vendors
  FOR UPDATE TO authenticated
  USING (public.is_vendor_owner(id))
  WITH CHECK (public.is_vendor_owner(id));

CREATE POLICY "Owners can delete their listings" ON vendors
  FOR DELETE TO authenticated
  USING (public.is_vendor_owner(id));

-- Owners may edit their details, but not badges, ratings or ownership fields.
REVOKE UPDATE ON vendors FROM anon, authenticated;
GRANT UPDATE (
  name, category, city, state, phone, email, website, address, tags,
  bio, long_bio, services_offered, gmb_link, facebook, instagram, linkedin
) ON vendors TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Claim requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id TEXT NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
  claimant_name TEXT NOT NULL,
  claimant_email TEXT NOT NULL,
  claimant_phone TEXT NOT NULL DEFAULT '',
  claimant_role TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  -- Set by the database: does the email's domain match the listing website?
  email_matches_website BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_listing_claims_status ON listing_claims (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_claims_one_pending
  ON listing_claims (vendor_id, claimant_email) WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.listing_claims_before_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  site_host TEXT;
  email_domain TEXT;
BEGIN
  NEW.claimant_email := lower(trim(NEW.claimant_email));
  NEW.status := 'pending';
  NEW.reviewed_at := NULL;

  SELECT lower(regexp_replace(website, '^(https?://)?(www\.)?([^/:?#]+).*$', '\3'))
    INTO site_host FROM vendors WHERE id = NEW.vendor_id;
  email_domain := split_part(NEW.claimant_email, '@', 2);
  NEW.email_matches_website := coalesce(site_host, '') <> '' AND email_domain <> ''
    AND (site_host = email_domain OR site_host LIKE '%.' || email_domain);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS listing_claims_before_insert ON listing_claims;
CREATE TRIGGER listing_claims_before_insert BEFORE INSERT ON listing_claims
  FOR EACH ROW EXECUTE FUNCTION public.listing_claims_before_insert();

-- Approving a claim (status -> 'approved' in the Table Editor) grants ownership.
CREATE OR REPLACE FUNCTION public.listing_claims_on_review()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    NEW.reviewed_at := NOW();
    IF NEW.status = 'approved' THEN
      INSERT INTO vendor_owners (vendor_id, owner_email)
      VALUES (NEW.vendor_id, NEW.claimant_email)
      ON CONFLICT DO NOTHING;
      UPDATE vendors SET claimed = TRUE WHERE id = NEW.vendor_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS listing_claims_on_review ON listing_claims;
CREATE TRIGGER listing_claims_on_review BEFORE UPDATE ON listing_claims
  FOR EACH ROW EXECUTE FUNCTION public.listing_claims_on_review();

ALTER TABLE listing_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Verified users submit claims" ON listing_claims;
DROP POLICY IF EXISTS "Claimants read own claims" ON listing_claims;

-- The claimant must have verified the email they are claiming with.
CREATE POLICY "Verified users submit claims" ON listing_claims
  FOR INSERT TO authenticated
  WITH CHECK (lower(claimant_email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "Claimants read own claims" ON listing_claims
  FOR SELECT TO authenticated
  USING (claimant_email = lower(auth.jwt() ->> 'email'));

REVOKE UPDATE, DELETE ON listing_claims FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Remove the old public verification-code table
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS listing_otp;
