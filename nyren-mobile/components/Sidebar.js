import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { PRICING_TIERS, getPlanById } from "../constants/pricing";

export default function Sidebar({ isOpen, onClose, onNewChat, currentPlan = "free", onOpenSettings, onLogout }) {
  const translateX = useSharedValue(-280);
  const opacity = useSharedValue(0);
  const [planData, setPlanData] = useState(PRICING_TIERS.FREE);

  useEffect(() => {
    const plan = getPlanById(currentPlan);
    setPlanData(plan);
  }, [currentPlan]);

  useEffect(() => {
    if (isOpen) {
      translateX.value = withTiming(0, { duration: 250 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateX.value = withTiming(-280, { duration: 250 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOpen]);

  const sidebarAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayAnim = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePlanSelect = (planId) => {
    onOpenSettings?.(planId);
    onClose();
  };

  return (
    <>
      {/* OVERLAY */}
      {isOpen && (
        <Animated.View style={[styles.overlay, overlayAnim]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
      )}

      {/* SIDEBAR */}
      <Animated.View style={[styles.sidebar, sidebarAnim]}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* TOP BAR */}
          <View style={styles.topBar}>
            <Text style={styles.title}>COLI</Text>

            {/* X CLOSE BUTTON */}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#38bdf8" />
            </TouchableOpacity>
          </View>

          {/* USER STATUS */}
          <View style={styles.userBox}>
            <View style={styles.statusDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>Mobile User</Text>
              <Text style={[styles.userStatus, { color: planData.color }]}>
                Online • {planData.name}
              </Text>
            </View>
          </View>

          {/* PLAN BADGE */}
          <TouchableOpacity
            style={[styles.planBadge, { borderColor: planData.color }]}
            onPress={onOpenSettings}
          >
            <Text style={[styles.planBadgeText, { color: planData.color }]}>
              {planData.badge}
            </Text>
            <Ionicons name="arrow-up-circle" size={14} color={planData.color} />
          </TouchableOpacity>

          {/* DIVIDER */}
          <View style={styles.divider} />

          {/* QUICK ACTIONS */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
            
            <TouchableOpacity style={styles.itemBtn} onPress={() => { onNewChat(); onClose(); }}>
              <Ionicons name="add-circle" size={18} color="#38bdf8" style={{ marginRight: 10 }} />
              <Text style={styles.item}>New Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.itemBtn} onPress={() => { onOpenSettings(); onClose(); }}>
              <Ionicons name="cog" size={18} color="#94a3b8" style={{ marginRight: 10 }} />
              <Text style={styles.item}>Settings</Text>
            </TouchableOpacity>
          </View>

          {/* DIVIDER */}
          <View style={styles.divider} />

          {/* PLANS SECTION - SCROLLABLE */}
          <View style={styles.plansSectionContainer}>
            <Text style={styles.sectionLabel}>COLI PLANS</Text>
            
            <ScrollView 
              style={styles.plansScrollContainer}
              showsVerticalScrollIndicator={true}
              scrollIndicatorInsets={{ right: 1 }}
            >
              {Object.values(PRICING_TIERS)
                .sort((a, b) => a.tier - b.tier)
                .map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planItem,
                      currentPlan === plan.id && styles.planItemActive,
                      { borderColor: currentPlan === plan.id ? plan.color : "transparent" },
                    ]}
                    onPress={() => handlePlanSelect(plan.id)}
                  >
                    <View style={[styles.planIcon, { backgroundColor: plan.color }]}>
                      {currentPlan === plan.id && (
                        <Ionicons name="checkmark" size={12} color="#020617" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planPrice}>
                        {plan.id === "free"
                          ? "Free"
                          : plan.id === "api"
                          ? "Usage-based"
                          : `$${plan.price}/mo`}
                      </Text>
                    </View>
                    <View style={[styles.planBadgeSmall, { backgroundColor: plan.color }]}>
                      <Text style={styles.planBadgeSmallText}>{plan.badge}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>

          {/* DIVIDER */}
          <View style={styles.divider} />

          {/* OTHER ACTIONS */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.itemBtn}>
              <Ionicons name="help-circle" size={18} color="#94a3b8" style={{ marginRight: 10 }} />
              <Text style={styles.item}>Help & Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.itemBtn}
              onPress={() => {
                onLogout?.();
                onClose();
              }}
            >
              <Ionicons name="log-out" size={18} color="#ef4444" style={{ marginRight: 10 }} />
              <Text style={[styles.item, { color: '#ef4444' }]}>Logout</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 10,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 290,
    backgroundColor: '#020617',
    paddingTop: 18,
    zIndex: 20,
    borderRightWidth: 1,
    borderRightColor: 'rgba(56, 189, 248, 0.2)',
    ...Platform.select({
      web: { boxShadow: '6px 0 24px rgba(0,0,0,0.25)' },
      default: { shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 6, height: 0 }, shadowRadius: 24, elevation: 16 },
    }),
  },
  /* TOP HEADER */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 18,
  },
  title: {
    color: '#38bdf8',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  /* USER STATUS */
  userBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    marginBottom: 20,
    marginHorizontal: 18,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    marginRight: 10,
    ...Platform.select({
      web: { boxShadow: '0px 0px 10px rgba(34,197,94,0.75)' },
      default: {
        shadowColor: '#22c55e',
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
    }),
  },
  userName: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  userStatus: {
    color: '#38bdf8',
    fontSize: 11,
    marginTop: 2,
  },
  /* PLAN BADGE */
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
    marginBottom: 16,
    marginHorizontal: 18,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
    color: '#e2e8f0',
  },
  /* DIVIDER */
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 18,
    marginVertical: 14,
  },
  /* SECTION */
  section: {
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  /* ACTION BUTTONS */
  itemBtn: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  item: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  /* PLANS SECTION */
  plansSectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 18,
    maxHeight: 320,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.16)',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 10px 20px rgba(0,0,0,0.14)' },
      default: { shadowColor: '#000', shadowOpacity: 0.14, shadowOffset: { width: 0, height: 10 }, shadowRadius: 20, elevation: 6 },
    }),
  },
  plansScrollContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderLeftWidth: 3,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'transparent',
  },
  planItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderLeftColor: '#38bdf8',
  },
  planIcon: {
    width: 26,
    height: 26,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  planPrice: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  planBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planBadgeSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#020617',
  },
});