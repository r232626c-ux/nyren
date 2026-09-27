import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../theme';
import paymentService from '../../services/paymentService';
import { useAuth } from '../contexts/AuthContext';

const TRUSTED_BY = ['Hospitals', 'Research Labs', 'Universities', 'Biotech Startups'];

const FEATURES = [
  {
    title: 'Clinical Intelligence Engine',
    description: 'Real-time decision support integrated into clinical workflows — source-cited recommendations and explainable steps.',
  },
  {
    title: 'Genomic Data Integration',
    description: 'Process, annotate, and interpret sequencing and biomarker data with domain-aware AI workflows.',
  },
  {
    title: 'Smart Laboratory System (LIMS)',
    description: 'Automate sample tracking, results pipelines, and compliance-ready audit trails.',
  },
  {
    title: 'AI Research Assistant',
    description: 'Accelerate hypothesis generation, data exploration, and reproducible analysis for researchers.',
  },
  {
    title: 'Secure Health Data Infrastructure',
    description: 'Enterprise-grade security primitives, encryption, and role-based controls for sensitive data.',
  },
];

const TIERS = [
  { id: 'coli_free', name: 'Coli Free', price: '$0', priceCents: 0, note: 'Monthly billing' },
  { id: 'coli_go', name: 'Coli Go', price: '$7/mo', priceCents: 700, note: 'Monthly billing' },
  { id: 'coli_plus', name: 'Coli Plus', price: '$15/mo', priceCents: 1500, note: 'Monthly billing' },
  { id: 'coli_premium', name: 'Coli Premium', price: '$29/mo', priceCents: 2900, note: 'Monthly billing' },
  { id: 'coli_pro', name: 'Coli Pro', price: '$79/mo', priceCents: 7900, note: 'Monthly billing' },
  { id: 'coli_api_platform', name: 'Coli API Platform', price: 'Contact us', priceCents: null, note: 'Contact us for custom API pricing' },
];

const WORKFLOW_STEPS = ['Patient Data', 'Lab Systems', 'AI Analysis', 'Clinical Insight', 'Decision Support'];

