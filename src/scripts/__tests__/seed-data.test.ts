import { describe, it, expect } from "vitest";

// ── Seed data replicated from seed.ts for validation ────────────────

const CATEGORIES = [
  {
    name: "Balconette",
    description:
      "Structured cups with delicate presence. Refined aesthetics and all-day comfort.",
    handle: "balconette",
    is_active: true,
    is_internal: false,
    rank: 0,
  },
  {
    name: "Bodysuits",
    description:
      "One-piece silhouettes for layered refinement. Precision tailoring with editorial appeal.",
    handle: "bodysuits",
    is_active: true,
    is_internal: false,
    rank: 1,
  },
  {
    name: "Bridal",
    description:
      "Luminous pieces for rituals and celebrations. Soft tones with ceremony aesthetics.",
    handle: "bridal",
    is_active: true,
    is_internal: false,
    rank: 2,
  },
  {
    name: "Lounge",
    description:
      "Serene comfort with editorial sensibility. Sophisticated textures for quiet indulgence.",
    handle: "lounge",
    is_active: true,
    is_internal: false,
    rank: 3,
  },
];

interface SeedProduct {
  title: string;
  handle: string;
  tagline: string;
  categoryHandle: string;
  priceCents: number;
  sizes: string[];
  tags: string[];
  description: string;
  details: string[];
  images: string[];
  palette: [string, string];
  featured: boolean;
}

