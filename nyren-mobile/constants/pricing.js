/** ============================================
 * PRICING TIER DEFINITIONS
 * Production-grade SaaS subscription structure
 * ============================================ */

export const PRICING_TIERS = {
  FREE: {
    id: "free",
    name: "Coli Free",
    price: 0,
    period: "/month",
    currency: "$",
    badge: "Starter",
    tagline: "New users trying Coli",
    description: "A lightweight version of Coli for casual use and testing the ecosystem.",
    features: [
      "Basic AI chat",
      "Limited daily requests (25/day)",
      "Limited voice usage (5/day)",
      "Basic memory support",
      "Slower response times during peak hours",
      "Standard models only",
    ],
    limits: {
      messagesPerDay: 25,
      voiceRequestsPerDay: 5,
      maxFileSize: 2, // MB
      searchResultsPerQuery: 5,
      synthesisGeneration: false,
      advancedAgents: false,
      apiAccess: false,
      prioritySupport: false,
      responseTokenLimit: 250,
    },
    color: "#64748b",
    background: "rgba(100, 116, 139, 0.05)",
    tier: 1,
  },

  GO: {
    id: "go",
    name: "Coli GO",
    price: 7,
    period: "/month",
    currency: "$",
    badge: "Popular",
    tagline: "Students & everyday productivity",
    description: "Affordable access to the full everyday Coli assistant experience.",
    features: [
      "Faster responses",
      "300+ messages per day",
      "Voice assistant access",
      "Basic research tools",
      "File upload support",
      "Better memory retention",
      "Medium context window",
    ],
    limits: {
      messagesPerDay: 300,
      voiceRequestsPerDay: 50,
      maxFileSize: 25, // MB
      searchResultsPerQuery: 15,
      synthesisGeneration: true,
      advancedAgents: false,
      apiAccess: false,
      prioritySupport: false,
      responseTokenLimit: 450,
    },
    color: "#3b82f6",
    background: "rgba(59, 130, 246, 0.05)",
    tier: 2,
  },

  PLUS: {
    id: "plus",
    name: "Coli PLUS",
    price: 15,
    period: "/month",
    currency: "$",
    badge: "Best Value",
    tagline: "Heavy users & creators",
    description: "Enhanced intelligence, speed, and creative tools for serious users.",
    features: [
      "Priority performance tier",
      "Long conversation support",
      "Advanced reasoning models",
      "AI workspace tools",
      "Image understanding capability",
      "Smart memory system",
      "Early feature access",
      "Higher daily limits",
    ],
    limits: {
      messagesPerDay: 1000,
      voiceRequestsPerDay: 200,
      maxFileSize: 100, // MB
      searchResultsPerQuery: 30,
      synthesisGeneration: true,
      advancedAgents: true,
      apiAccess: false,
      prioritySupport: false,
      responseTokenLimit: 700,
    },
    color: "#10b981",
    background: "rgba(16, 185, 129, 0.05)",
    tier: 3,
  },

  PREMIUM: {
    id: "premium",
    name: "Coli Premium",
    price: 29,
    period: "/month",
    currency: "$",
    badge: "Professional",
    tagline: "Researchers, founders & advanced users",
    description: "A professional-grade AI operating system for deep work and advanced workflows.",
    features: [
      "Premium AI models access",
      "Research mode with advanced tools",
      "Multi-agent workflows",
      "Large file analysis (up to 1GB)",
      "Advanced voice mode",
      "Persistent long-term memory",
      "Priority queue processing",
      "Dedicated content library",
      "Advanced synthesis engine",
    ],
    limits: {
      messagesPerDay: 5000,
      voiceRequestsPerDay: 500,
      maxFileSize: 1000, // MB
      searchResultsPerQuery: 75,
      synthesisGeneration: true,
      advancedAgents: true,
      apiAccess: false,
      prioritySupport: true,
      responseTokenLimit: 1200,
    },
    color: "#f59e0b",
    background: "rgba(245, 158, 11, 0.05)",
    tier: 4,
  },

  PRO: {
    id: "pro",
    name: "Coli PRO",
    price: 79,
    period: "/month",
    currency: "$",
    badge: "Enterprise",
    tagline: "Teams, startups, engineers & professionals",
    description: "Enterprise-level power for building, researching, automating, and scaling with AI.",
    features: [
      "Maximum performance tier",
      "Fastest response priority",
      "Unlimited advanced agents",
      "Team workspace support",
      "Automation pipelines & workflows",
      "AI coding systems & integration",
      "Extended memory + retrieval",
      "Premium infrastructure access",
      "API credits bundled",
      "Custom integrations",
    ],
    limits: {
      messagesPerDay: 50000,
      voiceRequestsPerDay: 5000,
      maxFileSize: 5000, // MB
      searchResultsPerQuery: 200,
      synthesisGeneration: true,
      advancedAgents: true,
      apiAccess: true,
      prioritySupport: true,
      responseTokenLimit: 2200,
    },
    color: "#c026d3",
    background: "rgba(192, 38, 211, 0.05)",
    tier: 5,
  },

  API_PLATFORM: {
    id: "api",
    name: "Coli API Platform",
    price: null, // Usage-based
    period: "usage-based",
    currency: "$",
    badge: "Scale",
    tagline: "Developers & companies integrating Coli",
    pricingTiers: [
      { name: "Starter", price: 19, features: "Starter tier pricing" },
      { name: "Growth", price: 99, features: "Growth tier pricing" },
      { name: "Scale", price: "Custom", features: "Enterprise pricing" },
    ],
    description: "Build apps and products directly on top of Coli infrastructure.",
    features: [
      "API keys & SDK access",
      "AI model endpoints",
      "Voice APIs",
      "Agent orchestration APIs",
      "Webhooks & real-time data",
      "Analytics dashboard",
      "Rate limit scaling",
      "Custom endpoints",
      "Technical onboarding",
      "Business support SLA",
    ],
    limits: {
      messagesPerDay: Infinity,
      voiceRequestsPerDay: Infinity,
      maxFileSize: Infinity,
      searchResultsPerQuery: 500,
      synthesisGeneration: true,
      advancedAgents: true,
      apiAccess: true,
      prioritySupport: true,
      responseTokenLimit: 3000,
    },
    color: "#dc2626",
    background: "rgba(220, 38, 38, 0.05)",
    tier: 6,
  },
};

