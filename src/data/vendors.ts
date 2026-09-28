// Virtexa Real Estate Resource Center — vendor directory data layer.
// Ten categories of local real estate professionals, searchable by city.
// Data is stored in and fetched from Supabase (shared across all visitors).

import { supabase } from "@/lib/supabase";

export type VendorCategory =
  | "agents"
  | "lenders"
  | "title-companies"
  | "home-inspectors"
  | "photographers"
  | "stagers"
  | "contractors"
  | "moving-companies"
  | "insurance-agents"
  | "cleaning";

export interface CategoryMeta {
  id: VendorCategory;
  label: string;
  singular: string;
  description: string;
  icon: string; // lucide icon name
  aeoQuestion: string;
  services: string[];
}

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  rating?: number;
  reviewCount?: number;
  yearsActive?: number;
  tags: string[];
  paid: boolean; // paid listings are "Verified by Virtexa"
  verified: boolean; // derived: paid === verified
  bio: string;
  longBio: string;
  servicesOffered: string[];
  gmbLink: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  claimed: boolean; // false for imported listings nobody has claimed yet
  source: VendorSource;
  sourceRef: string; // e.g. OpenStreetMap "node/123" for imported listings
}

export type VendorSource = "submitted" | "osm" | "admin";

export interface ClaimRequest {
  vendorId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  message: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "agents",
    label: "Real Estate Agents",
    singular: "Agent",
    description:
      "Local agents who know your market — guiding buyers and sellers through every step from first showing to closing day.",
    icon: "Users",
    aeoQuestion: "Who are the best real estate agents in my city?",
    services: [
      "Buyer representation",
      "Listing & marketing",
      "Market analysis",
      "Negotiation",
      "Transaction management",
    ],
  },
  {
    id: "lenders",
    label: "Recommended Lenders",
    singular: "Lender",
    description:
      "Mortgage lenders offering competitive rates, fast pre-approvals, and local market expertise to keep your transaction on schedule.",
    icon: "Landmark",
    aeoQuestion: "Who are the best mortgage lenders in my city?",
    services: [
      "Conventional loans",
      "FHA & VA loans",
      "Jumbo financing",
      "Pre-approval",
      "Refinance",
    ],
  },
  {
    id: "title-companies",
    label: "Title Companies",
    singular: "Title Company",
    description:
      "Title and escrow companies that handle title searches, closings, and insurance so your property transfers without surprises.",
    icon: "ShieldCheck",
    aeoQuestion: "Which title companies handle closings in my area?",
    services: [
      "Title search",
      "Escrow services",
      "Title insurance",
      "Closing coordination",
      "Document recording",
    ],
  },
  {
    id: "home-inspectors",
    label: "Home Inspectors",
    singular: "Home Inspector",
    description:
      "Home inspectors offering report-backed evaluations of structural, mechanical, and safety conditions before you commit.",
    icon: "ClipboardCheck",
    aeoQuestion: "How do I find a reliable home inspector near me?",
    services: [
      "Full home inspection",
      "Pre-listing inspection",
      "Radon testing",
      "Termite & pest",
      "Sewer scope",
    ],
  },
  {
    id: "photographers",
    label: "Real Estate Photographers",
    singular: "Photographer",
    description:
      "Real estate photographers producing HDR imagery, drone video, and virtual tours that help listings sell faster.",
    icon: "Camera",
    aeoQuestion: "Where can I hire a real estate photographer locally?",
    services: [
      "HDR photography",
      "Drone video",
      "Virtual tours",
      "Twilight shots",
      "Floor plans",
    ],
  },
  {
    id: "stagers",
    label: "Home Stagers",
    singular: "Stager",
    description:
      "Home stagers who transform spaces into market-ready showpieces, increasing perceived value and reducing days on market.",
    icon: "Sofa",
    aeoQuestion: "Who offers home staging services in my city?",
    services: [
      "Occupied staging",
      "Vacant staging",
      "Consultations",
      "Furniture rental",
      "Curb appeal",
    ],
  },
  {
    id: "contractors",
    label: "Contractors",
    singular: "Contractor",
    description:
      "Contractors for pre-listing repairs, renovations, and punch-list work — from kitchens to roofing and everything between.",
    icon: "Hammer",
    aeoQuestion: "How do I find trusted contractors for home repairs?",
    services: ["Renovations", "Roofing", "Plumbing", "Electrical", "HVAC"],
  },
  {
    id: "moving-companies",
    label: "Moving Companies",
    singular: "Moving Company",
    description:
      "Moving companies offering local and long-distance relocation, packing services, and secure storage options.",
    icon: "Truck",
    aeoQuestion: "What are the best moving companies near me?",
    services: [
      "Local moves",
      "Long-distance",
      "Packing services",
      "Storage",
      "Specialty items",
    ],
  },
  {
    id: "insurance-agents",
    label: "Insurance Agents",
    singular: "Insurance Agent",
    description:
      "Insurance agents securing homeowners, title, and liability coverage tailored to your property and closing timeline.",
    icon: "Umbrella",
    aeoQuestion: "How do I find a homeowners insurance agent locally?",
    services: [
      "Homeowners insurance",
      "Title insurance",
      "Liability coverage",
      "Bundled policies",
      "Flood coverage",
    ],
  },
  {
    id: "cleaning",
    label: "Cleaning Services",
    singular: "Cleaning Service",
    description:
      "Cleaning services for move-in, move-out, and post-construction — getting homes show-ready and move-in ready.",
    icon: "Sparkles",
    aeoQuestion: "Who offers move-in or move-out cleaning services near me?",
    services: [
      "Move-in cleaning",
      "Move-out cleaning",
      "Post-construction",
      "Deep cleaning",
      "Recurring cleaning",
    ],
  },
];

