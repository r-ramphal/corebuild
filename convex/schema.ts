import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  components: defineTable({
    type: v.union(
      v.literal("cpu"),
      v.literal("gpu"),
      v.literal("motherboard"),
      v.literal("ram"),
      v.literal("storage"),
      v.literal("psu"),
      v.literal("case"),
      v.literal("cooling"),
    ),
    name: v.string(),
    brand: v.string(),
    model: v.string(),
    specs: v.any(),
    imageUrl: v.optional(v.string()),
    releaseDate: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_brand", ["brand"]),

  prices: defineTable({
    componentId: v.id("components"),
    retailer: v.union(
      v.literal("amazon"),
      v.literal("megekko"),
      v.literal("azerty"),
      v.literal("alternate"),
    ),
    priceEur: v.number(),
    stockStatus: v.union(
      v.literal("in_stock"),
      v.literal("limited"),
      v.literal("out_of_stock"),
    ),
    productUrl: v.string(),
    shippingCost: v.optional(v.number()),
    lastUpdated: v.number(),
  })
    .index("by_component", ["componentId"])
    .index("by_retailer", ["retailer"]),

  priceHistory: defineTable({
    componentId: v.id("components"),
    retailer: v.string(),
    priceEur: v.number(),
    timestamp: v.number(),
  }).index("by_component_timestamp", ["componentId", "timestamp"]),

  userBuilds: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    components: v.array(v.id("components")),
    totalPrice: v.number(),
    isPublic: v.boolean(),
    compatibilityIssues: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_public", ["isPublic"]),

  priceAlerts: defineTable({
    userId: v.string(),
    componentId: v.id("components"),
    targetPrice: v.number(),
    notified: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_component", ["componentId"]),
});
