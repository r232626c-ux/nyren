import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  StatusBar,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../theme';

// --- DATA TYPES & CONSTANTS ---
interface FeatureCard {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  gradient: [string, string];
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    title: 'AI Assistant',
    description: 'Intelligent conversations, clinical support, scientific guidance, voice interaction.',
    icon: 'chatbubbles-outline',
    gradient: ['#22D3EE', '#8B5CF6'],
  },
  {
    title: 'Laboratory Information System',
    description: 'Test requests, sample tracking, result management, automated workflows.',
    icon: 'flask-outline',
    gradient: ['#3B82F6', '#22D3EE'],
  },
  {
    title: 'Patient Management',
    description: 'Digital patient records, appointment tracking, clinical history, secure healthcare data.',
    icon: 'people-outline',
    gradient: ['#8B5CF6', '#3B82F6'],
  },
  {
    title: 'Scientific Research Hub',
    description: 'Literature support, research workflows, data interpretation, publication assistance.',
    icon: 'analytics-outline',
    gradient: ['#22D3EE', '#A855F7'],
  },
  {
    title: 'Bioinformatics Workspace',
    description: 'Genomics analysis, biomarker discovery, NGS workflows, precision medicine support.',
    icon: 'pulse-outline',
    gradient: ['#3B82F6', '#22D3EE'],
  },
  {
    title: 'Medical Education',
    description: 'Student learning, viva preparation, AI tutoring, interactive explanations.',
    icon: 'school-outline',
    gradient: ['#8B5CF6', '#22D3EE'],
  },
  {
    title: 'Companion Mode',
    description: 'Voice-first interactions, personalized AI assistance, memory-driven conversations.',
    icon: 'mic-outline',
    gradient: ['#22D3EE', '#3B82F6'],
  },
  {
    title: 'Analytics Dashboard',
    description: 'Healthcare insights, laboratory statistics, research metrics, operational intelligence.',
    icon: 'bar-chart-outline',
    gradient: ['#22D3EE', '#8B5CF6'],
  },
];

const ECOSYSTEM_NODES = [
  'Hospitals', 'Laboratories', 'Students', 'Researchers',
  'Clinicians', 'Patients', 'Universities', 'Biotechnology', 'Pharmaceuticals', 'Healthcare Organizations', 'Bioinformatics', 'Genomics', 'Medical Education', 'Clinical Trials', 'Public Health', 'Regulatory Bodies'
];

const MODULES = [
  'Dashboard', 'AI Chat', 'Companion', 'Scientific Workspace',
  'Research Hub', 'Laboratory System', 'Clinical Tools',
  'Memerz Knowledge System', 'Settings & Integrations'
];

const AUDIENCE = [
  'Hospitals', 'Laboratories', 'Medical Students', 'Researchers',
  'Universities', 'Biotechnology Companies', 'Clinicians', 'Healthcare Organizations'
];

const ROADMAP_ITEMS = [
  'Healthcare Intelligence', 'Research & Bioinformatics',
  'Voice AI Companion', 'Precision Medicine Platform', 'Global Healthcare Ecosystem'
];

const TESTIMONIALS = [
  {
    name: 'Vimbai Bisiyasi',
    role: 'Bioinformatics Student',
    quote: 'COLI turned our data into actionable care pathways overnight.',
  },
  {
    name: 'Benjamin Kamau',
    role: 'Medical Student',
    quote: 'The AI tutoring and research support feel like having a mentor anytime.',
  },
  {
    name: 'Nia Jotani',
    role: 'Laboratory Scientist',
    quote: 'Sample tracking and result workflows finally work together seamlessly.',
  },
];