// The directory serves ALL U.S. cities — no fixed city list required.
export const CITIES: { city: string; state: string }[] = [];

// ---- Supabase data access functions ----

/** Map a Supabase row (snake_case) to the Vendor interface (camelCase) */
function mapRow(row: Record<string, unknown>): Vendor {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as VendorCategory,
    city: row.city as string,
    state: row.state as string,
    phone: row.phone as string,
    email: row.email as string,
    website: row.website as string,
    address: row.address as string,
    rating: row.rating != null ? Number(row.rating) : undefined,
    reviewCount:
      row.review_count != null ? Number(row.review_count) : undefined,
    yearsActive:
      row.years_active != null ? Number(row.years_active) : undefined,
    tags: (row.tags as string[]) ?? [],
    paid: Boolean(row.paid),
    verified: Boolean(row.verified),
    bio: (row.bio as string) ?? "",
    longBio: (row.long_bio as string) ?? "",
    servicesOffered: (row.services_offered as string[]) ?? [],
    gmbLink: (row.gmb_link as string) ?? "",
    facebook: (row.facebook as string) ?? "",
    instagram: (row.instagram as string) ?? "",
    linkedin: (row.linkedin as string) ?? "",
    claimed: row.claimed == null ? true : Boolean(row.claimed),
    source: ((row.source as string) ?? "submitted") as VendorSource,
    sourceRef: (row.source_ref as string) ?? "",
  };
}

/** Fetch all vendors from Supabase */
export async function fetchVendors(): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .order("verified", { ascending: false }) // verified first
    .order("created_at", { ascending: false }); // newest first

  if (error) {
    console.error("Failed to fetch vendors from Supabase:", error);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/**
 * Subscribe to real-time INSERT events on the vendors table.
 * Returns an unsubscribe function. The callback receives the new Vendor.
 */
export function subscribeToVendorInserts(
  onInsert: (vendor: Vendor) => void,
): () => void {
  const channel = supabase
    .channel("vendors-inserts")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "vendors" },
      (payload) => {
        onInsert(mapRow(payload.new as Record<string, unknown>));
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Fetch a single vendor by ID */
export async function fetchVendorById(id: string): Promise<Vendor | undefined> {
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to fetch vendor:", error);
    return undefined;
  }
  return data ? mapRow(data) : undefined;
}

/** Insert a new vendor into Supabase. Returns { ok, error? } */
export async function saveVendor(
  vendor: Vendor,
): Promise<{ ok: boolean; error?: string }> {
  const row = {
    id: vendor.id,
    name: vendor.name,
    category: vendor.category,
    city: vendor.city,
    state: vendor.state,
    phone: vendor.phone,
    email: vendor.email,
    website: vendor.website,
    address: vendor.address,
    rating: vendor.rating ?? null,
    review_count: vendor.reviewCount ?? null,
    years_active: vendor.yearsActive ?? null,
    tags: vendor.tags,
    paid: vendor.paid,
    verified: vendor.verified,
    bio: vendor.bio,
    long_bio: vendor.longBio,
    services_offered: vendor.servicesOffered,
    gmb_link: vendor.gmbLink,
    facebook: vendor.facebook,
    instagram: vendor.instagram,
    linkedin: vendor.linkedin,
  };

  const { error } = await supabase.from("vendors").insert(row);
  if (error) {
    console.error("Failed to save vendor to Supabase:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ---- Owner sign-in (Supabase Auth email code) ----
// The Supabase "Confirm signup" and "Magic Link" email templates must include
// {{ .Token }} so the email contains a code (see SUPABASE_SETUP.md).

/** Email a one-time sign-in code. */
export async function sendLoginCode(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) {
    console.error("Failed to send sign-in code:", error);
    return {
      ok: false,
      error:
        error.status === 429
          ? "Too many codes requested. Please wait a few minutes and try again."
          : "Could not send the verification email. Please try again.",
    };
  }
  return { ok: true };
}

/** Check the emailed code. On success the visitor is signed in as that email. */
export async function verifyLoginCode(
  email: string,
  code: string,
): Promise<boolean> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code.trim(),
    type: "email",
  });
  if (error) console.error("Failed to verify code:", error);
  return !error && Boolean(data.session);
}

