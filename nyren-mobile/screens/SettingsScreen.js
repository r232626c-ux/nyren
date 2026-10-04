import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Share,
  FlatList,
  Animated,
  Vibration,
  Dimensions,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import NeonHeader from '../components/NeonHeader';
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import apiService from "../services/apiService";
import { useAuth } from "../src/contexts/AuthContext";
import billingService from "../services/billingService";
import { PRICING_TIERS, getPlanById, formatPrice } from "../constants/pricing";
import {
  PlanSelector,
  UpgradePrompt,
  QuotaStatusBar,
  PlanComparison,
  BillingHistory,
} from "../components/SubscriptionUI";

const { width } = Dimensions.get("window");

export default function SettingsScreen({ route, navigation }) {
  /* ========== SETTINGS STATE ========== */
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [avatarEnabled, setAvatarEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [personality, setPersonality] = useState("balanced");
  const [bgGradient, setBgGradient] = useState(['#080E1D', '#070A16']);

  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { user, logout } = useAuth();

  const GITHUB_PROJECT_URL = 'https://github.com';

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Sign out of Coli and return to login?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  /* ========== BILLING STATE ========== */
  const [currentPlan, setCurrentPlan] = useState("free");
  const [billingState, setBillingState] = useState(null);
  const [todayUsage, setTodayUsage] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [loadingBilling, setLoadingBilling] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState(null);

  /* ========== ANIMATIONS ========== */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  /* ========== OFFLINE STORAGE ========== */
  const SETTINGS_KEY = "coli_settings";
  const BILLING_CACHE_KEY = "coli_billing_cache";

  useEffect(() => {
    initializeApp();
    setupAnimations();
  }, []);

  useEffect(() => {
    const selectedPlanId = route?.params?.selectedPlanId;
    if (selectedPlanId && selectedPlanId !== currentPlan) {
      setSelectedUpgradePlan(selectedPlanId);
      setShowPaymentMethods(true);
      navigation?.setParams?.({ selectedPlanId: null });
    }
  }, [route?.params?.selectedPlanId, currentPlan, navigation]);

  const initializeApp = async () => {
    await loadLocalSettings();
    await checkConnectivity();
    loadBillingData();
  };

  const setupAnimations = () => {
    const useNative = Platform.OS !== "web";
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: useNative,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: useNative,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: useNative,
      }),
    ]).start();
  };

  const checkConnectivity = async () => {
    const netInfo = await NetInfo.fetch();
    setIsOnline(netInfo.isConnected);
  };

  const loadLocalSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        setVoiceEnabled(settings.voiceEnabled ?? true);
        setAvatarEnabled(settings.avatarEnabled ?? true);
        setNotificationsEnabled(settings.notificationsEnabled ?? true);
        setAutoSaveEnabled(settings.autoSaveEnabled ?? true);
        setPersonality(settings.personality ?? "balanced");
      }
    } catch (e) {
      console.error("Failed to load local settings:", e);
    }
  };

  const saveSettingsLocally = async (settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      if (!isOnline) {
        showOfflineToast("Settings saved locally. Will sync when online.");
      }
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  const syncSettingsOnline = async () => {
    if (!isOnline) return;

    setSyncing(true);
    try {
      // Sync settings to backend when online
      const currentSettings = {
        voiceEnabled,
        avatarEnabled,
        notificationsEnabled,
        autoSaveEnabled,
        personality,
      };

      // Here you would typically send to backend
      // await apiService.updateUserSettings(currentSettings);

      showSuccessToast("Settings synced successfully!");
    } catch (e) {
      console.error("Failed to sync settings:", e);
    } finally {
      setSyncing(false);
    }
  };

  const loadBillingData = async () => {
    try {
      setLoadingBilling(true);

      // Try to load from cache first
      const cached = await AsyncStorage.getItem(BILLING_CACHE_KEY);
      if (cached && !isOnline) {
        const cache = JSON.parse(cached);
        setBillingState(cache.billingState);
        setTodayUsage(cache.todayUsage);
        setPlanDetails(cache.planDetails);
        setCurrentPlan(cache.currentPlan);
        return;
      }

      const state = await billingService.getBillingState();
      const usage = await billingService.getTodayUsage();
      const details = await billingService.getCurrentPlanDetails();

      setBillingState(state);
      setTodayUsage(usage);
      setPlanDetails(details);
      setCurrentPlan(state.currentPlan);

      // Cache the data
      const cacheData = { billingState: state, todayUsage: usage, planDetails: details, currentPlan: state.currentPlan };
      await AsyncStorage.setItem(BILLING_CACHE_KEY, JSON.stringify(cacheData));

    } catch (e) {
      console.error("Failed to load billing data:", e);
      // Load from cache if available
      const cached = await AsyncStorage.getItem(BILLING_CACHE_KEY);
      if (cached) {
        const cache = JSON.parse(cached);
        setBillingState(cache.billingState);
        setTodayUsage(cache.todayUsage);
        setPlanDetails(cache.planDetails);
        setCurrentPlan(cache.currentPlan);
      }
    } finally {
      setLoadingBilling(false);
    }
  };

  const showOfflineToast = (message) => {
    // You could implement a toast system here
    Alert.alert("Offline Mode", message, [{ text: "OK" }]);
  };

  const showSuccessToast = (message) => {
    Alert.alert("Success", message, [{ text: "OK" }]);
  };

  const showErrorToast = (message) => {
    Alert.alert("Error", message, [{ text: "OK" }]);
  };

  const handleSettingChange = async (setting, value) => {
    Vibration.vibrate(50);

    // Update local state
    switch (setting) {
      case "voice":
        setVoiceEnabled(value);
        break;
      case "avatar":
        setAvatarEnabled(value);
        break;
      case "notifications":
        setNotificationsEnabled(value);
        break;
      case "autoSave":
        setAutoSaveEnabled(value);
        break;
    }

    // Save locally
    const currentSettings = {
      voiceEnabled: setting === "voice" ? value : voiceEnabled,
      avatarEnabled: setting === "avatar" ? value : avatarEnabled,
      notificationsEnabled: setting === "notifications" ? value : notificationsEnabled,
      autoSaveEnabled: setting === "autoSave" ? value : autoSaveEnabled,
      personality,
    };

    await saveSettingsLocally(currentSettings);

    // Sync online if connected
    if (isOnline && !syncing) {
      syncSettingsOnline();
    }
  };

  const handlePersonalityChange = async (newPersonality) => {
    Vibration.vibrate(50);
    setPersonality(newPersonality);

    const currentSettings = {
      voiceEnabled,
      avatarEnabled,
      notificationsEnabled,
      autoSaveEnabled,
      personality: newPersonality,
    };

    await saveSettingsLocally(currentSettings);

    if (isOnline && !syncing) {
      syncSettingsOnline();
    }
  };

  const resetMemory = () => {
    Alert.alert(
      "Reset Memory",
      "This will erase all stored conversations and preferences. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Vibration.vibrate([0, 200, 100, 200]);
              Alert.alert("Success", "All data has been reset. The app will restart.", [
                {
                  text: "OK",
                  onPress: () => {
                    // Reset all state
                    setVoiceEnabled(true);
                    setAvatarEnabled(true);
                    setNotificationsEnabled(true);
                    setAutoSaveEnabled(true);
                    setPersonality("balanced");
                    setCurrentPlan("free");
                    setBillingState(null);
                    setTodayUsage(null);
                    setPlanDetails(null);
                  },
                },
              ]);
            } catch (e) {
              Alert.alert("Error", "Failed to reset data");
            }
          },
        },
      ]
    );
  };

  /* ========== BILLING HANDLERS ========== */

  const handleUpgradeplan = async (planId) => {
    if (planId !== "free") {
      setSelectedUpgradePlan(planId);
      setShowPaymentMethods(true);
      return;
    }
    const result = await billingService.upgradePlan(planId);
    if (result.success) {
      Alert.alert("Success", result.message, [
        {
          text: "OK",
          onPress: () => {
            setCurrentPlan(planId);
            loadBillingData();
          },
        },
      ]);
    } else {
      Alert.alert("Error", result.error);
    }
  };

  const openExternalUrl = async (url) => {
    if (!url) {
      Alert.alert('Checkout Error', 'No payment URL was returned.');
      return false;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    }

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Cannot Open Checkout', 'Your device cannot open the payment link.');
      return false;
    }

    await Linking.openURL(url);
    return true;
  };

  const openProjectGitHub = async () => {
    try {
      const canOpen = await Linking.canOpenURL(GITHUB_PROJECT_URL);
      if (canOpen) {
        await Linking.openURL(GITHUB_PROJECT_URL);
        return;
      }
      await Share.share({
        message: `Check out this project on GitHub: ${GITHUB_PROJECT_URL}`,
        url: GITHUB_PROJECT_URL,
      });
    } catch (error) {
      await Share.share({
        message: `Check out this project on GitHub: ${GITHUB_PROJECT_URL}`,
        url: GITHUB_PROJECT_URL,
      });
    }
  };

  const shareProjectLink = async () => {
    try {
      await Share.share({
        message: `Check out this project on GitHub: ${GITHUB_PROJECT_URL}`,
        url: GITHUB_PROJECT_URL,
      });
    } catch (error) {
      console.warn('[SettingsScreen] Share project link failed:', error);
    }
  };

  const processPaymentWithMethod = async (method) => {
    if (!selectedUpgradePlan) return;
    
    let result;
    try {
      switch (method) {
        case "stripe":
          result = await billingService.initiateStripePayment(selectedUpgradePlan);
          break;
        case "flutterwave":
          result = await billingService.initiateFlutterwavePayment(selectedUpgradePlan);
          break;
        default:
          result = { success: false, error: "Unknown payment method" };
      }

      if (result.success && result.url) {
        const opened = await openExternalUrl(result.url);
        if (opened) {
          setShowPaymentMethods(false);
          setPaymentMethod(method);
          setSelectedUpgradePlan(null);
          Alert.alert("Checkout Opened", `Your ${method} checkout has been opened in the browser.`);
          return;
        }
      }

      if (result.success) {
        setShowPaymentMethods(false);
        setPaymentMethod(method);
        Alert.alert("Payment Initiated", `Your ${method} payment has been initiated for ${getPlanById(selectedUpgradePlan).name}.`);
        setSelectedUpgradePlan(null);
      } else {
        Alert.alert("Payment Error", result.error || "Payment failed");
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleDowngradePlan = async (planId) => {
    Alert.alert(
      "Downgrade Plan",
      "Are you sure you want to downgrade? Some features may become unavailable.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Downgrade",
          style: "destructive",
          onPress: async () => {
            const result = await billingService.downgradePlan(planId);
            if (result.success) {
              setCurrentPlan(planId);
              loadBillingData();
            }
          },
        },
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      "Cancel Subscription",
      "You will be reverted to the Free plan. Continue?",
      [
        { text: "Keep Plan", style: "cancel" },
        {
          text: "Cancel Subscription",
          style: "destructive",
          onPress: async () => {
            const result = await billingService.cancelSubscription();
            if (result.success) {
              setCurrentPlan("free");
              loadBillingData();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={bgGradient}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.heroGlow, { transform: [{ scale: pulseAnim }], opacity: Platform.OS !== 'web' ? 0.6 : 0.28 }]}
      />
      <Animated.View pointerEvents="none" style={[styles.heroGlowSecondary, { opacity: 0.12 }]} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.getParent?.()?.openDrawer?.()} style={styles.menuBtn}>
          <Ionicons name="menu" size={24} color="#38bdf8" />
        </TouchableOpacity>
      </View>
    <Animated.ScrollView
      style={[styles.container, { opacity: fadeAnim }]}
      showsVerticalScrollIndicator={true}
    >
      {/* OFFLINE BANNER */}
      {!isOnline && (
        <Animated.View
          style={[styles.offlineBanner, { transform: [{ translateY: slideAnim }] }]}
        >
          <Ionicons name="cloud-offline" size={20} color="#fbbf24" />
          <Text style={styles.offlineText}>You're offline. Some features may be limited.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              Vibration.vibrate(50);
              checkConnectivity();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* HEADER */}
      <Animated.View style={[styles.header, { transform: [{ translateY: slideAnim }] }]}>
        <NeonHeader title="Settings" subtitle="Account, plans & personalization" />

        {/* SYNC STATUS */}
        {syncing && (
          <View style={styles.syncIndicator}>
            <ActivityIndicator size="small" color="#38bdf8" />
            <Text style={styles.syncText}>Syncing...</Text>
          </View>
        )}
      </Animated.View>

      {/* Live Preview + Theme Selector */}
      <Animated.View style={[styles.previewCard, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.previewRow}>
          <View style={styles.previewAvatar}>
            <Text style={styles.previewAvatarText}>{(user?.name || 'U').charAt(0)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.previewName}>{user?.name || user?.email || 'Mobile User'}</Text>
            <Text style={styles.previewMeta}>Plan: {getPlanById(currentPlan).name} • {personality}</Text>
          </View>
          <TouchableOpacity style={styles.previewAction} onPress={() => { Vibration.vibrate(50); navigation.navigate('Profile'); }}>
            <Ionicons name="person-circle" size={28} color="#38bdf8" />
          </TouchableOpacity>
        </View>

        <View style={styles.previewControls}>
          <View style={styles.chipsRow}>
            {['#080E1D,#070A16,Midnight','#0B1024,#082033,Dawn','#06121A,#0A2234,Aurora'].map((c, i) => {
              const parts = c.split(',');
              const colors = [parts[0], parts[1]];
              const label = parts[2];
              const active = bgGradient[0] === colors[0];
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.themeChip, active && styles.themeChipActive]}
                  onPress={() => { setBgGradient(colors); Vibration.vibrate(40); }}
                >
                  <View style={[styles.themePreviewDot, { backgroundColor: colors[0] }]} />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionSubtitle}>Live preview: toggles reflect your current settings</Text>
            <View style={[styles.detailItem, { marginTop: 10 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.settingText}>Voice Assistant</Text>
                <Switch value={voiceEnabled} onValueChange={(v) => handleSettingChange('voice', v)} />
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ========== SUBSCRIPTION SECTION ========== */}
      <Animated.View style={[styles.subscriptionContainer, { transform: [{ scale: scaleAnim }] }]}>
        <ScrollView
          style={styles.subscriptionScrollView}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.subscriptionContent}
        >
          {loadingBilling ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#38bdf8" />
              <Text style={styles.loadingText}>Loading your plan...</Text>
            </View>
          ) : (
            <>
              {/* CURRENT PLAN OVERVIEW */}
              <View style={styles.currentPlanCard}>
                <View style={styles.currentPlanHeader}>
                  <View>
                    <Text style={styles.currentPlanLabel}>Your Current Plan</Text>
                    <Text style={[styles.currentPlanName, { color: getPlanById(currentPlan).color }]}>
                      {getPlanById(currentPlan).name}
                    </Text>
                  </View>
                  <View style={[styles.planBadge, { backgroundColor: getPlanById(currentPlan).color }]}>
                    <Text style={styles.planBadgeText}>{getPlanById(currentPlan).badge}</Text>
                  </View>
                </View>

                {planDetails && (
                  <>
                    <Text style={styles.planDescription}>
                      {getPlanById(currentPlan).description}
                    </Text>

                    {/* DAILY USAGE QUOTAS */}
                    <View style={styles.quotasContainer}>
                      <Text style={styles.quotasTitle}>Daily Usage</Text>
                      <QuotaStatusBar
                        label="Messages"
                        used={planDetails.usage?.messagesUsedToday || 0}
                        limit={planDetails.quotaStatus?.messages?.limit}
                        color={getPlanById(currentPlan).color}
                      />
                      <QuotaStatusBar
                        label="Voice Requests"
                        used={planDetails.usage?.voiceUsedToday || 0}
                        limit={planDetails.quotaStatus?.voice?.limit}
                        color={getPlanById(currentPlan).color}
                      />
                    </View>

                    {/* BILLING CYCLE */}
                    <View style={styles.billingCycleBox}>
                      <View style={styles.billingCycleRow}>
                        <Text style={styles.billingCycleLabel}>Billing Cycle</Text>
                        <Text style={styles.billingCycleDate}>
                          {billingState?.billingCycleStart
                            ? new Date(billingState.billingCycleStart).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : "-"}{" "}
                          to{" "}
                          {billingState?.billingCycleEnd
                            ? new Date(billingState.billingCycleEnd).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : "-"}
                        </Text>
                      </View>
                      <View style={styles.billingCycleRow}>
                        <Text style={styles.billingCycleLabel}>Monthly Cost</Text>
                        <Text style={[styles.billingCyclePrice, { color: getPlanById(currentPlan).color }]}>
                          {getPlanById(currentPlan).id === "free"
                            ? "Free"
                            : getPlanById(currentPlan).id === "api"
                            ? "Usage-based"
                            : `$${getPlanById(currentPlan).price}/month`}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>

              {/* UPGRADE PROMPT */}
              <UpgradePrompt currentPlanId={currentPlan} onUpgrade={handleUpgradeplan} />

              {/* PLAN SELECTOR - VERTICAL SCROLLABLE */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Available Plans</Text>
                  <Text style={styles.sectionSubtitle}>Scroll down to explore all tiers</Text>
                </View>
                <View style={styles.planSelectorWrapper}>
                  <ScrollView
                    style={styles.verticalPlanSelector}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.verticalPlanContent}
                  >
                    {Object.keys(PRICING_TIERS).map((tierKey) => {
                      const planId = PRICING_TIERS[tierKey].id;
                      return (
                        <View key={tierKey} style={styles.planCardWrapper}>
                          <TouchableOpacity
                            style={[
                              styles.planCard,
                              planId === currentPlan && styles.planCardActive,
                              { borderColor: planId === currentPlan ? getPlanById(planId).color : "rgba(255,255,255,0.1)" }
                            ]}
                            onPress={() => {
                              Vibration.vibrate(50);
                              if (planId === currentPlan) return;
                              if (planId === "free") {
                                handleDowngradePlan(planId);
                              } else {
                                handleUpgradeplan(planId);
                              }
                            }}
                            activeOpacity={0.8}
                          >
                            {/* Plan Header */}
                            <View style={styles.planCardHeader}>
                              <View>
                                <Text style={styles.planCardName}>{getPlanById(planId).name}</Text>
                                <Text style={styles.planCardTagline}>{getPlanById(planId).tagline}</Text>
                              </View>
                              {planId === currentPlan && (
                                <View style={[styles.currentBadge, { backgroundColor: getPlanById(planId).color }]}>
                                  <Text style={styles.currentBadgeText}>✓ Current</Text>
                                </View>
                              )}
                            </View>

                            {/* Plan Pricing */}
                            <View style={styles.planCardPricing}>
                              {planId === "api" ? (
                                <>
                                  <Text style={styles.planCardPrice}>Usage-based</Text>
                                  <Text style={styles.planCardSubtext}>Custom pricing available</Text>
                                </>
                              ) : (
                                <>
                                  <Text style={[styles.planCardPrice, { color: getPlanById(planId).color }]}>
                                    {getPlanById(planId).id === "free"
                                      ? "Free"
                                      : `$${getPlanById(planId).price}/month`}
                                  </Text>
                                  <Text style={styles.planCardSubtext}>{getPlanById(planId).description}</Text>
                                </>
                              )}
                            </View>

                            {/* Plan Features */}
                            <View style={styles.planCardFeatures}>
                              {getPlanById(planId).features.slice(0, 4).map((feature, idx) => (
                                <View key={idx} style={styles.planCardFeatureRow}>
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={14}
                                    color={getPlanById(planId).color}
                                    style={styles.planCardFeatureIcon}
                                  />
                                  <Text style={styles.planCardFeatureText}>{feature}</Text>
                                </View>
                              ))}
                              {getPlanById(planId).features.length > 4 && (
                                <Text style={styles.planCardMoreFeatures}>
                                  +{getPlanById(planId).features.length - 4} more features
                                </Text>
                              )}
                            </View>

                            {/* CTA Button */}
                            {planId === currentPlan ? (
                              <View style={[styles.planCardCtaButton, { backgroundColor: getPlanById(planId).color }]}>
                                <Ionicons name="checkmark" size={16} color="#020617" />
                                <Text style={styles.planCardCtaButtonText}>Current Plan</Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={[styles.planCardCtaButton, styles.planCardUpgradeButton]}
                                onPress={() => {
                                  Vibration.vibrate(50);
                                  if (planId === "free") {
                                    handleDowngradePlan(planId);
                                  } else {
                                    handleUpgradeplan(planId);
                                  }
                                }}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="arrow-forward" size={14} color="#38bdf8" />
                                <Text style={styles.planCardUpgradeButtonText}>
                                  {planId === "free" ? "Downgrade" : "Upgrade"}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              {/* PAYMENT METHODS MODAL */}
              {showPaymentMethods && (
                <View style={styles.paymentMethodsOverlay}>
                  <View style={styles.paymentMethodsCard}>
                    <View style={styles.paymentHeader}>
                      <View>
                        <Text style={styles.paymentTitle}>Select Payment Method</Text>
                        <Text style={styles.paymentSubtitle}>Choose how you'd like to pay for this plan</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          Vibration.vibrate(50);
                          setShowPaymentMethods(false);
                        }}
                        style={styles.closeButton}
                      >
                        <Ionicons name="close" size={24} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.paymentMethodsList} showsVerticalScrollIndicator={false}>
                      <TouchableOpacity
                        style={[styles.paymentMethodBtn, paymentMethod === "stripe" && styles.paymentMethodBtnActive]}
                        onPress={() => {
                          Vibration.vibrate(50);
                          setPaymentMethod("stripe");
                          processPaymentWithMethod("stripe");
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="card" size={24} color="#38bdf8" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.paymentMethodName}>Stripe</Text>
                          <Text style={styles.paymentMethodDesc}>Credit/Debit Card, Apple Pay, Google Pay</Text>
                        </View>
                        {paymentMethod === "stripe" && <Ionicons name="checkmark-circle" size={20} color="#38bdf8" />}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.paymentMethodBtn, paymentMethod === "flutterwave" && styles.paymentMethodBtnActive]}
                        onPress={() => {
                          Vibration.vibrate(50);
                          setPaymentMethod("flutterwave");
                          processPaymentWithMethod("flutterwave");
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="cash" size={24} color="#1fb6ff" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.paymentMethodName}>Flutterwave</Text>
                          <Text style={styles.paymentMethodDesc}>Local and international card checkout</Text>
                        </View>
                        {paymentMethod === "flutterwave" && <Ionicons name="checkmark-circle" size={20} color="#1fb6ff" />}
                      </TouchableOpacity>
                    </ScrollView>

                    <View style={styles.paymentFooter}>
                      <Text style={styles.paymentInfo}>
                        {`Upgrading to ${getPlanById(selectedUpgradePlan).name} • ${getPlanById(selectedUpgradePlan).price ? `$${getPlanById(selectedUpgradePlan).price}/month` : 'Custom Pricing'}`}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* PLAN DETAILS */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Plan Details</Text>
                <View style={styles.detailsGrid}>
                  {[
                    {
                      label: "Messages/Day",
                      value:
                        getPlanById(currentPlan).limits.messagesPerDay === Infinity
                          ? "Unlimited"
                          : `${getPlanById(currentPlan).limits.messagesPerDay}`,
                    },
                    {
                      label: "Voice/Day",
                      value:
                        getPlanById(currentPlan).limits.voiceRequestsPerDay === Infinity
                          ? "Unlimited"
                          : `${getPlanById(currentPlan).limits.voiceRequestsPerDay}`,
                    },
                    {
                      label: "Max File Size",
                      value:
                        getPlanById(currentPlan).limits.maxFileSize === Infinity
                          ? "Unlimited"
                          : `${getPlanById(currentPlan).limits.maxFileSize}MB`,
                    },
                    {
                      label: "Priority Support",
                      value: getPlanById(currentPlan).limits.prioritySupport ? "✓" : "✗",
                    },
                  ].map((detail, idx) => (
                    <View key={idx} style={styles.detailItem}>
                      <Text style={styles.detailLabel}>{detail.label}</Text>
                      <Text style={styles.detailValue}>{detail.value}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* SUBSCRIPTION ACTIONS */}
              {currentPlan !== "free" && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Subscription</Text>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={handleCancelSubscription}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle" size={18} color="#ef4444" />
                    <Text style={styles.actionButtonDangerText}>Cancel Subscription</Text>
                  </TouchableOpacity>
                  <Text style={styles.cancelNote}>
                    You'll be downgraded to Coli Free immediately
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>

      {/* VOICE & AVATAR */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Voice & Avatar</Text>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => handleSettingChange("voice", !voiceEnabled)}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="mic" size={20} color="#38bdf8" />
            <Text style={styles.settingText}>Voice Input</Text>
          </View>
          <Switch
            value={voiceEnabled}
            onValueChange={(value) => handleSettingChange("voice", value)}
            trackColor={{ false: "#374151", true: "#1e40af" }}
            thumbColor={voiceEnabled ? "#38bdf8" : "#9ca3af"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => handleSettingChange("avatar", !avatarEnabled)}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="person" size={20} color="#38bdf8" />
            <Text style={styles.settingText}>Avatar Display</Text>
          </View>
          <Switch
            value={avatarEnabled}
            onValueChange={(value) => handleSettingChange("avatar", value)}
            trackColor={{ false: "#374151", true: "#1e40af" }}
            thumbColor={avatarEnabled ? "#38bdf8" : "#9ca3af"}
          />
        </TouchableOpacity>
      </View>

      {/* PERSONALITY */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Personality</Text>
        <Text style={styles.cardSubtitle}>Choose how Coli responds to you</Text>

        <View style={styles.chipRow}>
          {["empathetic", "analytical", "enthusiastic", "balanced"].map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.chip,
                personality === p && styles.chipActive,
              ]}
              onPress={() => handlePersonalityChange(p)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  personality === p && styles.chipTextActive,
                ]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* PREFERENCES */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preferences</Text>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => handleSettingChange("notifications", !notificationsEnabled)}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="notifications" size={20} color="#38bdf8" />
            <Text style={styles.settingText}>Push Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={(value) => handleSettingChange("notifications", value)}
            trackColor={{ false: "#374151", true: "#1e40af" }}
            thumbColor={notificationsEnabled ? "#38bdf8" : "#9ca3af"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => handleSettingChange("autoSave", !autoSaveEnabled)}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="save" size={20} color="#38bdf8" />
            <Text style={styles.settingText}>Auto Save Conversations</Text>
          </View>
          <Switch
            value={autoSaveEnabled}
            onValueChange={(value) => handleSettingChange("autoSave", value)}
            trackColor={{ false: "#374151", true: "#1e40af" }}
            thumbColor={autoSaveEnabled ? "#38bdf8" : "#9ca3af"}
          />
        </TouchableOpacity>
      </View>

      {/* DATA MANAGEMENT */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Data Management</Text>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            Vibration.vibrate(50);
            Share.share({
              message: "Check out my Coli AI conversation data...",
            });
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="share" size={16} color="#38bdf8" style={{ marginRight: 8 }} />
          <Text style={styles.secondaryText}>Export Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { marginTop: 12 }]}
          onPress={openProjectGitHub}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-github" size={16} color="#38bdf8" style={{ marginRight: 8 }} />
          <Text style={styles.secondaryText}>Open GitHub</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { marginTop: 12 }]}
          onPress={shareProjectLink}
          activeOpacity={0.8}
        >
          <Ionicons name="share-social" size={16} color="#38bdf8" style={{ marginRight: 8 }} />
          <Text style={styles.secondaryText}>Share Project</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dangerBtn, { marginTop: 12 }]}
          onPress={resetMemory}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={16} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.dangerText}>Reset All Data</Text>
        </TouchableOpacity>
      </View>

    </Animated.ScrollView>
    </View>
  );


}

/* ---------------- COMPONENT ---------------- */

const SettingRow = ({ label, value, onChange }) => (
  <View style={styles.rowBetween}>
    <Text style={styles.settingText}>{label}</Text>
    <Switch value={value} onValueChange={onChange} />
  </View>
);

/* ============================================
   STYLES
   ============================================ */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  menuBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(56,189,248,0.12)',
  },
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#38bdf8',
    marginBottom: 8,
    letterSpacing: 1,
    ...Platform.select({
      web: { textShadow: '0px 2px 8px rgba(56,189,248,0.35)' },
      default: { textShadowColor: 'rgba(56,189,248,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
    }),
  },

  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },

  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ========== CURRENT PLAN CARD ========== */
  currentPlanCard: {
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.22)',
    ...Platform.select({
      web: { boxShadow: '0px 12px 24px rgba(56,189,248,0.14)' },
      default: { shadowColor: '#38bdf8', shadowOpacity: 0.14, shadowOffset: { width: 0, height: 12 }, shadowRadius: 24, elevation: 6 },
    }),
  },

  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  currentPlanLabel: {
    fontSize: 11,
    color: '#38bdf8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    fontWeight: '700',
  },

  currentPlanName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#e2e8f0',
    letterSpacing: -0.5,
  },

  planBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#38bdf8',
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(56,189,248,0.18)' },
      default: { shadowColor: '#38bdf8', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 },
    }),
  },

  planBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#020617',
    letterSpacing: 0.5,
  },

  planDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 18,
    lineHeight: 20,
  },

  /* ========== QUOTAS ========== */
  quotasContainer: {
    marginBottom: 18,
  },

  quotasTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  /* ========== BILLING CYCLE ========== */
  billingCycleBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8',
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' },
      default: { shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3 },
    }),
  },

  billingCycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  billingCycleLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },

  billingCycleDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
  },

  billingCyclePrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#38bdf8',
  },

  /* ========== PLAN SELECTOR WRAPPER ========== */
  planSelectorWrapper: {
    marginBottom: 0,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.14)',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 10px 16px rgba(0,0,0,0.16)' },
      default: { shadowColor: '#000', shadowOpacity: 0.16, shadowOffset: { width: 0, height: 10 }, shadowRadius: 16, elevation: 4 },
    }),
  },

  /* ========== SECTION CONTAINER ========== */
  sectionContainer: {
    marginBottom: 24,
  },

  sectionHeader: {
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#e2e8f0',
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    lineHeight: 18,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(56,189,248,0.18)',
    marginVertical: 20,
    borderRadius: 1,
  },

  /* ========== PLAN DETAILS ========== */
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },

  detailItem: {
    width: '50%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    textAlign: 'center',
  },

  detailValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#e2e8f0',
    textAlign: 'center',
  },

  /* ========== ACTIONS ========== */
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      web: { boxShadow: '0px 6px 12px rgba(0,0,0,0.12)' },
      default: { shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 3 },
    }),
  },

  actionButtonDanger: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },

  actionButtonDangerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },

  cancelNote: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 32,
    lineHeight: 16,
  },

  /* ========== EXISTING STYLES ========== */
  card: {
    backgroundColor: 'rgba(15,23,42,0.88)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.15)',
    ...Platform.select({
      web: { boxShadow: '0px 10px 18px rgba(0,0,0,0.14)' },
      default: { shadowColor: '#000', shadowOpacity: 0.14, shadowOffset: { width: 0, height: 10 }, shadowRadius: 18, elevation: 4 },
    }),
  },

  cardTitle: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 14,
    letterSpacing: -0.2,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.18)' },
      default: { shadowColor: '#000', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 2 },
    }),
  },

  connected: { backgroundColor: '#22c55e' },
  offline: { backgroundColor: '#ef4444' },
  checking: { backgroundColor: '#facc15' },

  statusText: {
    color: '#94a3b8',
    marginVertical: 10,
    fontSize: 14,
    lineHeight: 18,
  },

  configBox: {
    backgroundColor: 'rgba(2,6,23,0.8)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  label: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  value: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },

  primaryBtn: {
    backgroundColor: '#38bdf8',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 10px 16px rgba(56,189,248,0.18)' },
      default: { shadowColor: '#38bdf8', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 10 }, shadowRadius: 16, elevation: 5 },
    }),
  },

  primaryText: {
    color: '#020617',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },

  secondaryBtn: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(30,41,59,0.8)',
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      web: { boxShadow: '0px 8px 16px rgba(0,0,0,0.12)' },
      default: { shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 3 },
    }),
  },

  secondaryText: {
    color: '#e2e8f0',
    fontWeight: '600',
    fontSize: 14,
  },

  dangerBtn: {
    backgroundColor: '#ef4444',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 10px 16px rgba(239,68,68,0.2)' },
      default: { shadowColor: '#ef4444', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 10 }, shadowRadius: 16, elevation: 5 },
    }),
  },

  dangerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  settingText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '500',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },

  chip: {
    margin: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(2,6,23,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  chipActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },

  chipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },

  chipTextActive: {
    color: '#020617',
    fontWeight: '700',
  },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },

  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* ========== PAYMENT METHODS MODAL ========== */
  paymentMethodsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },

  paymentMethodsCard: {
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '80%',
    borderTopWidth: 2,
    borderColor: 'rgba(56,189,248,0.3)',
    ...Platform.select({
      web: { boxShadow: '0px -8px 20px rgba(0,0,0,0.22)' },
      default: { shadowColor: '#000', shadowOpacity: 0.22, shadowOffset: { width: 0, height: -8 }, shadowRadius: 20, elevation: 8 },
    }),
  },

  paymentHeader: {
    position: 'relative',
    marginBottom: 20,
  },

  paymentTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#e2e8f0',
    letterSpacing: -0.3,
  },

  paymentSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  },

  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },

  paymentMethodsList: {
    maxHeight: 400,
    marginBottom: 16,
  },

  paymentMethodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
    ...Platform.select({
      web: { boxShadow: '0px 6px 12px rgba(0,0,0,0.12)' },
      default: { shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 3 },
    }),
  },

  paymentMethodBtnActive: {
    backgroundColor: 'rgba(56,189,248,0.2)',
    borderColor: 'rgba(56,189,248,0.5)',
    ...Platform.select({
      web: { boxShadow: '0px 6px 14px rgba(56,189,248,0.2)' },
      default: { shadowColor: '#38bdf8', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 4 },
    }),
  },

  paymentMethodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
  },

  paymentMethodDesc: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 16,
  },

  paymentFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 16,
  },

  paymentInfo: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },

  /* ========== SCROLL INDICATOR ========== */
  scrollIndicator: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 12,
  },

  scrollIndicatorText: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  /* ========== SUBSCRIPTION CONTAINER ========== */
  subscriptionContainer: {
    flex: 1,
    maxHeight: 620,
  },

  subscriptionScrollView: {
    flex: 1,
  },

  subscriptionContent: {
    paddingBottom: 20,
  },

  /* ========== VERTICAL PLAN SELECTOR ========== */
  verticalPlanSelector: {
    maxHeight: 420,
  },

  verticalPlanContent: {
    paddingVertical: 24,
  },

  planCardWrapper: {
    marginBottom: 24,
  },

  planCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  planCardActive: {
    backgroundColor: 'rgba(56,189,248,0.12)',
    borderColor: '#38bdf8',
  },

  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  planCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4,
  },

  planCardTagline: {
    fontSize: 14,
    color: '#94a3b8',
  },

  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  currentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#020617',
  },

  planCardPricing: {
    marginBottom: 16,
  },

  planCardPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#38bdf8',
    marginBottom: 4,
  },

  planCardSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },

  planCardFeatures: {
    marginBottom: 16,
  },

  planCardFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  planCardFeatureIcon: {
    marginRight: 10,
  },

  planCardFeatureText: {
    fontSize: 14,
    color: '#cbd5e1',
    flex: 1,
  },

  planCardMoreFeatures: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '600',
    marginTop: 4,
  },

  planCardCtaButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  planCardCtaButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#020617',
  },

  planCardUpgradeButton: {
    backgroundColor: 'rgba(56,189,248,0.12)',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },

  planCardUpgradeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38bdf8',
  },

  /* ========== LIVE PREVIEW ========== */
  heroGlow: {
    position: 'absolute',
    left: -80,
    top: -120,
    width: 420,
    height: 420,
    borderRadius: 220,
    backgroundColor: 'rgba(56,189,248,0.06)',
    zIndex: 0,
  },
  heroGlowSecondary: {
    position: 'absolute',
    right: -120,
    top: -80,
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(59,130,246,0.04)',
    zIndex: 0,
  },
  previewCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(6,8,24,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    zIndex: 2,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  previewAvatarText: {
    color: '#e2e8f0',
    fontWeight: '900',
    fontSize: 20,
  },
  previewName: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 16,
  },
  previewMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  previewAction: {
    padding: 6,
  },
  previewControls: {
    marginTop: 12,
  },
  themeChip: {
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeChipActive: {
    backgroundColor: 'rgba(56,189,248,0.14)',
    borderColor: '#38bdf8',
  },
  themePreviewDot: {
    width: 14,
    height: 14,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },

  accountInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.14)',
  },

  accountLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  accountEmail: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
  },

  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#ef4444',
  },

  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});