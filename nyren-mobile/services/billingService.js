import AsyncStorage from "@react-native-async-storage/async-storage";
import paymentService from "./paymentService";
import {
  PRICING_TIERS,
  getDefaultUserPlan,
  getPlanById,
  getRemainingQuota,
  isOverQuota,
} from "../constants/pricing";

/** ============================================
 * BILLING SERVICE
 * Manages user subscription state, usage tracking, and plan enforcement
 * Production-grade SaaS billing logic
 * ============================================ */

const BILLING_STORAGE_KEY = "coli_billing_state";
const PLAN_USAGE_KEY = "coli_usage_today";

export const billingService = {
  /* ============ INITIALIZATION ============ */

  /**
   * Initialize user billing state (called on app launch)
   */
  initializeBillingState: async () => {
    try {
      const existing = await AsyncStorage.getItem(BILLING_STORAGE_KEY);
      if (!existing) {
        const defaultState = getDefaultUserPlan();
        await AsyncStorage.setItem(
          BILLING_STORAGE_KEY,
          JSON.stringify(defaultState)
        );
        return defaultState;
      }
      return JSON.parse(existing);
    } catch (e) {
      console.error("[Billing] Init error:", e);
      return getDefaultUserPlan();
    }
  },

  /**
   * Get current user billing state
   */
  getBillingState: async () => {
    try {
      const state = await AsyncStorage.getItem(BILLING_STORAGE_KEY);
      return state ? JSON.parse(state) : getDefaultUserPlan();
    } catch (e) {
      console.error("[Billing] Get state error:", e);
      return getDefaultUserPlan();
    }
  },

  /**
   * Save billing state
   */
  saveBillingState: async (state) => {
    try {
      await AsyncStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(state));
      return { success: true };
    } catch (e) {
      console.error("[Billing] Save state error:", e);
      return { success: false, error: e.message };
    }
  },

  /* ============ PLAN MANAGEMENT ============ */

  /**
   * Upgrade user to new plan (placeholder for payment integration)
   */
  upgradePlan: async (newPlanId) => {
    try {
      const state = await billingService.getBillingState();

      // Validate plan exists
      const newPlan = getPlanById(newPlanId);
      if (!newPlan) {
        return { success: false, error: "Invalid plan ID" };
      }

      // Update state
      state.currentPlan = newPlanId;
      state.isPremium = newPlanId !== "free";
      state.lastUpgradeDate = new Date().toISOString();
      state.billingCycleEnd = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      await billingService.saveBillingState(state);

      return {
        success: true,
        message: `Upgraded to ${newPlan.name}`,
        plan: newPlan,
      };
    } catch (e) {
      console.error("[Billing] Upgrade error:", e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Downgrade user to new plan
   */
  downgradePlan: async (newPlanId) => {
    try {
      const state = await billingService.getBillingState();
      const newPlan = getPlanById(newPlanId);

      if (!newPlan) {
        return { success: false, error: "Invalid plan ID" };
      }

      state.currentPlan = newPlanId;
      state.isPremium = newPlanId !== "free";

      await billingService.saveBillingState(state);

      return {
        success: true,
        message: `Downgraded to ${newPlan.name}`,
        plan: newPlan,
      };
    } catch (e) {
      console.error("[Billing] Downgrade error:", e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Cancel subscription (revert to free)
   */
  cancelSubscription: async () => {
    try {
      const state = await billingService.getBillingState();
      state.currentPlan = "free";
      state.isPremium = false;

      await billingService.saveBillingState(state);

      return { success: true, message: "Subscription cancelled, reverted to Free plan" };
    } catch (e) {
      console.error("[Billing] Cancel error:", e);
      return { success: false, error: e.message };
    }
  },

  /* ============ USAGE TRACKING ============ */

  /**
   * Get today's usage for a metric
   */
  getTodayUsage: async () => {
    try {
      const usage = await AsyncStorage.getItem(PLAN_USAGE_KEY);
      if (!usage) {
        return {
          messagesUsedToday: 0,
          voiceUsedToday: 0,
          storageUsedToday: 0,
          date: new Date().toDateString(),
        };
      }

      const parsed = JSON.parse(usage);
      // Reset if date has changed
      if (parsed.date !== new Date().toDateString()) {
        return {
          messagesUsedToday: 0,
          voiceUsedToday: 0,
          storageUsedToday: 0,
          date: new Date().toDateString(),
        };
      }
      return parsed;
    } catch (e) {
      console.error("[Billing] Get usage error:", e);
      return {
        messagesUsedToday: 0,
        voiceUsedToday: 0,
        storageUsedToday: 0,
        date: new Date().toDateString(),
      };
    }
  },

  /**
   * Increment message usage
   */
  recordMessageUsage: async (count = 1) => {
    try {
      const state = await billingService.getBillingState();
      const usage = await billingService.getTodayUsage();

      usage.messagesUsedToday += count;

      // Check if over quota
      const isOver = isOverQuota(
        state.currentPlan,
        "messagesPerDay",
        usage.messagesUsedToday
      );

      await AsyncStorage.setItem(PLAN_USAGE_KEY, JSON.stringify(usage));

      return {
        success: true,
        messagesUsedToday: usage.messagesUsedToday,
        isOverQuota: isOver,
      };
    } catch (e) {
      console.error("[Billing] Record message error:", e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Check if user can send a message (has quota remaining)
   */
  canSendMessage: async () => {
    try {
      const state = await billingService.getBillingState();
      const usage = await billingService.getTodayUsage();

      const isOver = isOverQuota(
        state.currentPlan,
        "messagesPerDay",
        usage.messagesUsedToday
      );

      return {
        allowed: !isOver,
        messagesUsedToday: usage.messagesUsedToday,
        plan: state.currentPlan,
      };
    } catch (e) {
      console.error("[Billing] Can send message error:", e);
      // Allow sending on error to avoid blocking users
      return { allowed: true, messagesUsedToday: 0, plan: "free" };
    }
  },
  recordVoiceUsage: async (count = 1) => {
    try {
      const state = await billingService.getBillingState();
      const usage = await billingService.getTodayUsage();

      usage.voiceUsedToday += count;

      const isOver = isOverQuota(
        state.currentPlan,
        "voiceRequestsPerDay",
        usage.voiceUsedToday
      );

      await AsyncStorage.setItem(PLAN_USAGE_KEY, JSON.stringify(usage));

      return {
        success: true,
        voiceUsedToday: usage.voiceUsedToday,
        isOverQuota: isOver,
      };
    } catch (e) {
      console.error("[Billing] Record voice error:", e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Reset usage (called at midnight or subscription reset)
   */
  resetDailyUsage: async () => {
    try {
      const newUsage = {
        messagesUsedToday: 0,
        voiceUsedToday: 0,
        storageUsedToday: 0,
        date: new Date().toDateString(),
      };
      await AsyncStorage.setItem(PLAN_USAGE_KEY, JSON.stringify(newUsage));
      return { success: true };
    } catch (e) {
      console.error("[Billing] Reset usage error:", e);
      return { success: false, error: e.message };
    }
  },

  /* ============ QUOTA CHECKING ============ */

  /**
   * Check if user can send a message (usage-based)
   */
  canSendMessage: async () => {
    try {
      const state = await billingService.getBillingState();
      const usage = await billingService.getTodayUsage();

      const isOver = isOverQuota(
        state.currentPlan,
        "messagesPerDay",
        usage.messagesUsedToday
      );

      const remaining = getRemainingQuota(
        state.currentPlan,
        "messagesPerDay",
        usage.messagesUsedToday
      );

      return {
        allowed: !isOver,
        remaining: remaining === Infinity ? "Unlimited" : remaining,
        limit: getPlanById(state.currentPlan).limits.messagesPerDay,
        used: usage.messagesUsedToday,
      };
    } catch (e) {
      console.error("[Billing] Check message error:", e);
      return { allowed: false, error: e.message };
    }
  },

  /**
   * Check if user can use voice
   */
  canUseVoice: async () => {
    try {
      const state = await billingService.getBillingState();
      const usage = await billingService.getTodayUsage();

      const isOver = isOverQuota(
        state.currentPlan,
        "voiceRequestsPerDay",
        usage.voiceUsedToday
      );

      const remaining = getRemainingQuota(
        state.currentPlan,
        "voiceRequestsPerDay",
        usage.voiceUsedToday
      );

      return {
        allowed: !isOver,
        remaining: remaining === Infinity ? "Unlimited" : remaining,
        limit: getPlanById(state.currentPlan).limits.voiceRequestsPerDay,
        used: usage.voiceUsedToday,
      };
    } catch (e) {
      console.error("[Billing] Check voice error:", e);
      return { allowed: false, error: e.message };
    }
  },

  /**
   * Check file upload size
   */
  canUploadFile: async (fileSizeMB) => {
    try {
      const state = await billingService.getBillingState();
      const plan = getPlanById(state.currentPlan);
      const maxSize = plan.limits.maxFileSize;

      if (maxSize === Infinity) {
        return { allowed: true, maxSize: "Unlimited" };
      }

      return {
        allowed: fileSizeMB <= maxSize,
        maxSize,
        requested: fileSizeMB,
      };
    } catch (e) {
      console.error("[Billing] Check upload error:", e);
      return { allowed: false, error: e.message };
    }
  },

  /* ============ PLAN INFO ============ */

  /**
   * Get current plan details
   */
  getCurrentPlanDetails: async () => {
    try {
      const state = await billingService.getBillingState();
      const plan = getPlanById(state.currentPlan);
      const usage = await billingService.getTodayUsage();

      return {
        plan,
        state,
        usage,
        quotaStatus: {
          messages: {
            used: usage.messagesUsedToday,
            limit: plan.limits.messagesPerDay,
            percentage:
              plan.limits.messagesPerDay === Infinity
                ? 0
                : Math.round(
                    (usage.messagesUsedToday / plan.limits.messagesPerDay) * 100
                  ),
          },
          voice: {
            used: usage.voiceUsedToday,
            limit: plan.limits.voiceRequestsPerDay,
            percentage:
              plan.limits.voiceRequestsPerDay === Infinity
                ? 0
                : Math.round(
                    (usage.voiceUsedToday / plan.limits.voiceRequestsPerDay) * 100
                  ),
          },
        },
      };
    } catch (e) {
      console.error("[Billing] Get plan details error:", e);
      return { error: e.message };
    }
  },

  /**
   * Get all available plans (for plan selector)
   */
  getAvailablePlans: () => {
    return Object.values(PRICING_TIERS).sort((a, b) => a.tier - b.tier);
  },

  /* ============ PAYMENT INTEGRATION PLACEHOLDERS ============ */

  /**
   * Initiate Stripe payment via paymentService
   */
  initiateStripePayment: async (planId) => {
    return await paymentService.initiateStripePayment(planId);
  },

  /**
   * Initiate Flutterwave payment via paymentService
   */
  initiateFlutterwavePayment: async (planId) => {
    return await paymentService.initiateFlutterwavePayment(planId);
  },

  /**
   * Initiate PayPal payment via paymentService
   */
  initiatePayPalPayment: async (planId) => {
    return await paymentService.initiatePayPalPayment(planId);
  },

  /**
   * Initiate EcoCash payment via paymentService
   */
  initiateEcoCashPayment: async (planId) => {
    return await paymentService.initiateEcoCashPayment(planId);
  },

  /**
   * Initiate InnBucks payment via paymentService
   */
  initiateInnbucksPayment: async (planId) => {
    return await paymentService.initiateInnbucksPayment(planId);
  },

  /**
   * Verify payment and update plan
   */
  verifyPaymentAndUpgrade: async (paymentId, planId) => {
    console.log("[Billing] Verifying payment:", paymentId, "for plan:", planId);
    // TODO: Call backend to verify payment with Stripe/PayPal
    // Then call upgradePlan() to update local state
    return {
      success: false,
      message: "Payment verification not yet implemented",
    };
  },
};

export default billingService;
