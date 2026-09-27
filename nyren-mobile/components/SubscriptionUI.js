import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatPrice, getPlanById } from "../constants/pricing";

/** ============================================
 * PLAN CARD
 * Reusable subscription tier card component
 * ============================================ */

export const PlanCard = ({
  planId,
  isCurrentPlan = false,
  onSelect,
  onUpgrade,
  showComparison = false,
  compact = false,
}) => {
  const plan = getPlanById(planId);

  const handleCardPress = () => {
    // Always call onUpgrade for subscription upgrades
    onUpgrade?.(planId);
  };

  if (compact) {
    return (
      <TouchableOpacity
        onPress={handleCardPress}
        style={[styles.compactCard, isCurrentPlan && styles.compactCardActive]}
      >
        <Text style={styles.compactName}>{plan.name}</Text>
        <Text
          style={[styles.compactPrice, { color: plan.color }]}
        >
          {formatPrice(plan)}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        isCurrentPlan && styles.cardActive,
        { borderColor: isCurrentPlan ? plan.color : "rgba(255,255,255,0.1)" },
      ]}
    >
      {/* HEADER */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardName}>{plan.name}</Text>
          <Text style={styles.cardTagline}>{plan.tagline}</Text>
        </View>
        {isCurrentPlan && (
          <View style={[styles.currentBadge, { backgroundColor: plan.color }]}>
            <Text style={styles.currentBadgeText}>✓ Current</Text>
          </View>
        )}
      </View>

      {/* PRICING */}
      <View style={styles.pricingSection}>
        {plan.id === "api" ? (
          <>
            <Text style={styles.price}>Usage-based</Text>
            <Text style={styles.subtext}>Custom pricing available</Text>
          </>
        ) : (
          <>
            <Text style={[styles.price, { color: plan.color }]}>
              {formatPrice(plan)}
            </Text>
            <Text style={styles.subtext}>{plan.description}</Text>
          </>
        )}
      </View>

      {/* FEATURES */}
      <View style={styles.featuresSection}>
        {plan.features.slice(0, 6).map((feature, idx) => (
          <View key={idx} style={styles.featureRow}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={plan.color}
              style={styles.featureIcon}
            />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
        {plan.features.length > 6 && (
          <Text style={styles.moreFeatures}>
            +{plan.features.length - 6} more features
          </Text>
        )}
      </View>

      {/* CTA BUTTON */}
      {isCurrentPlan ? (
        <View style={[styles.ctaButton, { backgroundColor: plan.color }]}>
          <Ionicons name="checkmark" size={16} color="#020617" />
          <Text style={styles.ctaButtonText}>Current Plan</Text>
        </View>
      ) : (
        <View style={[styles.ctaButton, styles.upgradeButton]}>
          <Ionicons name="arrow-forward" size={14} color="#38bdf8" />
          <Text style={styles.upgradeButtonText}>Upgrade</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/** ============================================
 * PLAN SELECTOR - HORIZONTAL SCROLL
 * ============================================ */

export const PlanSelector = ({
  currentPlanId = "free",
  onSelectPlan,
  onUpgrade,
  compact = false,
}) => {
  return (
    <ScrollView
      horizontal={true}
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={true}
      scrollIndicatorInsets={{ right: 10 }}
      decelerationRate="fast"
      style={styles.selectorContainer}
      contentContainerStyle={styles.selectorContent}
    >
      {Object.keys(require("../constants/pricing").PRICING_TIERS).map(
        (tierKey) => {
          const planId = require("../constants/pricing").PRICING_TIERS[tierKey]
            .id;
          return (
            <PlanCard
              key={tierKey}
              planId={planId}
              isCurrentPlan={planId === currentPlanId}
              onSelect={onSelectPlan}
              onUpgrade={onUpgrade}
              compact={compact}
            />
          );
        }
      )}
    </ScrollView>
  );
};

/** ============================================
 * UPGRADE PROMPT CARD
 * Call-to-action card for free users
 * ============================================ */

export const UpgradePrompt = ({ currentPlanId, onUpgrade }) => {
  if (currentPlanId === "api" || currentPlanId === "pro" || currentPlanId === "premium") {
    return null; // Don't show for high-tier users
  }

  const nextPlanId = currentPlanId === "free" ? "go" : "plus";
  const nextPlan = getPlanById(nextPlanId);

  return (
    <TouchableOpacity
      style={styles.promptCard}
      onPress={() => onUpgrade?.(nextPlanId)}
    >
      <View style={styles.promptContent}>
        <Ionicons name="sparkles" size={24} color={nextPlan.color} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.promptTitle}>Unlock {nextPlan.name}</Text>
          <Text style={styles.promptText}>
            Get {nextPlan.limits.messagesPerDay} messages/day, faster responses & more features
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={nextPlan.color} />
    </TouchableOpacity>
  );
};

/** ============================================
 * QUOTA STATUS BAR
 * Show usage progress for daily limits
 * ============================================ */

export const QuotaStatusBar = ({ used, limit, label, color = "#38bdf8" }) => {
  if (limit === Infinity) {
    return (
      <View style={styles.quotaBar}>
        <View style={styles.quotaLabel}>
          <Text style={styles.quotaLabelText}>{label}</Text>
          <Text style={styles.quotaValue}>Unlimited</Text>
        </View>
      </View>
    );
  }

  const percentage = Math.min((used / limit) * 100, 100);
  const isWarning = percentage > 80;
  const isDanger = percentage > 95;

  return (
    <View style={styles.quotaBar}>
      <View style={styles.quotaLabel}>
        <Text style={styles.quotaLabelText}>{label}</Text>
        <Text style={[styles.quotaValue, { color: isDanger ? "#ef4444" : color }]}>
          {used} / {limit}
        </Text>
      </View>
      <View
        style={[
          styles.quotaBackground,
          { backgroundColor: isDanger ? "rgba(239,68,68,0.2)" : "rgba(56,189,248,0.2)" },
        ]}
      >
        <View
          style={[
            styles.quotaFill,
            {
              width: `${percentage}%`,
              backgroundColor: isDanger ? "#ef4444" : isWarning ? "#f59e0b" : color,
            },
          ]}
        />
      </View>
    </View>
  );
};

/** ============================================
 * PLAN COMPARISON
 * Side-by-side feature comparison
 * ============================================ */

export const PlanComparison = ({ fromPlanId, toPlanId }) => {
  const fromPlan = getPlanById(fromPlanId);
  const toPlan = getPlanById(toPlanId);

  const features = [
    { key: "messagesPerDay", label: "Messages/Day" },
    { key: "voiceRequestsPerDay", label: "Voice Requests/Day" },
    { key: "maxFileSize", label: "Max File Size (MB)" },
    { key: "advancedAgents", label: "Advanced Agents" },
    { key: "prioritySupport", label: "Priority Support" },
  ];

  return (
    <View style={styles.comparisonContainer}>
      <Text style={styles.comparisonTitle}>Plan Comparison</Text>
      {features.map((feature, idx) => {
        const fromValue = fromPlan.limits[feature.key];
        const toValue = toPlan.limits[feature.key];

        return (
          <View key={idx} style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>{feature.label}</Text>
            <View style={styles.comparisonValues}>
              <Text style={styles.comparisonValueFrom}>
                {typeof fromValue === "boolean"
                  ? fromValue
                    ? "✓"
                    : "✗"
                  : fromValue === Infinity
                  ? "∞"
                  : fromValue}
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#38bdf8" />
              <Text style={[styles.comparisonValueTo, { color: toPlan.color }]}>
                {typeof toValue === "boolean"
                  ? toValue
                    ? "✓"
                    : "✗"
                  : toValue === Infinity
                  ? "∞"
                  : toValue}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

/** ============================================
 * BILLING HISTORY
 * Placeholder for payment history
 * ============================================ */

export const BillingHistory = ({ transactions = [] }) => {
  if (transactions.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="receipt" size={48} color="rgba(56,189,248,0.3)" />
        <Text style={styles.emptyStateText}>No billing history yet</Text>
      </View>
    );
  }

  return (
    <View>
      {transactions.map((tx, idx) => (
        <View key={idx} style={styles.transactionRow}>
          <View>
            <Text style={styles.transactionPlan}>{tx.planName}</Text>
            <Text style={styles.transactionDate}>{tx.date}</Text>
          </View>
          <Text style={[styles.transactionAmount, { color: tx.color }]}>
            {tx.currency}{tx.amount}
          </Text>
        </View>
      ))}
    </View>
  );
};

/** ============================================
 * STYLES
 * ============================================ */

const styles = StyleSheet.create({
  /* PLAN CARD */
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 18,
    marginBottom: 4,
    minWidth: 280,
    width: 280,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },

  cardActive: {
    borderWidth: 2,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  cardName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#e2e8f0",
  },

  cardTagline: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },

  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  currentBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#020617",
  },

  pricingSection: {
    marginBottom: 16,
  },

  price: {
    fontSize: 28,
    fontWeight: "800",
    color: "#e2e8f0",
  },

  subtext: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },

  featuresSection: {
    marginBottom: 16,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  featureIcon: {
    marginRight: 8,
  },

  featureText: {
    fontSize: 13,
    color: "#cbd5e1",
    flex: 1,
  },

  moreFeatures: {
    fontSize: 12,
    color: "#38bdf8",
    marginTop: 8,
    fontWeight: "600",
  },

  ctaButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  ctaButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#020617",
  },

  upgradeButton: {
    backgroundColor: "rgba(56,189,248,0.1)",
    borderWidth: 2,
    borderColor: "#38bdf8",
  },

  upgradeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#38bdf8",
  },

  /* COMPACT CARD */
  compactCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#0f172a",
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  compactCardActive: {
    backgroundColor: "#38bdf8",
    borderColor: "#38bdf8",
  },

  compactName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#e2e8f0",
  },

  compactPrice: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },

  /* SELECTOR */
  selectorContainer: {
    flex: 1,
    paddingVertical: 12,
  },

  selectorContent: {
    paddingHorizontal: 8,
    gap: 12,
  },

  /* PROMPT CARD */
  promptCard: {
    backgroundColor: "rgba(56,189,248,0.1)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.3)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  promptContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  promptTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e2e8f0",
  },

  promptText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },

  /* QUOTA */
  quotaBar: {
    marginBottom: 12,
  },

  quotaLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  quotaLabelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },

  quotaValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#e2e8f0",
  },

  quotaBackground: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },

  quotaFill: {
    height: "100%",
    borderRadius: 3,
  },

  /* COMPARISON */
  comparisonContainer: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.1)",
  },

  comparisonTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 12,
  },

  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },

  comparisonLabel: {
    fontSize: 12,
    color: "#94a3b8",
    flex: 1,
  },

  comparisonValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  comparisonValueFrom: {
    fontSize: 12,
    color: "#64748b",
  },

  comparisonValueTo: {
    fontSize: 12,
    fontWeight: "700",
  },

  /* EMPTY STATE */
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },

  emptyStateText: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 12,
  },

  /* BILLING */
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },

  transactionPlan: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e2e8f0",
  },

  transactionDate: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },

  transactionAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
});

export default PlanCard;
