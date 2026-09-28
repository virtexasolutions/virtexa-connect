#!/usr/bin/env node
// Pull a few real businesses per directory category from OpenStreetMap and
// write them out as SQL to paste into the Supabase SQL Editor.
//
//   node scripts/import-osm.mjs                      # Virginia, 2 per category
//   node scripts/import-osm.mjs --state VA --per-category 1
//   node scripts/import-osm.mjs --input saved.json   # reuse a saved Overpass response
//
// Only businesses with a name, a city and a phone number or website are
// considered; the most complete ones are picked. Imported listings show as
// "Unclaimed" until the owner claims them. Map data © OpenStreetMap
// contributors (ODbL) — the listing page shows the required attribution.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

/** Build Overpass statements that match a name pattern on business-like features. */
const named = (pattern) =>
  ["office", "craft", "shop"].map(
    (key) => `nwr["${key}"]["name"~"${pattern}",i](area.region);`,
  );

// OpenStreetMap tags for each directory category, plus words that make a
// match more relevant (used for ranking only).
export const CATEGORY_QUERIES = {
  agents: {
    statements: ['nwr["office"="estate_agent"](area.region);'],
    prefer: /realt|real estate|properties|homes/i,
  },
  lenders: {
    statements: [
      'nwr["office"~"^(financial|mortgage|financial_advisor)$"]["name"~"mortgage|home loan|lending",i](area.region);',
      'nwr["amenity"="bank"]["name"~"mortgage",i](area.region);',
    ],
    prefer: /mortgage|home loan/i,
  },
  "title-companies": {
    statements: named("title (company|agency|insurance|group|services)|settlement"),
    prefer: /title/i,
  },
  "home-inspectors": {
    statements: named("home inspection|property inspection|building inspection|inspection services"),
    prefer: /home inspection/i,
  },
  photographers: {
    statements: ['nwr["craft"="photographer"](area.region);'],
    prefer: /real estate|property|aerial|media|home/i,
  },
  stagers: {
    statements: named("staging"),
    prefer: /home staging|staging/i,
  },
  contractors: {
    statements: [
      'nwr["office"="construction_company"](area.region);',
      'nwr["craft"~"^(builder|roofer)$"](area.region);',
    ],
    prefer: /construction|contracting|builders|remodel|renovation|home improvement/i,
  },
  "moving-companies": {
    statements: [
      'nwr["office"="moving_company"](area.region);',
      ...named("moving|movers|relocation"),
    ],
    prefer: /moving|movers/i,
  },
  "insurance-agents": {
    statements: ['nwr["office"="insurance"](area.region);'],
    prefer: /insurance|agency/i,
  },
  cleaning: {
    statements: [
      'nwr["craft"="cleaning"](area.region);',
      ...named("cleaning service|cleaning co|maid|janitorial|housekeeping"),
    ],
    prefer: /cleaning|maid/i,
  },
};

const CATEGORY_LABELS = {
  agents: ["Real Estate Agents", "real estate agency"],
  lenders: ["Recommended Lenders", "mortgage lender"],
  "title-companies": ["Title Companies", "title company"],
  "home-inspectors": ["Home Inspectors", "home inspection company"],
  photographers: ["Real Estate Photographers", "photographer"],
  stagers: ["Home Stagers", "home staging company"],
  contractors: ["Contractors", "contractor"],
  "moving-companies": ["Moving Companies", "moving company"],
  "insurance-agents": ["Insurance Agents", "insurance agency"],
  cleaning: ["Cleaning Services", "cleaning service"],
};

export function buildQuery(category, state) {
  return `[out:json][timeout:180];
area["ISO3166-2"="US-${state}"]["admin_level"="4"]->.region;
(
  ${CATEGORY_QUERIES[category].statements.join("\n  ")}
);
out center tags;`;
}