/** ============================================
 * DEFAULT USER PLAN STATE
 * ============================================ */
export const getDefaultUserPlan = () => ({
  currentPlan: "free",
  messagesUsedToday: 0,
  voiceUsedToday: 0,
  messagesResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  isPremium: false,
  subscriptionDate: new Date().toISOString(),
  lastUpgradeDate: null,
  billingCycleStart: new Date().toISOString(),
  billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
});

/** ============================================
 * PLAN UTILITY FUNCTIONS
 * ============================================ */

/**
 * Get plan by ID
 */
export const getPlanById = (planId) => {
  const plan = Object.values(PRICING_TIERS).find((p) => p.id === planId);
  return plan || PRICING_TIERS.FREE;
};

/**
 * Get all plans in tier order (for plan selector UI)
 */
export const getPlansSorted = () => {
  return Object.values(PRICING_TIERS).sort((a, b) => a.tier - b.tier);
};

/**
 * Format price for display ($7/month or "Usage-based")
 */
export const formatPrice = (plan) => {
  if (plan.id === "api") return "Usage-based";
  return `${plan.currency}${plan.price}${plan.period}`;
};

/**
 * Check if user has feature available
 */
export const hasFeature = (planId, feature) => {
  const plan = getPlanById(planId);
  return plan.limits[feature] !== false;
};

/**
 * Get remaining quota for today
 */
export const getRemainingQuota = (planId, usageType, usedToday) => {
  const plan = getPlanById(planId);
  const limit = plan.limits[usageType];
  
  if (limit === Infinity) return Infinity;
  if (!limit) return 0;
  
  return Math.max(0, limit - usedToday);
};

export const getPlanResponseTokenLimit = (planId, fallback = 250) => {
  const plan = getPlanById(planId);
  const limit = Number(plan?.limits?.responseTokenLimit);
  if (!Number.isFinite(limit) || limit <= 0) return fallback;
  return limit;
};

/**
 * Check if user is over quota
 */
export const isOverQuota = (planId, usageType, usedToday) => {
  const remaining = getRemainingQuota(planId, usageType, usedToday);
  return remaining <= 0;
};

/**
 * Get plan comparison (for upgrade flow)
 */
export const comparePlans = (currentPlanId, targetPlanId) => {
  const current = getPlanById(currentPlanId);
  const target = getPlanById(targetPlanId);
  
  return {
    current,
    target,
    improvement: {
      messages: target.limits.messagesPerDay - current.limits.messagesPerDay,
      voice: target.limits.voiceRequestsPerDay - current.limits.voiceRequestsPerDay,
      storage: target.limits.maxFileSize - current.limits.maxFileSize,
    },
  };
};

/**
 * Get monthly and annual pricing (future feature)
 */
export const getAnnualSavings = (monthlyPrice) => {
  const annual = monthlyPrice * 12 * 0.85; // 15% discount
  return monthlyPrice * 12 - annual;
};

/**
 * Get next higher tier for upgrade suggestion
 */
export const getNextTier = (currentPlanId) => {
  const current = getPlanById(currentPlanId);
  const allPlans = getPlansSorted();
  const currentIndex = allPlans.findIndex((p) => p.id === current.id);
  
  if (currentIndex === -1 || currentIndex === allPlans.length - 1) return null;
  return allPlans[currentIndex + 1];
};