/** Email of the signed-in owner, or null. */
export async function getSignedInEmail(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.email?.toLowerCase() ?? null;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Listings the signed-in email owns. */
export async function fetchMyListings(): Promise<Vendor[]> {
  const { data: owned, error } = await supabase
    .from("vendor_owners")
    .select("vendor_id");
  if (error) {
    console.error("Failed to load owned listings:", error);
    return [];
  }
  const ids = (owned ?? []).map((r) => r.vendor_id as string);
  if (ids.length === 0) return [];

  const { data, error: vendorsError } = await supabase
    .from("vendors")
    .select("*")
    .in("id", ids);
  if (vendorsError) {
    console.error("Failed to load owned listings:", vendorsError);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** IDs of listings the signed-in email has claims pending review for. */
export async function fetchMyPendingClaimIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from("listing_claims")
    .select("vendor_id")
    .eq("status", "pending");
  if (error) {
    console.error("Failed to load claims:", error);
    return [];
  }
  return (data ?? []).map((r) => r.vendor_id as string);
}

/** Submit a claim request. The signed-in email must match `claim.email`. */
export async function submitClaim(
  claim: ClaimRequest,
): Promise<{ ok: boolean; alreadyPending?: boolean; error?: string }> {
  const { error } = await supabase.from("listing_claims").insert({
    vendor_id: claim.vendorId,
    claimant_name: claim.name,
    claimant_email: claim.email.toLowerCase(),
    claimant_phone: claim.phone,
    claimant_role: claim.role,
    message: claim.message,
  });
  if (error) {
    if (error.code === "23505") return { ok: true, alreadyPending: true };
    console.error("Failed to submit claim:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Update an existing vendor in Supabase */
export async function updateVendor(
  id: string,
  updates: Partial<Vendor>,
): Promise<boolean> {
  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.city !== undefined) row.city = updates.city;
  if (updates.state !== undefined) row.state = updates.state;
  if (updates.phone !== undefined) row.phone = updates.phone;
  if (updates.email !== undefined) row.email = updates.email;
  if (updates.website !== undefined) row.website = updates.website;
  if (updates.address !== undefined) row.address = updates.address;
  if (updates.bio !== undefined) row.bio = updates.bio;
  if (updates.longBio !== undefined) row.long_bio = updates.longBio;
  if (updates.servicesOffered !== undefined)
    row.services_offered = updates.servicesOffered;
  if (updates.gmbLink !== undefined) row.gmb_link = updates.gmbLink;
  if (updates.facebook !== undefined) row.facebook = updates.facebook;
  if (updates.instagram !== undefined) row.instagram = updates.instagram;
  if (updates.linkedin !== undefined) row.linkedin = updates.linkedin;
  if (updates.tags !== undefined) row.tags = updates.tags;

  // Row-level security silently skips listings you don't own, so confirm a row changed.
  const { data, error } = await supabase
    .from("vendors")
    .update(row)
    .eq("id", id)
    .select("id");
  if (error || !data?.length) {
    console.error("Failed to update vendor:", error ?? "not an owner");
    return false;
  }
  return true;
}

/** Delete a vendor from Supabase */
export async function deleteVendor(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("vendors")
    .delete()
    .eq("id", id)
    .select("id");
  if (error || !data?.length) {
    console.error("Failed to delete vendor:", error ?? "not an owner");
    return false;
  }
  return true;
}

export function getCityLabel(city?: string, state?: string): string {
  if (!city) return "the United States";
  return state ? `${city}, ${state}` : city;
}

/**
 * Check if a vendor has been marked as a paid partner.
 * Paid status is toggled manually in the Supabase dashboard after payment confirmation.
 */
export async function checkVendorPaidStatus(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("vendors")
    .select("paid")
    .eq("id", id)
    .single();

  if (error || !data) return false;
  return Boolean((data as Record<string, unknown>).paid);
}