export default function HomeScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // --- ANIMATIONS ---
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const website = 'https://derxqay.com.free';
  const isPhone = width < 480;
  const isTablet = width >= 480 && width < 900;
  const isDesktop = width >= 900;
  // Used throughout this screen for responsive layout decisions.
  const isLargeScreen = isDesktop;

  useEffect(() => {
    // Ambient Background Pulse Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2800, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, useNativeDriver: Platform.OS !== 'web' }),
      ])
    ).start();

  }, [pulseAnim]);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });
  
  const handleScrollToContent = () => {
    scrollViewRef.current?.scrollTo({ y: height * 0.8, animated: true });
  };

  // --- SUB-RENDERERS ---
  const renderFeatureCard = (feature: FeatureCard) => (
    <Pressable 
      key={feature.title} 
      onPress={() => {
        const destination = {
          'AI Assistant': 'Chat',
          'Laboratory Information System': 'Research',
          'Patient Management': 'Research',
          'Scientific Research Hub': 'Research',
          'Bioinformatics Workspace': 'Scientific',
          'Medical Education': 'Learn',
          'Companion Mode': 'Companion',
          'Analytics Dashboard': 'Scientific',
        }[feature.title];
        if (destination) navigation.navigate(destination);
      }}
      style={[styles.featureCard, { width: isLargeScreen ? '48%' : '100%' }]}
    >
      <LinearGradient
        colors={feature.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featureIcon}
      >
        <Ionicons name={feature.icon} size={22} color="#FFFFFF" />
      </LinearGradient>
      <Text style={styles.featureTitle}>{feature.title}</Text>
      <Text style={styles.featureCopy}>{feature.description}</Text>
    </Pressable>
  );

  const renderEmbeddedLogo = (size: 'sm' | 'lg') => {
    const isLarge = size === 'lg';
    return (
      <View style={[styles.logoWrapper, isLarge && styles.logoWrapperLarge]}>
        <View style={styles.antennaContainer}>
          <View style={[styles.antennaPole, isLarge && styles.antennaPoleLarge]} />
          <View style={[styles.antennaPole, isLarge && styles.antennaPoleLarge]} />
        </View>

        <View style={[styles.logoHeadFrame, isLarge && styles.logoHeadFrameLarge]}>
          <Text style={[styles.letterText, isLarge && styles.letterTextLarge]}>C</Text>
          
          <View style={[styles.dnaLetterO, isLarge && styles.dnaLetterOLarge]}>
            <View style={styles.dnaStrandContainer}>
              <View style={[styles.dnaNode, styles.dnaNode1]} />
              <View style={[styles.dnaLink, styles.dnaLink1]} />
              <View style={[styles.dnaNode, styles.dnaNode2]} />
              <View style={[styles.dnaLink, styles.dnaLink2]} />
              <View style={[styles.dnaNode, styles.dnaNode3]} />
              <View style={[styles.dnaLink, styles.dnaLink3]} />
              <View style={[styles.dnaNode, styles.dnaNode4]} />
            </View>
          </View>
          
          <Text style={[styles.letterText, isLarge && styles.letterTextLarge]}>L</Text>
          <Text style={[styles.letterText, isLarge && styles.letterTextLarge]}>I</Text>

          <View style={[styles.chassisEye, styles.chassisEyeLeft]} />
          <View style={[styles.chassisEye, styles.chassisEyeRight]} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Decorative Ambient Canvas Lights */}
      <LinearGradient colors={['#080E1D', '#070A16']} style={StyleSheet.absoluteFillObject} />
      <Animated.View
        style={[
          styles.heroGlow,
          { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
          Platform.OS === 'web' ? ({ filter: 'blur(80px)' } as any) : undefined,
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.heroGlowSecondary,
          { opacity: pulseOpacity },
          Platform.OS === 'web' ? ({ filter: 'blur(80px)' } as any) : undefined,
        ]}
        pointerEvents="none"
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Section Header */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.getParent?.()?.openDrawer?.()}
            style={styles.menuBtn}
            accessibilityRole="button"
            accessibilityLabel="Open navigation drawer"
          >
            <Ionicons name="menu" size={24} color={theme.colors.cyan} />
          </Pressable>

          <View style={styles.brandContainer}>
            {renderEmbeddedLogo('sm')}
            <Text style={styles.brandTagline}>Smarter Care. Stronger Future.</Text>
          </View>
        </View>

        {/* Hero Interactive Layout with Local Showcase Graphic */}
        <View
  style={[
    styles.heroSection,
    {
      flexDirection: isDesktop ? 'row' : 'column',
      gap: isPhone ? 20 : 32,
    },
  ]}
>
          <View style={styles.heroCopy}>
           
            
            <View style={{ marginBottom: 20 }}>
              {renderEmbeddedLogo('lg')}
            </View>

            <Text style={[styles.heroHeadline, { fontSize: isDesktop ? 44 : isTablet ? 36 : 26,
lineHeight: isDesktop ? 52 : isTablet ? 44 : 34, }]}>
              COLI is an AI-first healthcare platform for students, researchers, labs, and clinicians to streamline workflows and accelerate discovery.
            </Text>
            
            <View style={styles.statsRow}>
              {[
                { val: '8', label: 'Intelligent domains' },
                { val: '24/7', label: 'AI coverage' },
                { val: '100%', label: 'Data accuracy' },
              ].map((item, idx) => (
                <View key={idx} style={styles.statTile}>
                  <Text style={styles.statNumber}>{item.val}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Hero Featured Image */}
          <View style={[styles.heroVisualContainer, { width: isDesktop ? '45%' : '100%' }]}>
            <LinearGradient
              colors={['rgba(34,211,238,0.08)', 'rgba(139,92,246,0.03)']}
              style={styles.imageBackingGradient}
            >
              <Image 
                source={require('../../coco.jpeg')} 
                style={styles.heroFeaturedImage}
                resizeMode="cover"
              />
            </LinearGradient>
          </View>
        </View>

        {/* Scroll Call to Action */}
        <Pressable 
          style={styles.scrollHintContainer} 
          onPress={handleScrollToContent} 
          accessibilityRole="button" 
          accessibilityLabel="Scroll down to primary features"
        >
          <Text style={styles.scrollHintText}>Explore Platform Matrix</Text>
          <Ionicons name="chevron-down" size={18} color={theme.colors.cyan} style={{ marginLeft: 6 }} />
        </Pressable>

        {/* Product Pitch Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is COLI?</Text>
          <Text style={styles.sectionCopy}>
            COLI is an AI-powered healthcare and scientific intelligence platform engineered for modern ecosystems. 
            It provides automated medical speech execution frameworks, continuous bioinformatics telemetry parsing, 
            lab informational workflows, and production-ready healthcare tool pipelines natively.
          </Text>
        </View>

        {/* Features Structural System Grid */}
        <View style={styles.featuresGrid}>
          {FEATURE_CARDS.map(renderFeatureCard)}
        </View>

        {/* Connected Ecosystem Node Display */}
        <View style={styles.sectionLarge}>
          <Text style={styles.sectionTitle}>COLI Ecosystem Matrix</Text>
          <Text style={styles.sectionCopy}>A unified cloud intelligence node engine linking entities across medical boundaries:</Text>
          
          <View style={styles.ecosystemFlexGrid}>
            <View style={styles.ecoCoreNode}>
              <Text style={styles.ecoCoreText}>COLI Core AI</Text>
            </View>
            {ECOSYSTEM_NODES.map((node) => (
              <View key={node} style={styles.ecoBadge}>
                <View style={styles.ecoPulsePoint} />
                <Text style={styles.ecoBadgeText}>{node}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Procedural Process Execution Pipeline */}
        <View style={styles.sectionLarge}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.stepsGrid}>
            {['Connect Systems', 'Centralize Workflows', 'Activate Intelligence', 'Gain Insights', 'Improve Outcomes'].map((label, index) => (
              <View key={label} style={[styles.stepCard, { width: isLargeScreen ? '18%' : '100%' }]}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
                <Text style={styles.stepLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Grid System of App Modular Clusters */}
        <View style={styles.sectionLarge}>
          <Text style={styles.sectionTitle}>Platform Modules</Text>
          <View style={styles.modulesGrid}>
            {MODULES.map((module) => (
              <Pressable 
                key={module} 
                style={[styles.moduleCard, { width: isLargeScreen ? '30%' : '47%' }]}
                onPress={() => {
                  const destination = {
                    Dashboard: 'Home',
                    'AI Chat': 'Chat',
                    Companion: 'Companion',
                    'Scientific Workspace': 'Scientific',
                    'Research Hub': 'Research',
                    'Laboratory System': 'Research',
                    'Clinical Tools': 'Scientific',
                    'Memerz Knowledge System': 'Memory',
                    'Settings & Integrations': 'Settings',
                  }[module];
                  if (destination) navigation.navigate(destination);
                }}
              >
                <Ionicons name="apps-outline" size={16} color={theme.colors.cyan} style={{ marginRight: 8 }} />
                <Text style={styles.moduleTitle} numberOfLines={1}>{module}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Dual Operational Panels */}
        <View style={[styles.dualPanel, { flexDirection: isDesktop ? 'row' : 'column' }]}>
          <View style={styles.detailPanel}>
            <Text style={styles.panelTitle}>Why COLI</Text>
            {['Unified Platform Stack', 'AI Native Intelligence', 'Domain Focused Operations', 'Secure Sandbox Environments', 'Built for Scalability'].map((item) => (
              <View key={item} style={styles.detailRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.detailText}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={styles.detailPanel}>
            <Text style={styles.panelTitle}>Target Scope</Text>
            {AUDIENCE.map((item) => (
              <View key={item} style={styles.detailRow}>
                <View style={[styles.bulletDot, { backgroundColor: '#8B5CF6' }]} />
                <Text style={styles.detailText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Project Technical Lifecycle Roadmap */}
        <View style={styles.sectionLarge}>
          <Text style={styles.sectionTitle}>Evolution Blueprint</Text>
          <View style={styles.stepsGrid}>
            {ROADMAP_ITEMS.map((item, index) => (
              <View key={item} style={[styles.roadmapCard, { width: isLargeScreen ? '18%' : '100%' }]}>
                <Text style={styles.roadmapPhase}>Phase 0{index + 1}</Text>
                <Text style={styles.roadmapTitle}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Social Proof Testimonial Carousel Grid */}
        <View style={styles.sectionLarge}>
          <Text style={styles.sectionTitle}>Validation Reports</Text>
          <View style={styles.featuresGrid}>
            {TESTIMONIALS.map((item) => (
              <View key={item.name} style={[styles.testimonialCard, { width: isLargeScreen ? '31%' : '100%' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="rgba(34,211,238,0.2)" style={{ marginBottom: 10 }} />
                <Text style={styles.testimonialQuote}>“{item.quote}”</Text>
                <View style={{ marginTop: 'auto' }}>
                  <Text style={styles.testimonialName}>{item.name}</Text>
                  <Text style={styles.testimonialRole}>{item.role}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Conversion Footers section */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Initialize System Integration</Text>
          <Text style={styles.sectionCopy}>
            Deploy secure cross-functional biomedical systems models into active lab and hospital workloads instantly.
          </Text>
          <Pressable style={styles.linkAnchorButton} accessibilityRole="link">
            <Ionicons name="globe-outline" size={16} color={theme.colors.cyan} style={{ marginRight: 8 }} />
            <Text style={styles.websiteText}>{website}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// --- SYSTEM COMPONENT ARCHITECTURE STYLES ---
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070A16',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 80,
  },
  topBar: {
    marginTop: Platform.OS === 'ios' ? 24 : 40,
    marginBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'flex-end',
  },
  brandTagline: {
    color: 'rgba(255,255,255,0.4)',
    marginTop: 6,
    fontSize: 10,
    letterSpacing: 1,
  },
  menuBtn: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(34,211,238,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.15)',
  },
  heroSection: {
    gap: 32,
    marginBottom: 24,
  },
  heroCopy: {
    flex: 1,
  },
  heroKicker: {
    color: '#22D3EE',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 14,
  },
  heroHeadline: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  heroGlow: {
    position: 'absolute',
    top: -150,
    left: -50,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(34,211,238,0.06)',
  },
  heroGlowSecondary: {
    position: 'absolute',
    top: 200,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(139,92,246,0.04)',
  },

  // --- IMAGE ASSET ARCHITECTURE STYLES ---
  heroVisualContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 280,
  },
  imageBackingGradient: {
    width: '100%',
    height: '100%',
    minHeight: 280,
    borderRadius: 24,
    padding: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.25)',
  },
  heroFeaturedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },

  // --- EMBEDDED ROBOT-DNA WORDMARK LOGO SYSTEM ---
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapperLarge: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  antennaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 32,
    paddingHorizontal: 4,
    marginBottom: -1,
  },
  antennaPole: {
    width: 2,
    height: 4,
    backgroundColor: '#22D3EE',
    opacity: 0.7,
  },
  antennaPoleLarge: {
    height: 7,
    width: 3,
  },
  logoHeadFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(34,211,238,0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'relative',
  },
  logoHeadFrameLarge: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#22D3EE',
    backgroundColor: 'rgba(34,211,238,0.05)',
  },
  letterText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  letterTextLarge: {
    fontSize: 42,
    letterSpacing: 4,
  },
  dnaLetterO: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#22D3EE',
    marginHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070A16',
  },
  dnaLetterOLarge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 4,
    marginHorizontal: 6,
  },
  dnaStrandContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dnaNode: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#8B5CF6',
  },
  dnaLink: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dnaNode1: { top: 3, left: 5 },
  dnaNode2: { top: 5, right: 4 },
  dnaNode3: { bottom: 5, left: 4 },
  dnaNode4: { bottom: 3, right: 5 },
  dnaLink1: { top: 4, left: 6, width: 6, transform: [{ rotate: '25deg' }] },
  dnaLink2: { top: 9, left: 4, width: 10, transform: [{ rotate: '-10deg' }], backgroundColor: '#22D3EE' },
  dnaLink3: { bottom: 4, left: 6, width: 6, transform: [{ rotate: '-25deg' }] },
  
  chassisEye: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#22D3EE',
    top: '50%',
    marginTop: -1.5,
  },
  chassisEyeLeft: { left: 3 },
  chassisEyeRight: { right: 3 },
  
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statTile: {
    flex: 1,
    minWidth: 100,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  scrollHintContainer: {
    marginVertical: 32,
    alignSelf: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.2)',
  },
  scrollHintText: {
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '600',
  },
  section: {
    marginBottom: 40,
  },
  sectionLarge: {
    marginBottom: 56,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  sectionCopy: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 24,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  featureCopy: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    lineHeight: 20,
  },
  ecosystemFlexGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  ecoCoreNode: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(34,211,238,0.1)',
    borderWidth: 1,
    borderColor: '#22D3EE',
    marginRight: 8,
  },
  ecoCoreText: {
    color: '#22D3EE',
    fontWeight: '700',
    fontSize: 14,
  },
  ecoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  ecoPulsePoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginRight: 8,
  },
  ecoBadgeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(34,211,238,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumberText: {
    color: '#22D3EE',
    fontSize: 14,
    fontWeight: '700',
  },
  stepLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  moduleTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  dualPanel: {
    gap: 16,
    marginBottom: 56,
  },
  detailPanel: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 24,
  },
  panelTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22D3EE',
    marginRight: 12,
  },
  detailText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  roadmapCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 20,
  },
  roadmapPhase: {
    color: '#22D3EE',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  roadmapTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  testimonialCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 24,
    minHeight: 190,
  },
  testimonialQuote: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  testimonialName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  testimonialRole: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
  },
  contactSection: {
    backgroundColor: 'rgba(34,211,238,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.1)',
    padding: 32,
    alignItems: 'center',
    textAlign: 'center',
  },
  linkAnchorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  websiteText: {
    color: '#22D3EE',
    fontSize: 13,
    fontWeight: '600',
  },
});