export default function ExploreFeaturesScreen({ navigation }) {
  let BlurView = null;
  try {
    // eslint-disable-next-line global-require
    const pkg = require('expo-blur');
    BlurView = pkg?.BlurView || null;
  } catch (e) {
    BlurView = null;
  }

  const { isLoggedIn } = useAuth();

  const openCheckoutUrl = async (url) => {
    if (!url) {
      return Alert.alert('Checkout Error', 'No checkout URL was returned.');
    }

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Cannot Open URL', 'Your device cannot open the checkout URL.');
    }
  };

  const handleTalkToSales = async () => {
    const whatsappUrl = 'https://wa.me/263786544687?text=Hello%20COLI%20Sales%2C%20I%20would%20like%20to%20talk%20about%20your%20healthcare%20AI%20platform.';
    const emailUrl = 'mailto:sales@coli.ai?subject=Talk%20to%20Sales%20-%20COLI';

    if (await Linking.canOpenURL(whatsappUrl)) {
      return Linking.openURL(whatsappUrl);
    }

    return Linking.openURL(emailUrl);
  };

  const handleRequestDemo = async () => {
    const emailUrl = 'mailto:sales@coli.ai?subject=Request%20a%20Demo%20-%20COLI';
    return Linking.openURL(emailUrl);
  };

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigation.navigate('App', { screen: 'MainTabs', params: { screen: 'Profile' } });
    } else {
      navigation.navigate('Login', { nextRoute: 'Profile' });
    }
  };

  const handleStripePurchase = async (planId, planName) => {
    const result = await paymentService.initiateStripePayment(planId);
    if (result.success && result.url) {
      return openCheckoutUrl(result.url);
    }
    Alert.alert('Stripe Payment Failed', result.error || `Unable to start Stripe checkout for ${planName}.`);
  };

  const handleFlutterwavePurchase = async (planId, planName) => {
    const result = await paymentService.initiateFlutterwavePayment(planId);
    if (result.success && result.url) {
      return openCheckoutUrl(result.url);
    }
    Alert.alert('Flutterwave Payment Failed', result.error || `Unable to start Flutterwave checkout for ${planName}.`);
  };

  const handleFreePlan = (planName) => {
    Alert.alert(
      'Free Plan Selected',
      `You can start with ${planName} now.`,
      [{ text: 'Continue', onPress: () => navigation.navigate('QuickStart') }]
    );
  };

  return (
    <View style={styles.root}>
      {BlurView && Platform.OS !== 'web' ? <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={16} /> : <View style={styles.backdrop} />}

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.nav}>
          <Text style={styles.navBrand}>COLI</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>AI-powered intelligence for modern healthcare and biotech systems</Text>
          <Text style={styles.heroSubtitle}>Unifying clinical data, laboratory workflows, and genomic insights into one intelligent platform.</Text>
          <View style={styles.ctaButtons}>
            <Pressable style={styles.primaryButton} onPress={handleGetStarted}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={handleRequestDemo}>
              <Text style={styles.secondaryButtonText}>Request Demo</Text>
            </Pressable>
          </View>
          <Text style={styles.heroFoot}>Built for hospitals, labs, and life science researchers.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Trusted by</Text>
          <View style={styles.trustedRow}>
            {TRUSTED_BY.map((item) => (
              <View key={item} style={styles.trustedItem}>
                <Text style={styles.trustedText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Core Capabilities</Text>
          <Text style={styles.sectionLead}>A unified platform built for clinical operations, laboratory automation, and research acceleration.</Text>
          <View style={styles.featureGrid}>
            {FEATURES.map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Platform Workflow</Text>
          <View style={styles.workflowFlow}>
            {WORKFLOW_STEPS.map((step, index) => (
              <View key={step} style={styles.flowStep}>
                <View style={styles.flowBadge}>
                  <Text style={styles.flowBadgeText}>{index + 1}</Text>
                </View>
                <Text style={styles.flowTitle}>{step}</Text>
                {index < WORKFLOW_STEPS.length - 1 && <Text style={styles.flowArrow}>→</Text>}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Pricing</Text>
          <Text style={styles.sectionLead}>Choose the plan that fits your team or institution. Stripe checkout is available for all paid tiers.</Text>
          <View style={styles.pricingGrid}>
            {TIERS.map((tier) => (
              <View key={tier.name} style={styles.pricingCard}>
                <Text style={styles.pricingName}>{tier.name}</Text>
                <Text style={styles.pricingPrice}>{tier.price}</Text>
                <Text style={styles.pricingNote}>{tier.note}</Text>
                {tier.priceCents > 0 ? (
                  <View style={styles.paymentActions}>
                    <Pressable style={styles.stripeButton} onPress={() => handleStripePurchase(tier.id, tier.name)}>
                      <Text style={styles.stripeButtonText}>Pay with Stripe</Text>
                    </Pressable>
                    <Pressable style={styles.flutterButton} onPress={() => handleFlutterwavePurchase(tier.id, tier.name)}>
                      <Text style={styles.flutterButtonText}>Pay with Flutterwave</Text>
                    </Pressable>
                  </View>
                ) : tier.priceCents === 0 ? (
                  <Pressable style={styles.freeButton} onPress={() => handleFreePlan(tier.name)}>
                    <Text style={styles.freeButtonText}>Start free</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.contactButton} onPress={() => Alert.alert('Contact Sales', 'Please contact our sales team for custom API pricing.') }>
                    <Text style={styles.contactButtonText}>Contact Sales</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}> 
          <Text style={styles.sectionHeading}>Start building the future of healthcare intelligence</Text>
          <View style={styles.ctaButtons}>
            <Pressable style={styles.primaryButton} onPress={handleGetStarted}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={handleTalkToSales}>
              <Text style={styles.secondaryButtonText}>Talk to Sales</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>COLI</Text>
          <Text style={styles.footerCopy}>AI intelligence for healthcare and biotech.</Text>
          <Text style={styles.footerBottom}>© {new Date().getFullYear()} COLI — All rights reserved</Text>
        </View>

        <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeButtonText}>Close Preview</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(1,4,10,0.72)',
  },
  container: {
    paddingTop: 18,
    paddingBottom: 40,
    paddingHorizontal: 18,
  },
  nav: {
    marginBottom: 18,
  },
  navBrand: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    padding: 26,
    marginBottom: 26,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 6,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 14,
  },
  heroSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 22,
  },
  heroFoot: {
    marginTop: 16,
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  ctaButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    minWidth: 140,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: theme.colors.cyan,
    marginRight: 12,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: theme.colors.midnight,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    minWidth: 140,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.cyan,
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: theme.colors.cyan,
    fontWeight: '700',
    textAlign: 'center',
  },
  section: {
    marginBottom: 22,
  },
  sectionHeading: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionLead: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  trustedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trustedItem: {
    flexBasis: '48%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  trustedText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  featureDescription: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  workflowFlow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  flowStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    marginBottom: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  flowBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  flowBadgeText: {
    color: '#fff',
    fontWeight: '700',
  },
  flowTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  flowArrow: {
    marginLeft: 8,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pricingCard: {
    width: '48%',
    minWidth: 140,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pricingName: {
    color: theme.colors.cyan,
    fontWeight: '700',
    marginBottom: 8,
  },
  pricingPrice: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  pricingNote: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  paymentActions: {
    marginTop: 12,
  },
  flutterButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38bdf8',
    alignItems: 'center',
  },
  flutterButtonText: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  stripeButton: {
    backgroundColor: '#6772E5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  stripeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  freeButton: {
    backgroundColor: theme.colors.cyan,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  freeButtonText: {
    color: '#020617',
    fontWeight: '700',
  },
  contactButton: {
    borderWidth: 1,
    borderColor: theme.colors.cyan,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  contactButtonText: {
    color: theme.colors.cyan,
    fontWeight: '700',
  },
  footer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  footerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  footerCopy: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footerBottom: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  closeButton: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 16,
    backgroundColor: theme.colors.purple,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