export function formatPhone(raw) {
  if (!raw) return "";
  const first = raw.split(";")[0].trim();
  let digits = first.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return first;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function normalizeUrl(raw) {
  if (!raw) return "";
  const first = raw.split(";")[0].trim();
  if (!first) return "";
  return /^https?:\/\//i.test(first) ? first : `https://${first}`;
}

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const isClosed = (tags) =>
  Object.keys(tags).some((k) =>
    /^(disused|abandoned|was|demolished|removed):/.test(k),
  ) ||
  Boolean(tags.end_date) ||
  tags.opening_hours === "closed";

/** Turn an Overpass element into a vendor row, or null if it's not usable. */
export function toVendor(element, category, state) {
  const t = element.tags ?? {};
  const name = (t.name ?? "").trim();
  const city = (t["addr:city"] ?? "").trim();
  const phone = formatPhone(t.phone ?? t["contact:phone"]);
  const website = normalizeUrl(t.website ?? t["contact:website"] ?? t.url);
  if (!name || !city || (!phone && !website) || isClosed(t)) return null;

  const street = [t["addr:housenumber"], t["addr:street"]]
    .filter(Boolean)
    .join(" ");
  const postcode = t["addr:postcode"] ? ` ${t["addr:postcode"]}` : "";
  const address = street
    ? `${street}, ${city}, ${state}${postcode}`
    : `${city}, ${state}${postcode}`;

  const [label, singular] = CATEGORY_LABELS[category];
  return {
    id: `${slug(name)}-osm-${element.type[0]}${element.id}`,
    name,
    category,
    city,
    state,
    phone,
    email: (t.email ?? t["contact:email"] ?? "").split(";")[0].trim(),
    website,
    address,
    tags: [label, city],
    bio: `${name} is a ${singular} in ${city}, ${state}.`,
    long_bio: `${name} is a ${singular} located in ${city}, ${state}. This listing was created from public OpenStreetMap data and has not been claimed by the business yet.`,
    facebook: normalizeUrl(t["contact:facebook"]),
    instagram: normalizeUrl(t["contact:instagram"]),
    linkedin: normalizeUrl(t["contact:linkedin"]),
    source_ref: `${element.type}/${element.id}`,
    _score:
      (phone ? 3 : 0) +
      (website ? 3 : 0) +
      (street ? 2 : 0) +
      (postcode ? 1 : 0) +
      (t.email || t["contact:email"] ? 1 : 0) +
      (t.opening_hours ? 1 : 0) +
      (CATEGORY_QUERIES[category].prefer.test(name) ? 2 : 0),
  };
}

/** Pick the `count` most complete businesses, preferring different cities. */
export function pickBest(elements, category, state, count, takenNames = new Set()) {
  const seen = new Set();
  const candidates = [];
  for (const el of elements) {
    const v = toVendor(el, category, state);
    if (!v) continue;
    const key = v.name.toLowerCase();
    if (seen.has(key) || takenNames.has(key)) continue;
    seen.add(key);
    candidates.push(v);
  }
  candidates.sort((a, b) => b._score - a._score || a.name.localeCompare(b.name));

  const picked = [];
  for (const v of candidates) {
    if (picked.length >= count) break;
    if (picked.some((p) => p.city === v.city)) continue;
    picked.push(v);
  }
  // Not enough distinct cities: fill up with the next best.
  for (const v of candidates) {
    if (picked.length >= count) break;
    if (!picked.includes(v)) picked.push(v);
  }
  return picked;
}

const sqlText = (s) => `'${String(s ?? "").replace(/'/g, "''")}'`;
const sqlArray = (arr) =>
  arr.length ? `ARRAY[${arr.map(sqlText).join(", ")}]` : "'{}'::text[]";

export function toSql(vendors, state) {
  const columns =
    "id, name, category, city, state, phone, email, website, address, tags, paid, verified, bio, long_bio, services_offered, gmb_link, facebook, instagram, linkedin, source, source_ref";
  const rows = vendors.map(
    (v) =>
      `  (${[
        sqlText(v.id),
        sqlText(v.name),
        sqlText(v.category),
        sqlText(v.city),
        sqlText(v.state),
        sqlText(v.phone),
        sqlText(v.email),
        sqlText(v.website),
        sqlText(v.address),
        sqlArray(v.tags),
        "FALSE",
        "FALSE",
        sqlText(v.bio),
        sqlText(v.long_bio),
        "'{}'::text[]",
        "''",
        sqlText(v.facebook),
        sqlText(v.instagram),
        sqlText(v.linkedin),
        "'osm'",
        sqlText(v.source_ref),
      ].join(", ")})`,
  );
  return `-- ${vendors.length} ${state} businesses imported from OpenStreetMap on ${new Date().toISOString().slice(0, 10)}.
-- Data © OpenStreetMap contributors, available under the ODbL.
-- Review the list, then run this in the Supabase SQL Editor. Re-running is safe.
INSERT INTO vendors (${columns}) VALUES
${rows.join(",\n")}
ON CONFLICT (id) DO NOTHING;
`;
}

async function fetchOverpass(query) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "virtexa-connect-directory-import",
      },
      body: new URLSearchParams({ data: query }),
    });
    if (res.ok) return res.json();
    if (attempt === 3 || ![429, 502, 503, 504].includes(res.status)) {
      throw new Error(`Overpass returned ${res.status}: ${await res.text()}`);
    }
    await new Promise((r) => setTimeout(r, attempt * 15000));
  }
}

function parseArgs(argv) {
  const args = { state: "VA", perCategory: 2, input: "", out: "", saveRaw: "" };
  for (let i = 0; i < argv.length; i++) {
    const next = () => argv[++i];
    if (argv[i] === "--state") args.state = next().toUpperCase();
    else if (argv[i] === "--per-category") args.perCategory = Number(next());
    else if (argv[i] === "--input") args.input = next();
    else if (argv[i] === "--out") args.out = next();
    else if (argv[i] === "--save-raw") args.saveRaw = next();
  }
  args.out ||= `supabase/seed/osm-${args.state.toLowerCase()}.sql`;
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const raw = args.input ? JSON.parse(readFileSync(args.input, "utf8")) : {};
  const picked = [];
  const takenNames = new Set();

  for (const category of Object.keys(CATEGORY_QUERIES)) {
    if (!raw[category]) {
      process.stdout.write(`Querying OpenStreetMap for ${category}… `);
      raw[category] = await fetchOverpass(buildQuery(category, args.state));
      console.log(`${raw[category].elements.length} found`);
    }
    const best = pickBest(
      raw[category].elements,
      category,
      args.state,
      args.perCategory,
      takenNames,
    );
    for (const v of best) takenNames.add(v.name.toLowerCase());
    if (best.length < args.perCategory) {
      console.warn(`  ! only ${best.length} usable ${category} listing(s)`);
    }
    picked.push(...best);
  }

  if (args.saveRaw) writeFileSync(args.saveRaw, JSON.stringify(raw));
  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, toSql(picked, args.state));

  console.log(`\nPicked ${picked.length} businesses:`);
  for (const v of picked) {
    console.log(
      `  ${v.category.padEnd(17)} ${v.name} — ${v.city} · ${v.phone || "no phone"} · ${v.website || "no website"}`,
    );
  }
  console.log(`\nSQL written to ${args.out}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