const PRODUCTS: SeedProduct[] = [
  {
    title: "Noir Essence Balconette",
    handle: "noir-essence-balconette",
    tagline: "Architectural lift in satin and mesh.",
    categoryHandle: "balconette",
    priceCents: 11200,
    sizes: ["XS", "S", "M", "L"],
    tags: ["signature", "mesh", "evening"],
    description: "Architectural lift in satin and mesh.",
    details: [
      "Underwire support with soft cup reinforcement",
      "Adjustable straps and brushed hardware in soft gold",
      "Lightweight power mesh back for shape retention",
    ],
    images: [
      "https://picsum.photos/seed/noir-essence-balconette-1",
      "https://picsum.photos/seed/noir-essence-balconette-2",
      "https://picsum.photos/seed/noir-essence-balconette-3",
    ],
    palette: ["#1b1a1e", "#7e6843"],
    featured: true,
  },
  {
    title: "Velvet Trace Balconette",
    handle: "velvet-trace-balconette",
    tagline: "A clean demi profile with velvet-soft trim.",
    categoryHandle: "balconette",
    priceCents: 11800,
    sizes: ["S", "M", "L", "XL"],
    tags: ["best-seller", "velvet-trim", "daily-luxury"],
    description: "A clean demi profile with velvet-soft trim.",
    details: [
      "Matte stretch satin with velvet binding",
      "Wide side wings for a smoother frame",
      "Engineered to layer under plunging silhouettes",
    ],
    images: [
      "https://picsum.photos/seed/velvet-trace-balconette-1",
      "https://picsum.photos/seed/velvet-trace-balconette-2",
      "https://picsum.photos/seed/velvet-trace-balconette-3",
    ],
    palette: ["#2b2025", "#9b7d51"],
    featured: true,
  },
  {
    title: "Lune Ivory Balconette",
    handle: "lune-ivory-balconette",
    tagline: "Soft ivory for understated ceremony dressing.",
    categoryHandle: "bridal",
    priceCents: 12400,
    sizes: ["XS", "S", "M", "L"],
    tags: ["bridal", "ivory", "ceremony"],
    description: "Soft ivory for understated ceremony dressing.",
    details: [
      "Low-profile cups that sit cleanly under satin gowns",
      "Breathable sheer side panels for comfort",
      "Discreet finish lines for a nearly invisible fit",
    ],
    images: [
      "https://picsum.photos/seed/lune-ivory-balconette-1",
      "https://picsum.photos/seed/lune-ivory-balconette-2",
      "https://picsum.photos/seed/lune-ivory-balconette-3",
    ],
    palette: ["#f5ede2", "#c0a26b"],
    featured: true,
  },
  {
    title: "Champagne Glow Bodysuit",
    handle: "champagne-glow-bodysuit",
    tagline: "Fluid shimmer and sculpted vertical seams.",
    categoryHandle: "bodysuits",
    priceCents: 16800,
    sizes: ["XS", "S", "M", "L"],
    tags: ["bridal", "bodysuit", "shimmer"],
    description: "Fluid shimmer and sculpted vertical seams.",
    details: [
      "Snap closure with smooth gusset finish",
      "Moderate compression through the waist",
      "Works as an underpinning or styled outer layer",
    ],
    images: [
      "https://picsum.photos/seed/champagne-glow-bodysuit-1",
      "https://picsum.photos/seed/champagne-glow-bodysuit-2",
      "https://picsum.photos/seed/champagne-glow-bodysuit-3",
    ],
    palette: ["#dfd3c1", "#a98554"],
    featured: true,
  },
  {
    title: "Obsidian Line Bodysuit",
    handle: "obsidian-line-bodysuit",
    tagline: "Graphic transparency with a tailored base.",
    categoryHandle: "bodysuits",
    priceCents: 17200,
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["editorial", "sheer", "night-out"],
    description: "Graphic transparency with a tailored base.",
    details: [
      "Dual-layer front for support without bulk",
      "Invisible elastic edges keep the line minimal",
      "Ideal under blazers, shirting and open knits",
    ],
    images: [
      "https://picsum.photos/seed/obsidian-line-bodysuit-1",
      "https://picsum.photos/seed/obsidian-line-bodysuit-2",
      "https://picsum.photos/seed/obsidian-line-bodysuit-3",
    ],
    palette: ["#111214", "#8c7042"],
    featured: false,
  },
  {
    title: "Silk Vow Slip Set",
    handle: "silk-vow-slip-set",
    tagline: "A bridal-ready pairing for slow mornings.",
    categoryHandle: "bridal",
    priceCents: 19600,
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["bridal", "giftable", "set"],
    description: "A bridal-ready pairing for slow mornings.",
    details: [
      "Includes matching brief in the same silk-touch finish",
      "Bias-inspired shape that skims instead of clings",
      "Packed with a soft storage pouch for gifting",
    ],
    images: [
      "https://picsum.photos/seed/silk-vow-slip-set-1",
      "https://picsum.photos/seed/silk-vow-slip-set-2",
      "https://picsum.photos/seed/silk-vow-slip-set-3",
    ],
    palette: ["#f2e8d8", "#b99260"],
    featured: false,
  },
  {
    title: "Midnight Whisper Robe",
    handle: "midnight-whisper-robe",
    tagline: "Longline lounge with tonal sheen.",
    categoryHandle: "lounge",
    priceCents: 15400,
    sizes: ["S", "M", "L", "XL"],
    tags: ["robe", "lounge", "soft-sheen"],
    description: "Longline lounge with tonal sheen.",
    details: [
      "Detachable belt with interior tie for secure wear",
      "Wide sleeves cut for easy layering",
      "Soft drape with a cool-touch finish",
    ],
    images: [
      "https://picsum.photos/seed/midnight-whisper-robe-1",
      "https://picsum.photos/seed/midnight-whisper-robe-2",
      "https://picsum.photos/seed/midnight-whisper-robe-3",
    ],
    palette: ["#1d2028", "#867150"],
    featured: true,
  },
  {
    title: "Cashmere Hush Bralette",
    handle: "cashmere-hush-bralette",
    tagline: "Relaxed support for quiet indulgence.",
    categoryHandle: "lounge",
    priceCents: 8600,
    sizes: ["XS", "S", "M", "L"],
    tags: ["bralette", "soft-touch", "travel"],
    description: "Relaxed support for quiet indulgence.",
    details: [
      "Wire-free construction with removable pads",
      "Wide underband for comfort through long wear",
      "Pairs with lounge shorts or robe layers",
    ],
    images: [
      "https://picsum.photos/seed/cashmere-hush-bralette-1",
      "https://picsum.photos/seed/cashmere-hush-bralette-2",
      "https://picsum.photos/seed/cashmere-hush-bralette-3",
    ],
    palette: ["#8f8076", "#c0a06d"],
    featured: false,
  },
  {
    title: "Moon Satin Tap Short",
    handle: "moon-satin-tap-short",
    tagline: "Lightweight lounge built for layering.",
    categoryHandle: "lounge",
    priceCents: 6400,
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["short", "set-ready", "satin"],
    description: "Lightweight lounge built for layering.",
    details: [
      "Bias-cut inspired leg opening for movement",
      "Smooth waistband with hidden elastic",
      "Pairs naturally with lounge bras and robes",
    ],
    images: [
      "https://picsum.photos/seed/moon-satin-tap-short-1",
      "https://picsum.photos/seed/moon-satin-tap-short-2",
      "https://picsum.photos/seed/moon-satin-tap-short-3",
    ],
    palette: ["#d7c7bb", "#9f7c4b"],
    featured: false,
  },
  {
    title: "Gilded Veil Teddy",
    handle: "gilded-veil-teddy",
    tagline: "A sheer bridal one-piece with luminous trim.",
    categoryHandle: "bridal",
    priceCents: 14800,
    sizes: ["XS", "S", "M", "L"],
    tags: ["bridal", "teddy", "giftable"],
    description: "A sheer bridal one-piece with luminous trim.",
    details: [
      "Sheer body with modestly lined bust",
      "Soft leg curve with no harsh elastic marks",
      "Designed to sit smoothly under robes and slips",
    ],
    images: [
      "https://picsum.photos/seed/gilded-veil-teddy-1",
      "https://picsum.photos/seed/gilded-veil-teddy-2",
      "https://picsum.photos/seed/gilded-veil-teddy-3",
    ],
    palette: ["#f7f0e4", "#b08b57"],
    featured: false,
  },
  {
    title: "Atelier Shadow Corset",
    handle: "atelier-shadow-corset",
    tagline: "Modern contouring with softened structure.",
    categoryHandle: "bodysuits",
    priceCents: 18200,
    sizes: ["XS", "S", "M", "L"],
    tags: ["corset", "structured", "occasion"],
    description: "Modern contouring with softened structure.",
    details: [
      "Flexible boning for shape without stiffness",
      "Front neckline cut to layer under jackets",
      "Back paneling balances compression and comfort",
    ],
    images: [
      "https://picsum.photos/seed/atelier-shadow-corset-1",
      "https://picsum.photos/seed/atelier-shadow-corset-2",
      "https://picsum.photos/seed/atelier-shadow-corset-3",
    ],
    palette: ["#16161a", "#6d5937"],
    featured: true,
  },
  {
    title: "Soft Flame Triangle Set",
    handle: "soft-flame-triangle-set",
    tagline: "Minimal coverage in a warm bronze wash.",
    categoryHandle: "balconette",
    priceCents: 9800,
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["set", "minimal", "bronze"],
    description: "Minimal coverage in a warm bronze wash.",
    details: [
      "Triangle cup with refined elastic finish",
      "Matching brief included in the set price",
      "Light support suited to all-day wear",
    ],
    images: [
      "https://picsum.photos/seed/soft-flame-triangle-set-1",
      "https://picsum.photos/seed/soft-flame-triangle-set-2",
      "https://picsum.photos/seed/soft-flame-triangle-set-3",
    ],
    palette: ["#5f4a3d", "#b48a56"],
    featured: false,
  },
];

