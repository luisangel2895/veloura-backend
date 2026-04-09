import { describe, it, expect } from "vitest";

// Import the ACTUAL data from the seed script (not a copy-paste of it).
// The previous version of this file inlined the CATEGORIES and PRODUCTS
// arrays, which meant tests passed even when seed.ts was broken. Now we
// import the named exports so any change to seed.ts is checked.
import { CATEGORIES, PRODUCTS, type SeedProduct } from "../seed";

const VALID_SIZES = ["XS", "S", "M", "L", "XL"];
const VALID_CATEGORY_HANDLES = CATEGORIES.map((c) => c.handle);

// ── Category Tests ──────────────────────────────────────────────────

describe("seed data — categories", () => {
  it("should have exactly 4 categories", () => {
    expect(CATEGORIES).toHaveLength(4);
  });

  it("all categories have required fields", () => {
    for (const cat of CATEGORIES) {
      expect(cat.name).toBeTruthy();
      expect(typeof cat.name).toBe("string");
      expect(cat.handle).toBeTruthy();
      expect(typeof cat.handle).toBe("string");
      expect(cat.description).toBeTruthy();
      expect(cat.is_active).toBe(true);
    }
  });

  it("all category handles are unique", () => {
    const handles = CATEGORIES.map((c) => c.handle);
    expect(new Set(handles).size).toBe(handles.length);
  });

  it("category handles match expected values", () => {
    const handles = CATEGORIES.map((c) => c.handle).sort();
    expect(handles).toEqual(["balconette", "bodysuits", "bridal", "lounge"]);
  });
});

// ── Product Tests ───────────────────────────────────────────────────

describe("seed data — products", () => {
  it("should have exactly 12 products", () => {
    expect(PRODUCTS).toHaveLength(12);
  });

  it("all products have required fields", () => {
    for (const product of PRODUCTS) {
      expect(product.title).toBeTruthy();
      expect(product.handle).toBeTruthy();
      expect(product.tagline).toBeTruthy();
      expect(product.categoryHandle).toBeTruthy();
      expect(typeof product.priceCents).toBe("number");
      expect(Array.isArray(product.sizes)).toBe(true);
      expect(Array.isArray(product.tags)).toBe(true);
      expect(product.description).toBeTruthy();
      expect(Array.isArray(product.details)).toBe(true);
      expect(Array.isArray(product.images)).toBe(true);
      expect(Array.isArray(product.palette)).toBe(true);
      expect(typeof product.featured).toBe("boolean");
    }
  });

  it("all product handles are unique", () => {
    const handles = PRODUCTS.map((p) => p.handle);
    expect(new Set(handles).size).toBe(handles.length);
  });

  it("all product handles are URL-safe (lowercase, hyphens only)", () => {
    for (const product of PRODUCTS) {
      expect(product.handle).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("all product prices are positive integers (cents)", () => {
    for (const product of PRODUCTS) {
      expect(product.priceCents).toBeGreaterThan(0);
      expect(Number.isInteger(product.priceCents)).toBe(true);
    }
  });

  it("all products have at least 1 image URL", () => {
    for (const product of PRODUCTS) {
      expect(product.images.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("all product images are valid HTTPS URLs", () => {
    for (const product of PRODUCTS) {
      for (const url of product.images) {
        expect(url).toMatch(/^https:\/\//);
      }
    }
  });

  it("all picsum.photos URLs include explicit dimensions (width/height)", () => {
    // Regression test for the bug where picsum URLs without dimensions
    // returned 404 in production. The expected pattern is `/<w>/<h>`
    // appended to the URL.
    for (const product of PRODUCTS) {
      for (const url of product.images) {
        if (url.includes("picsum.photos")) {
          expect(url).toMatch(/picsum\.photos\/seed\/[^/]+\/\d+\/\d+/);
        }
      }
    }
  });

  it("all product palettes have exactly 2 colors in hex format", () => {
    for (const product of PRODUCTS) {
      expect(product.palette).toHaveLength(2);
      for (const color of product.palette) {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });

  it("all product sizes are valid (XS, S, M, L, XL)", () => {
    for (const product of PRODUCTS) {
      for (const size of product.sizes) {
        expect(VALID_SIZES).toContain(size);
      }
    }
  });

  it("all products reference a valid category handle", () => {
    for (const product of PRODUCTS) {
      expect(VALID_CATEGORY_HANDLES).toContain(product.categoryHandle);
    }
  });

  it("all tags are non-empty strings", () => {
    for (const product of PRODUCTS) {
      for (const tag of product.tags) {
        expect(typeof tag).toBe("string");
        expect(tag.length).toBeGreaterThan(0);
      }
    }
  });

  it("at least one product is featured", () => {
    const featured = PRODUCTS.filter((p) => p.featured);
    expect(featured.length).toBeGreaterThanOrEqual(1);
  });

  it("description is meaningfully longer than tagline", () => {
    // The previous seed had description === tagline for every product.
    // Descriptions should be at least 2x as long as the tagline so the
    // storefront actually has copy to render.
    for (const product of PRODUCTS) {
      expect(product.description.length).toBeGreaterThan(product.tagline.length * 2);
    }
  });

  it("all product details are non-empty string arrays", () => {
    for (const product of PRODUCTS) {
      expect(product.details.length).toBeGreaterThanOrEqual(1);
      for (const detail of product.details) {
        expect(typeof detail).toBe("string");
        expect(detail.length).toBeGreaterThan(0);
      }
    }
  });

  it("products are distributed across all categories", () => {
    const categoriesUsed = new Set(PRODUCTS.map((p) => p.categoryHandle));
    for (const handle of VALID_CATEGORY_HANDLES) {
      expect(categoriesUsed.has(handle)).toBe(true);
    }
  });

  it("product handle and SKU prefix are URL-safe and consistent", () => {
    for (const product of PRODUCTS) {
      // The seed builds variant SKUs as `${handle}-${size.toLowerCase()}`,
      // so the handle must already be SKU-safe.
      expect(product.handle).not.toMatch(/[A-Z]/);
      expect(product.handle).not.toMatch(/\s/);
    }
  });

  it("type SeedProduct is satisfied (compile-time check)", () => {
    // Just an assertion that the imported type aligns with the imported data.
    const sample: SeedProduct = PRODUCTS[0];
    expect(sample).toBeDefined();
  });
});
