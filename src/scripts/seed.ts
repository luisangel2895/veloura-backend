import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  createInventoryLevelsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

// ── Veloura Product Data ─────────────────────────────────────────
//
// Image URLs use picsum.photos with explicit dimensions because picsum
// returns 404 if you don't specify a size in the URL path.

export const CATEGORIES = [
  {
    name: "Balconette",
    description: "Structured cups with delicate presence. Refined aesthetics and all-day comfort.",
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

export interface SeedProduct {
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

// All picsum URLs include `/600/600` because picsum.photos returns 404
// without explicit dimensions. Descriptions are intentionally longer than
// the tagline (SEO + storefront copy).
export const PRODUCTS: SeedProduct[] = [
  {
    title: "Noir Essence Balconette",
    handle: "noir-essence-balconette",
    tagline: "Architectural lift in satin and mesh.",
    categoryHandle: "balconette",
    priceCents: 11200,
    sizes: ["XS", "S", "M", "L"],
    tags: ["signature", "mesh", "evening"],
    description:
      "A signature balconette engineered for evening wear. The matte satin cups deliver architectural lift while a power mesh back panel keeps the silhouette steady through long hours. Cut for a cleaner line under tailored shirting and slip dresses.",
    details: [
      "Underwire support with soft cup reinforcement",
      "Adjustable straps and brushed hardware in soft gold",
      "Lightweight power mesh back for shape retention",
    ],
    images: [
      "https://picsum.photos/seed/noir-essence-balconette-1/600/600",
      "https://picsum.photos/seed/noir-essence-balconette-2/600/600",
      "https://picsum.photos/seed/noir-essence-balconette-3/600/600",
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
    description:
      "Veloura's bestselling demi cut, now with a velvet binding along the neckline that softens the edge against skin. Wide side wings smooth the silhouette and the engineered satin keeps its shape from morning to evening. Designed to layer cleanly under plunging knits.",
    details: [
      "Matte stretch satin with velvet binding",
      "Wide side wings for a smoother frame",
      "Engineered to layer under plunging silhouettes",
    ],
    images: [
      "https://picsum.photos/seed/velvet-trace-balconette-1/600/600",
      "https://picsum.photos/seed/velvet-trace-balconette-2/600/600",
      "https://picsum.photos/seed/velvet-trace-balconette-3/600/600",
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
    description:
      "An understated bridal balconette in soft ivory, designed for the modern ceremony. Low-profile cups sit cleanly under the most delicate satin gowns and the breathable sheer side panels keep you comfortable through the longest reception. Discreet finish lines make this nearly invisible under your dress.",
    details: [
      "Low-profile cups that sit cleanly under satin gowns",
      "Breathable sheer side panels for comfort",
      "Discreet finish lines for a nearly invisible fit",
    ],
    images: [
      "https://picsum.photos/seed/lune-ivory-balconette-1/600/600",
      "https://picsum.photos/seed/lune-ivory-balconette-2/600/600",
      "https://picsum.photos/seed/lune-ivory-balconette-3/600/600",
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
    description:
      "A fluid champagne bodysuit with vertical seams that sculpt the waist while keeping movement effortless. Snap closure with a smooth gusset finish and moderate compression through the midsection. Equally at home as bridal underpinning or styled as an outer layer with high-waisted tailoring.",
    details: [
      "Snap closure with smooth gusset finish",
      "Moderate compression through the waist",
      "Works as an underpinning or styled outer layer",
    ],
    images: [
      "https://picsum.photos/seed/champagne-glow-bodysuit-1/600/600",
      "https://picsum.photos/seed/champagne-glow-bodysuit-2/600/600",
      "https://picsum.photos/seed/champagne-glow-bodysuit-3/600/600",
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
    description:
      "A graphic bodysuit that pairs sheer paneling with a dual-layer support front. Invisible elastic edges keep the line minimal — no bumps under fitted blazers, knit twinsets, or open shirting. The cut sits flat against the décolletage and the tailored base eliminates riding up.",
    details: [
      "Dual-layer front for support without bulk",
      "Invisible elastic edges keep the line minimal",
      "Ideal under blazers, shirting and open knits",
    ],
    images: [
      "https://picsum.photos/seed/obsidian-line-bodysuit-1/600/600",
      "https://picsum.photos/seed/obsidian-line-bodysuit-2/600/600",
      "https://picsum.photos/seed/obsidian-line-bodysuit-3/600/600",
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
    description:
      "A bridal slip and matching brief in a silk-touch finish, designed for slow getting-ready mornings and trousseau gifting. The bias-inspired cut skims rather than clings, and the pieces arrive in a soft storage pouch ready to gift. A quiet luxury staple for the days that matter.",
    details: [
      "Includes matching brief in the same silk-touch finish",
      "Bias-inspired shape that skims instead of clings",
      "Packed with a soft storage pouch for gifting",
    ],
    images: [
      "https://picsum.photos/seed/silk-vow-slip-set-1/600/600",
      "https://picsum.photos/seed/silk-vow-slip-set-2/600/600",
      "https://picsum.photos/seed/silk-vow-slip-set-3/600/600",
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
    description:
      "A longline lounge robe with a cool-touch finish and a discreet tonal sheen. The detachable belt has an interior tie for secure wear, and the wide sleeves drape easily over loungewear sets. Layers naturally over the Cashmere Hush bralette and Moon Satin tap shorts.",
    details: [
      "Detachable belt with interior tie for secure wear",
      "Wide sleeves cut for easy layering",
      "Soft drape with a cool-touch finish",
    ],
    images: [
      "https://picsum.photos/seed/midnight-whisper-robe-1/600/600",
      "https://picsum.photos/seed/midnight-whisper-robe-2/600/600",
      "https://picsum.photos/seed/midnight-whisper-robe-3/600/600",
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
    description:
      "Wire-free comfort with the luxe hand-feel of a cashmere blend. Removable cup pads, a wide underband, and seamless sides make this the bralette you forget you're wearing. Pairs with the Moon Satin tap short and the Midnight Whisper robe for a complete loungewear edit.",
    details: [
      "Wire-free construction with removable pads",
      "Wide underband for comfort through long wear",
      "Pairs with lounge shorts or robe layers",
    ],
    images: [
      "https://picsum.photos/seed/cashmere-hush-bralette-1/600/600",
      "https://picsum.photos/seed/cashmere-hush-bralette-2/600/600",
      "https://picsum.photos/seed/cashmere-hush-bralette-3/600/600",
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
    description:
      "Bias-cut inspired tap shorts in a lightweight satin that drapes instead of clings. The hidden elastic waistband sits flat under longer hems and the relaxed leg opening moves with you. Layers naturally with the rest of Veloura's lounge edit for a complete set.",
    details: [
      "Bias-cut inspired leg opening for movement",
      "Smooth waistband with hidden elastic",
      "Pairs naturally with lounge bras and robes",
    ],
    images: [
      "https://picsum.photos/seed/moon-satin-tap-short-1/600/600",
      "https://picsum.photos/seed/moon-satin-tap-short-2/600/600",
      "https://picsum.photos/seed/moon-satin-tap-short-3/600/600",
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
    description:
      "A sheer one-piece teddy with a modestly lined bust and luminous gilded trim along the neckline. The soft leg curve avoids harsh elastic marks and the fabric sits smoothly under bridal slips and robes. A giftable piece that doubles as honeymoon staple.",
    details: [
      "Sheer body with modestly lined bust",
      "Soft leg curve with no harsh elastic marks",
      "Designed to sit smoothly under robes and slips",
    ],
    images: [
      "https://picsum.photos/seed/gilded-veil-teddy-1/600/600",
      "https://picsum.photos/seed/gilded-veil-teddy-2/600/600",
      "https://picsum.photos/seed/gilded-veil-teddy-3/600/600",
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
    description:
      "A modern corset with flexible boning that contours without stiffness. The front neckline is cut to layer cleanly under tailored jackets, while the back paneling balances compression with breathability. An occasion piece engineered for full evenings, not just photos.",
    details: [
      "Flexible boning for shape without stiffness",
      "Front neckline cut to layer under jackets",
      "Back paneling balances compression and comfort",
    ],
    images: [
      "https://picsum.photos/seed/atelier-shadow-corset-1/600/600",
      "https://picsum.photos/seed/atelier-shadow-corset-2/600/600",
      "https://picsum.photos/seed/atelier-shadow-corset-3/600/600",
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
    description:
      "A minimal triangle set in a warm bronze wash. The matching brief is included in the set price and the refined elastic finish keeps the silhouette clean against skin. Light support suits all-day wear under summer dressing.",
    details: [
      "Triangle cup with refined elastic finish",
      "Matching brief included in the set price",
      "Light support suited to all-day wear",
    ],
    images: [
      "https://picsum.photos/seed/soft-flame-triangle-set-1/600/600",
      "https://picsum.photos/seed/soft-flame-triangle-set-2/600/600",
      "https://picsum.photos/seed/soft-flame-triangle-set-3/600/600",
    ],
    palette: ["#5f4a3d", "#b48a56"],
    featured: false,
  },
];

// FX rates used to seed EUR/GBP prices. Hardcoded by design for the seed
// (not for production pricing). For real currency conversion, integrate a
// rate feed and run a price-update job. Update these annually.
const FX_RATES = {
  eur_per_usd: 0.92,
  gbp_per_usd: 0.79,
} as const;

// All countries that should accept shipping. Used to build the service
// zone so that customers in EU/UK can actually check out (the previous
// version only included `us` despite having three regions).
const SHIPPING_COUNTRIES = ["us", "ca", "mx", "es", "fr", "de", "it", "pt", "gb"] as const;

// ── Seed Function ────────────────────────────────────────────────

export default async function seedVelouraData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

  logger.info("🌱 Starting Veloura seed...");

  // ── 1. Update store settings ────────────────────────────────────
  const storeModule = container.resolve(Modules.STORE);
  const stores = await storeModule.listStores();
  if (stores.length === 0) {
    throw new Error(
      "No store found. Run `medusa db:migrate` first — Medusa creates the default store automatically.",
    );
  }
  const store = stores[0];

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: "Veloura — Intimate Atelier",
        supported_currencies: [
          { currency_code: "usd", is_default: true },
          { currency_code: "eur" },
          { currency_code: "gbp" },
          { currency_code: "mxn" },
        ],
      },
    },
  });
  logger.info("  ✓ Store configured (USD, EUR, GBP, MXN)");

  // ── 2. Use existing default sales channel (created by migrations) ──
  // Avoids creating a duplicate "Veloura Storefront" alongside the
  // "Default Sales Channel" that medusa creates automatically.
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL);
  const existingChannels = await salesChannelModule.listSalesChannels({});
  let salesChannel = existingChannels.find((c) => c.name === "Veloura Storefront");
  if (!salesChannel) {
    const { result: created } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: "Veloura Storefront",
            description: "Main luxury lingerie online storefront",
          },
        ],
      },
    });
    salesChannel = created[0];
    logger.info("  ✓ Sales channel created");
  } else {
    logger.info("  ✓ Sales channel reused (already existed)");
  }

  // ── 3. Create publishable API key & link to sales channel ───────
  // The api key token is intentionally NOT logged in plaintext — it
  // ends up in container logs that get shipped to journald. Print only
  // the title and id; consumers can fetch the token from the admin UI.
  const apiKeyModule = container.resolve(Modules.API_KEY);
  const existingKeys = await apiKeyModule.listApiKeys({
    title: "Veloura Storefront Key",
  });
  let apiKey = existingKeys[0];
  if (!apiKey) {
    apiKey = await apiKeyModule.createApiKeys({
      title: "Veloura Storefront Key",
      type: "publishable",
      created_by: "seed-script",
    });
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: apiKey.id,
        add: [salesChannel.id],
      },
    });
    logger.info(
      `  ✓ API key created (id=${apiKey.id}, title="Veloura Storefront Key") — fetch token from admin UI`,
    );
  } else {
    logger.info(`  ✓ API key reused (id=${apiKey.id})`);
  }

  // ── 4. Create regions ───────────────────────────────────────────
  // Stripe payment provider is referenced ONLY when STRIPE_API_KEY is
  // set. The provider id `pp_stripe_stripe` is registered by the Stripe
  // module at startup; if the seed runs before the module finishes
  // initializing, this would fail. We resolve the payment module first
  // and verify the provider exists before passing it to regions.
  let stripeProviderIds: string[] = [];
  if (process.env.STRIPE_API_KEY) {
    try {
      const paymentModule = container.resolve(Modules.PAYMENT);
      const providers = await paymentModule.listPaymentProviders();
      const stripeProvider = providers.find((p) => p.id === "pp_stripe_stripe");
      if (stripeProvider) {
        stripeProviderIds = ["pp_stripe_stripe"];
      } else {
        logger.warn(
          "  ! STRIPE_API_KEY is set but pp_stripe_stripe is not registered yet — skipping payment provider on regions. Re-run seed after Medusa fully boots, or assign manually in admin.",
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(`  ! Could not resolve payment module: ${message}`);
    }
  }

  const { result: regions } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "North America",
          currency_code: "usd",
          countries: ["us", "ca", "mx"],
          payment_providers: stripeProviderIds,
        },
        {
          name: "Europe",
          currency_code: "eur",
          countries: ["es", "fr", "de", "it", "pt"],
          payment_providers: stripeProviderIds,
        },
        {
          name: "United Kingdom",
          currency_code: "gbp",
          countries: ["gb"],
          payment_providers: stripeProviderIds,
        },
      ],
    },
  });
  logger.info("  ✓ Regions created (NA, Europe, UK)");

  // ── 5. Create tax regions ───────────────────────────────────────
  // Defensive: filter out regions without countries (shouldn't happen
  // in practice, but the workflow result type allows undefined).
  const taxRegionInputs = regions.flatMap((region) =>
    (region.countries ?? []).map((c) => ({ country_code: c.iso_2 })),
  );
  if (taxRegionInputs.length > 0) {
    await createTaxRegionsWorkflow(container).run({ input: taxRegionInputs });
  }
  logger.info("  ✓ Tax regions created");

  // ── 6. Create stock location ────────────────────────────────────
  const { result: stockLocations } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: "Veloura Warehouse",
          address: {
            city: "Miami",
            country_code: "us",
            address_1: "100 NE 2nd Ave",
            postal_code: "33132",
            province: "FL",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocations[0];

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [salesChannel.id],
    },
  });
  logger.info("  ✓ Stock location created (Miami)");

  // ── 7. Create fulfillment set & shipping options ────────────────
  // Service zone now spans ALL countries we ship to (not just US),
  // so customers in EU/UK can complete checkout for their region.
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT);
  const fulfillmentSet = await fulfillmentModule.createFulfillmentSets({
    name: "Veloura Shipping",
    type: "shipping",
    service_zones: [
      {
        name: "Global",
        geo_zones: SHIPPING_COUNTRIES.map((country_code) => ({
          type: "country" as const,
          country_code,
        })),
      },
    ],
  });

  const { result: shippingProfiles } = await createShippingProfilesWorkflow(container).run({
    input: {
      data: [{ name: "Veloura Standard", type: "default" }],
    },
  });

  await remoteLink.create([
    {
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: {
        fulfillment_set_id: fulfillmentSet.id,
      },
    },
    {
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: "manual_manual",
      },
    },
  ]);

  const serviceZone = fulfillmentSet.service_zones[0];

  // The "Complimentary Shipping" option is now actually gated by a
  // cart-total minimum so the label "Orders over $200" matches the
  // behavior. Standard and Express are unconditional.
  const FREE_SHIPPING_MIN_USD = 20000; // $200.00 in cents

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Shipping",
        price_type: "flat",
        service_zone_id: serviceZone.id,
        shipping_profile_id: shippingProfiles[0].id,
        provider_id: "manual_manual",
        type: { label: "Standard", description: "5-7 business days", code: "standard" },
        prices: [
          { currency_code: "usd", amount: 800 },
          { currency_code: "eur", amount: 700 },
          { currency_code: "gbp", amount: 600 },
        ],
        rules: [{ attribute: "enabled_in_store", value: "true", operator: "eq" }],
      },
      {
        name: "Express Shipping",
        price_type: "flat",
        service_zone_id: serviceZone.id,
        shipping_profile_id: shippingProfiles[0].id,
        provider_id: "manual_manual",
        type: { label: "Express", description: "1-3 business days", code: "express" },
        prices: [
          { currency_code: "usd", amount: 1500 },
          { currency_code: "eur", amount: 1300 },
          { currency_code: "gbp", amount: 1100 },
        ],
        rules: [{ attribute: "enabled_in_store", value: "true", operator: "eq" }],
      },
      {
        name: "Complimentary Shipping",
        price_type: "flat",
        service_zone_id: serviceZone.id,
        shipping_profile_id: shippingProfiles[0].id,
        provider_id: "manual_manual",
        type: {
          label: "Complimentary",
          description: `Free on orders over $${FREE_SHIPPING_MIN_USD / 100}`,
          code: "free",
        },
        prices: [
          { currency_code: "usd", amount: 0 },
          { currency_code: "eur", amount: 0 },
          { currency_code: "gbp", amount: 0 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          {
            attribute: "item_total",
            value: String(FREE_SHIPPING_MIN_USD),
            operator: "gte",
          },
        ],
      },
    ],
  });
  logger.info("  ✓ Fulfillment & shipping options created");

  // ── 8. Create product categories ────────────────────────────────
  const { result: categories } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: CATEGORIES,
    },
  });

  const categoryMap = new Map(categories.map((c) => [c.handle, c.id]));
  logger.info(`  ✓ ${categories.length} categories created`);

  // ── 9. Create product tags ───────────────────────────────────────
  const allTagValues = [...new Set(PRODUCTS.flatMap((p) => p.tags))];
  const productModule = container.resolve(Modules.PRODUCT);
  const createdTags = await productModule.createProductTags(
    allTagValues.map((value) => ({ value })),
  );
  const tagMap = new Map(createdTags.map((t) => [t.value, t.id]));
  logger.info(`  ✓ ${createdTags.length} product tags created`);

  // ── 10. Create products ─────────────────────────────────────────
  const { result: products } = await createProductsWorkflow(container).run({
    input: {
      products: PRODUCTS.map((p) => ({
        title: p.title,
        handle: p.handle,
        subtitle: p.tagline,
        description: p.description,
        status: ProductStatus.PUBLISHED,
        is_giftcard: false,
        category_ids: [categoryMap.get(p.categoryHandle)!],
        tags: p.tags.map((t) => ({ id: tagMap.get(t)! })),
        images: p.images.map((url) => ({ url })),
        options: [
          {
            title: "Size",
            values: p.sizes,
          },
        ],
        variants: p.sizes.map((size) => ({
          title: `${p.title} — ${size}`,
          sku: `${p.handle}-${size.toLowerCase()}`,
          options: { Size: size },
          manage_inventory: true,
          prices: [
            { currency_code: "usd", amount: p.priceCents },
            {
              currency_code: "eur",
              amount: Math.round(p.priceCents * FX_RATES.eur_per_usd),
            },
            {
              currency_code: "gbp",
              amount: Math.round(p.priceCents * FX_RATES.gbp_per_usd),
            },
          ],
        })),
        metadata: {
          palette_primary: p.palette[0],
          palette_secondary: p.palette[1],
          featured: p.featured,
          details: JSON.stringify(p.details),
        },
        sales_channels: [{ id: salesChannel.id }],
      })),
    },
  });
  logger.info(`  ✓ ${products.length} products created`);

  // ── 11. Set inventory levels ────────────────────────────────────
  // Scope to inventory items belonging to the products we just created
  // (via the SKU pattern) instead of querying ALL inventory items in
  // the DB. This prevents touching pre-existing or stale inventory items
  // from previous seed runs.
  const newProductSkus = PRODUCTS.flatMap((p) =>
    p.sizes.map((size) => `${p.handle}-${size.toLowerCase()}`),
  );

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
    filters: {
      sku: newProductSkus,
    },
  });

  if (inventoryItems.length > 0) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: inventoryItems.map((item) => ({
          location_id: stockLocation.id,
          stocked_quantity: 50,
          inventory_item_id: item.id,
        })),
      },
    });
    logger.info(`  ✓ Inventory set (50 units per variant, ${inventoryItems.length} items)`);
  } else {
    logger.warn("  ! No inventory items found for new product SKUs — skipping inventory setup");
  }

  // ── Done ────────────────────────────────────────────────────────
  logger.info("");
  logger.info("═══════════════════════════════════════════");
  logger.info("  Veloura seed complete!");
  logger.info(`  ${products.length} products across ${categories.length} categories`);
  logger.info(`  Publishable API key id: ${apiKey.id}`);
  logger.info(`  Fetch the token from the admin UI at /veloura → Settings → API Keys`);
  logger.info("═══════════════════════════════════════════");
}
