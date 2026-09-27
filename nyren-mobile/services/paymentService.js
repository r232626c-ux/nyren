/* ================= PAYMENT SERVICE ================= */
/* Multi-platform payment processing: Stripe, PayPal, EcoCash, InnBucks */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "./config";

const PAYMENT_STORAGE_KEY = "coli_payment_history";
const PLAN_PRICING = {
  coli_go: 7,
  coli_plus: 15,
  coli_premium: 29,
  coli_pro: 79,
};

const getPlanAmount = (planId) => {
  if (!planId || planId === 'coli_free') return 0;
  return PLAN_PRICING[planId] || 29;
};

export const paymentService = {
  /* -------- STRIPE -------- */
  
  initiateStripePayment: async (planId, userId = null) => {
    try {
      console.log(`[PAYMENT] Initiating Stripe payment for plan: ${planId}`);
      const apiBase = getApiBaseUrl();
      const amount = getPlanAmount(planId);
      const response = await fetch(`${apiBase}/api/billing/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: Math.round(amount * 100),
          planId,
          userId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[PAYMENT] Stripe checkout failed', data);
        return { success: false, error: data.error || 'Stripe checkout failed' };
      }

      const result = {
        success: true,
        url: data.url,
        transactionId: `stripe_${Date.now()}`,
        method: 'stripe',
        planId,
        timestamp: new Date().toISOString(),
        message: 'Stripe checkout session created',
      };

      await savePaymentHistory(result);
      return result;
    } catch (e) {
      console.error("[PAYMENT] Stripe error:", e.message);
      return { success: false, error: e.message };
    }
  },

  /* -------- FLUTTERWAVE -------- */
  
  initiateFlutterwavePayment: async (planId, email = 'guest@coli.app', name = 'COLI Guest', userId = null) => {
    try {
      console.log(`[PAYMENT] Initiating Flutterwave payment for plan: ${planId}`);
      const apiBase = getApiBaseUrl();
      const amount = getPlanAmount(planId);
      const response = await fetch(`${apiBase}/api/billing/flutterwave/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          planId,
          email,
          name,
          userId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[PAYMENT] Flutterwave checkout failed', data);
        return { success: false, error: data.error || 'Flutterwave checkout failed' };
      }

      const link = data?.data?.link || data?.link;
      if (!link) {
        return { success: false, error: 'Flutterwave did not return a checkout link.' };
      }

      const result = {
        success: true,
        url: link,
        transactionId: `flutterwave_${Date.now()}`,
        method: 'flutterwave',
        planId,
        timestamp: new Date().toISOString(),
        message: 'Flutterwave checkout session created',
      };

      await savePaymentHistory(result);
      return result;
    } catch (e) {
      console.error("[PAYMENT] Flutterwave error:", e.message);
      return { success: false, error: e.message };
    }
  },

  /* -------- PAYPAL -------- */
  
  initiatePayPalPayment: async (planId) => {
    try {
      console.log(`[PAYMENT] Initiating PayPal payment for plan: ${planId}`);
      
      // In production, this would call PayPal SDK
      // Use react-native-paypal to handle PayPal flow
      
      const simulatedResult = {
        success: true,
        transactionId: `paypal_${Date.now()}`,
        method: "paypal",
        planId,
        timestamp: new Date().toISOString(),
        message: "PayPal payment initiated successfully",
      };

      await savePaymentHistory(simulatedResult);
      return simulatedResult;
    } catch (e) {
      console.error("[PAYMENT] PayPal error:", e.message);
      return { success: false, error: e.message };
    }
  },

  /* -------- ECOCASH (ZIMBABWE MOBILE MONEY) -------- */
  
  initiateEcoCashPayment: async (planId) => {
    try {
      console.log(`[PAYMENT] Initiating EcoCash payment for plan: ${planId}`);
      
      // EcoCash integration would typically use:
      // 1. USSD codes (dial *100*...) 
      // 2. EcoCash API (if merchant account available)
      // 3. QR code generation for payment
      
      const simulatedResult = {
        success: true,
        transactionId: `ecocash_${Date.now()}`,
        method: "ecocash",
        planId,
        timestamp: new Date().toISOString(),
        message: "EcoCash payment initiated. Check your phone for USSD prompt.",
        ussdCode: "*100*50#", // Example USSD for $50 transfer
      };

      await savePaymentHistory(simulatedResult);
      return simulatedResult;
    } catch (e) {
      console.error("[PAYMENT] EcoCash error:", e.message);
      return { success: false, error: e.message };
    }
  },

  /* -------- INNBUCKS (INNOV8 DIGITAL CURRENCY) -------- */
  
  initiateInnbucksPayment: async (planId) => {
    try {
      console.log(`[PAYMENT] Initiating InnBucks payment for plan: ${planId}`);
      
      // InnBucks integration would use their API:
      // 1. User authentication with InnBucks account
      // 2. Balance check
      // 3. Transaction processing
      // 4. Confirmation and receipt
      
      const simulatedResult = {
        success: true,
        transactionId: `innbucks_${Date.now()}`,
        method: "innbucks",
        planId,
        timestamp: new Date().toISOString(),
        message: "InnBucks payment processed successfully",
        creditsUsed: 50, // Example: $50 equivalent in InnBucks
      };

      await savePaymentHistory(simulatedResult);
      return simulatedResult;
    } catch (e) {
      console.error("[PAYMENT] InnBucks error:", e.message);
      return { success: false, error: e.message };
    }
  },

  /* -------- PAYMENT VERIFICATION -------- */
  
  verifyPayment: async (transactionId) => {
    try {
      console.log(`[PAYMENT] Verifying transaction: ${transactionId}`);
      
      // In production, call backend to verify payment status
      // Backend checks with payment gateway (Stripe, PayPal, etc.)
      
      const history = await getPaymentHistory();
      const transaction = history.find(tx => tx.transactionId === transactionId);
      
      if (!transaction) {
        return { success: false, error: "Transaction not found" };
      }

      return {
        success: true,
        status: "completed",
        transaction,
      };
    } catch (e) {
      console.error("[PAYMENT] Verification error:", e.message);
      return { success: false, error: e.message };
    }
  },

  /* -------- PAYMENT HISTORY -------- */
  
  getPaymentHistory: async () => {
    try {
      const history = await AsyncStorage.getItem(PAYMENT_STORAGE_KEY);
      return history ? JSON.parse(history) : [];
    } catch (e) {
      console.error("[PAYMENT] Error reading history:", e.message);
      return [];
    }
  },

  savePaymentHistory: async (transaction) => {
    try {
      const history = await paymentService.getPaymentHistory();
      history.push(transaction);
      await AsyncStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(history));
      console.log("[PAYMENT] Transaction saved");
    } catch (e) {
      console.error("[PAYMENT] Error saving transaction:", e.message);
    }
  },

  /* -------- REFUND HANDLING -------- */
  
  initiateRefund: async (transactionId, reason = "user_request") => {
    try {
      console.log(`[PAYMENT] Initiating refund for transaction: ${transactionId}, reason: ${reason}`);
      
      const transaction = await paymentService.getPaymentHistory();
      const tx = transaction.find(t => t.transactionId === transactionId);
      
      if (!tx) {
        return { success: false, error: "Transaction not found" };
      }

      // In production, call payment gateway API to process refund
      const refundResult = {
        success: true,
        refundId: `refund_${Date.now()}`,
        originalTransactionId: transactionId,
        method: tx.method,
        reason,
        timestamp: new Date().toISOString(),
        status: "processing",
      };

      await paymentService.savePaymentHistory(refundResult);
      return refundResult;
    } catch (e) {
      console.error("[PAYMENT] Refund error:", e.message);
      return { success: false, error: e.message };
    }
  },

  /* -------- PAYMENT STATUS -------- */
  
  getPaymentStatus: async (transactionId) => {
    try {
      const history = await paymentService.getPaymentHistory();
      const transaction = history.find(tx => tx.transactionId === transactionId);
      
      if (!transaction) {
        return { success: false, status: "not_found" };
      }

      return {
        success: true,
        status: "completed",
        transaction,
      };
    } catch (e) {
      console.error("[PAYMENT] Status check error:", e.message);
      return { success: false, error: e.message };
    }
  },
};

/* Helper function */
const savePaymentHistory = paymentService.savePaymentHistory;

export default paymentService;
