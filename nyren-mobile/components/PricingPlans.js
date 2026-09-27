import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PRICING_TIERS } from "../constants/pricing";

export default function PricingPlans({ currentPlan, onSelectPlan }) {
  const renderPlanCard = ({ item: [planId, plan] }) => {
    const isCurrentPlan = currentPlan === planId;

    return (
      <View
        style={[
          styles.planCard,
          isCurrentPlan && { borderColor: plan.color, borderWidth: 2 },
        ]}
      >
        {/* BADGE */}
        {plan.badge && (
          <View style={[styles.badge, { backgroundColor: plan.color }]}>
            <Text style={styles.badgeText}>{plan.badge}</Text>
          </View>
        )}

        {/* HEADER */}
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.description}>{plan.description}</Text>

        {/* PRICE */}
        <View style={styles.priceBox}>
          <Text style={[styles.price, { color: plan.color }]}>
            {plan.currency}
            {plan.price}
          </Text>
          <Text style={styles.period}>/month</Text>
        </View>

        {/* FEATURES */}
        <View style={styles.featuresList}>
          {plan.features.map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={plan.color}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* CTA BUTTON */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            isCurrentPlan && { backgroundColor: plan.color },
          ]}
          onPress={() => onSelectPlan && onSelectPlan(planId)}
        >
          <Text
            style={[
              styles.ctaText,
              isCurrentPlan && { color: "#fff", fontWeight: "700" },
            ]}
          >
            {isCurrentPlan ? "✓ Current Plan" : "Upgrade"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.container}
    >
      <FlatList
        data={Object.entries(PRICING_TIERS)}
        renderItem={renderPlanCard}
        keyExtractor={([id]) => id}
        scrollEnabled={false}
        numColumns={7}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, padding: 12 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },

  planCard: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 16,
    minWidth: 280,
    marginBottom: 12,
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  planName: {
    color: "#38bdf8",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },

  description: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 12,
  },

  priceBox: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },

  price: {
    fontSize: 32,
    fontWeight: "700",
    marginRight: 4,
  },

  period: {
    color: "#64748b",
    fontSize: 12,
  },

  featuresList: {
    marginBottom: 16,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  featureText: {
    color: "#cbd5e1",
    fontSize: 12,
    flex: 1,
  },

  ctaButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#38bdf8",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  ctaText: {
    color: "#38bdf8",
    fontWeight: "600",
    fontSize: 14,
  },
});