const VALID_SIZES = ["XS", "S", "M", "L", "XL"];
const VALID_CATEGORY_HANDLES = CATEGORIES.map((c) => c.handle);

// ── Category Tests ──────────────────────────────────────────────────

describe("seed data - categories", () => {
  it("should have exactly 4 categories", () => {
    expect(CATEGORIES).toHaveLength(4);
  });

  it("all categories have required fields", () => {
    for (const cat of CATEGORIES) {
      expect(cat.name).toBeDefined();
      expect(typeof cat.name).toBe("string");
      expect(cat.name.length).toBeGreaterThan(0);

      expect(cat.handle).toBeDefined();
      expect(typeof cat.handle).toBe("string");
      expect(cat.handle.length).toBeGreaterThan(0);

      expect(cat.description).toBeDefined();
      expect(typeof cat.description).toBe("string");
      expect(cat.description.length).toBeGreaterThan(0);

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

describe("seed data - products", () => {
  it("should have exactly 12 products", () => {
    expect(PRODUCTS).toHaveLength(12);
  });

  it("all products have required fields", () => {
    for (const product of PRODUCTS) {
      expect(product.title).toBeDefined();
      expect(typeof product.title).toBe("string");
      expect(product.title.length).toBeGreaterThan(0);

      expect(product.handle).toBeDefined();
      expect(typeof product.handle).toBe("string");

      expect(product.tagline).toBeDefined();
      expect(typeof product.tagline).toBe("string");

      expect(product.categoryHandle).toBeDefined();
      expect(typeof product.categoryHandle).toBe("string");

      expect(product.priceCents).toBeDefined();
      expect(typeof product.priceCents).toBe("number");

      expect(product.sizes).toBeDefined();
      expect(Array.isArray(product.sizes)).toBe(true);

      expect(product.tags).toBeDefined();
      expect(Array.isArray(product.tags)).toBe(true);

      expect(product.description).toBeDefined();
      expect(typeof product.description).toBe("string");

      expect(product.details).toBeDefined();
      expect(Array.isArray(product.details)).toBe(true);

      expect(product.images).toBeDefined();
      expect(Array.isArray(product.images)).toBe(true);

      expect(product.palette).toBeDefined();
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

  it("at least 1 product is featured", () => {
    const featuredCount = PRODUCTS.filter((p) => p.featured).length;
    expect(featuredCount).toBeGreaterThanOrEqual(1);
  });

  it("featured products count matches expected value", () => {
    const featured = PRODUCTS.filter((p) => p.featured);
    expect(featured).toHaveLength(6);
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
});
