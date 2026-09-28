import { describe, it, expect } from "vitest";
import { formatPhone, normalizeUrl, pickBest, toSql, toVendor } from "../../scripts/import-osm.mjs";

const el = (id: number, tags: Record<string, string>) => ({
  type: "node",
  id,
  tags,
});

describe("OpenStreetMap import", () => {
  it("formats US phone numbers and website URLs", () => {
    expect(formatPhone("+1 540-555-0142")).toBe("(540) 555-0142");
    expect(formatPhone("804.555.0199;804-555-0100")).toBe("(804) 555-0199");
    expect(normalizeUrl("example.com")).toBe("https://example.com");
    expect(normalizeUrl("http://example.com/a")).toBe("http://example.com/a");
  });

  it("skips businesses without a name, city, or any way to contact them", () => {
    expect(toVendor(el(1, { "addr:city": "Roanoke", phone: "5405550142" }), "agents", "VA")).toBeNull();
    expect(toVendor(el(2, { name: "A", phone: "5405550142" }), "agents", "VA")).toBeNull();
    expect(toVendor(el(3, { name: "A", "addr:city": "Roanoke" }), "agents", "VA")).toBeNull();
    expect(
      toVendor(el(4, { name: "A", "addr:city": "Roanoke", website: "a.com", "disused:office": "estate_agent" }), "agents", "VA"),
    ).toBeNull();
  });

  it("picks the most complete listings, spread across cities, without repeats", () => {
    const elements = [
      el(1, { name: "Sparse Realty", "addr:city": "Richmond", website: "sparse.com" }),
      el(2, { name: "Full Realty", "addr:city": "Richmond", website: "full.com", phone: "8045550100", "addr:housenumber": "1", "addr:street": "Main St" }),
      el(3, { name: "Other City Homes", "addr:city": "Norfolk", website: "och.com", phone: "7575550100" }),
      el(4, { name: "Full Realty", "addr:city": "Norfolk", website: "dup.com", phone: "7575550199" }),
    ];
    const picked = pickBest(elements, "agents", "VA", 2);
    expect(picked.map((v: { name: string }) => v.name)).toEqual(["Full Realty", "Other City Homes"]);
    expect(picked[0]).toMatchObject({
      id: "full-realty-osm-n2",
      address: "1 Main St, Richmond, VA",
      phone: "(804) 555-0100",
      website: "https://full.com",
      source_ref: "node/2",
    });
  });

  it("escapes quotes in generated SQL", () => {
    const [v] = pickBest([el(9, { name: "O'Brien Title", "addr:city": "Fairfax", phone: "7035550100" })], "title-companies", "VA", 1);
    expect(toSql([v], "VA")).toContain("'O''Brien Title'");
  });
});
