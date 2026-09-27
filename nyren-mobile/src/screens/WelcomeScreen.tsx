import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Svg, { G, Path, Circle, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import theme from '../theme';
import {
  useScreenSize,
  getResponsiveFontSize,
  getResponsivePadding,
  getMaxWidth,
} from '../utils/responsive';

// NOTE: This file previously used Dimensions.get('window') + fixed widths/heights.
// It now uses your responsive utilities exclusively and supports SafeAreaView.

type Props = {
  onGetStarted?: () => void;
  onExplore?: () => void;
};

export default function WelcomeScreen({ onGetStarted, onExplore }: Props) {
  const screenSize = useScreenSize();
  const padding = getResponsivePadding(screenSize);
  const maxWidth = getMaxWidth(screenSize);

  const pulse = useRef(new Animated.Value(0)).current;
  const floaty = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(floaty, {
        toValue: 1,
        duration: 9000,
        useNativeDriver: Platform.OS !== 'web',
      })
    ).start();
  }, [pulse, floaty]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.04] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.36] });
  const floatY = floaty.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });

  const styles = createResponsiveWelcomeStyles(screenSize, padding, maxWidth);

  const features = [
    { icon: '🧠', title: 'AI Learning', desc: 'Personalized education' },
    { icon: '🏥', title: 'Smart Health', desc: 'Hospital integration' },
    { icon: '📊', title: 'Analytics', desc: 'Real-time insights' },
    { icon: '🔐', title: 'Secure', desc: 'Privacy protected' },
  ];

  const isTabletOrDesktop = !screenSize.isPhone;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <LinearGradient
        colors={['#070A16', '#080E1D', '#0B1220']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        horizontal={false}
      >
        {/* Animated background grid */}
        <Animated.View
          style={[styles.grid, { transform: [{ translateY: floatY }] }]}
          pointerEvents="none"
        />

        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.logoWrap}>
            <BrandLogo />
          </View>

          <Animated.View style={[styles.heroWrap, { transform: [{ scale }] }]}>
            <HolographicHero intensity={glow} />
          </Animated.View>

          <Text style={styles.title}>Smarter Care. Stronger Future.</Text>
          <Text style={styles.subtitle} numberOfLines={4}>
            AI-powered healthcare for students and smarter hospital access.
          </Text>
        </View>

        {/* Features grid */}
        <View
          style={[
            styles.featuresContainer,
            isTabletOrDesktop && styles.featuresContainerTablet,
          ]}
        >
          {features.map((feature, idx) => (
            <View
              key={idx}
              style={
                screenSize.isPhone
                  ? styles.featureCardPhone
                  : screenSize.isTablet
                  ? styles.featureCardTablet
                  : styles.featureCardDesktop
              }
            >
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={onGetStarted}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={['#8B5CF6', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={onExplore}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Explore Features</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            Trusted by healthcare professionals and students worldwide
          </Text>

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🏆 Award Winner</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🌍 50+ Countries</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BrandLogo() {
  // Responsive safe text-based logo (works consistently on web and native)
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={96} height={96} viewBox="0 0 100 100">
        <G>
          <Circle cx="50" cy="50" r="36" fill="rgba(138,43,226,0.06)" />
          <Path d="M50 18 L66 46 L50 74 L34 46 Z" fill={theme.colors.purple} opacity={0.98} />
          <Path d="M50 30 L60 46 L50 62 L40 46 Z" fill={theme.colors.cyan} opacity={0.88} />
          <Rect x="0" y="0" width="100" height="100" fill="transparent" />
        </G>
      </Svg>
      <Text style={{ marginTop: 8, fontSize: 14, color: '#22D3EE', fontWeight: '800', letterSpacing: 2 }}>
        COLI
      </Text>
    </View>
  );
}

function HolographicHero({ intensity }: { intensity: any }) {
  // Use intensity for shadow/glow; keep geometry fixed (no layout overflow).
  return (
    <View
      style={{
        width: 220,
        height: 140,
        borderRadius: 999,
        backgroundColor: 'rgba(34, 211, 238, 0.08)',
        borderWidth: 2,
        borderColor: 'rgba(34, 211, 238, 0.22)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#22D3EE',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: intensity,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      <Text style={{ fontSize: 44, fontWeight: '900' }}>✨</Text>
    </View>
  );
}

function createResponsiveWelcomeStyles(screenSize: any, padding: number, maxWidth: number) {
  return StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      minHeight: '100%',
      paddingHorizontal: padding,
      paddingVertical: padding * 1.5,
      alignItems: 'center',
    },
    grid: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.03,
      width: '100%',
      height: '100%',
      backgroundColor: '#22D3EE',
      // Cheap “grid-like” backdrop substitute to avoid horizontal overflow.
      // Web/native: backgroundColor stays behind content.
    },

    heroSection: {
      alignItems: 'center',
      marginBottom: padding * 2.5,
      width: '100%',
      maxWidth: maxWidth,
    },
    logoWrap: {
      marginBottom: padding * 1.5,
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroWrap: {
      marginBottom: padding * 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: getResponsiveFontSize(44, screenSize),
      fontWeight: '900',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: padding * 0.75,
      lineHeight: getResponsiveFontSize(44, screenSize) * 1.2,
    },
    subtitle: {
      fontSize: getResponsiveFontSize(16, screenSize),
      color: '#94a3b8',
      textAlign: 'center',
      lineHeight: getResponsiveFontSize(16, screenSize) * 1.55,
    },

    featuresContainer: {
      width: '100%',
      maxWidth: maxWidth,
      flexDirection: screenSize.isPhone ? 'column' : 'row',
      flexWrap: 'wrap',
      justifyContent: screenSize.isPhone ? 'center' : 'space-between',
      gap: padding,
      marginBottom: padding * 2,
    },
    featuresContainerTablet: {
      // on tablet we want two items per row
    },

    featureCardPhone: {
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(34, 211, 238, 0.15)',
      borderRadius: 14,
      padding: padding,
      alignItems: 'center',
      justifyContent: 'center',
    },

    featureCardTablet: {
      width: '48%',
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(34, 211, 238, 0.15)',
      borderRadius: 14,
      padding: padding,
      alignItems: 'center',
      justifyContent: 'center',
    },

    featureCardDesktop: {
      width: '23%',
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(34, 211, 238, 0.15)',
      borderRadius: 14,
      padding: padding,
      alignItems: 'center',
      justifyContent: 'center',
    },

    featureIcon: {
      fontSize: getResponsiveFontSize(32, screenSize),
      marginBottom: 8,
    },
    featureTitle: {
      fontSize: getResponsiveFontSize(14, screenSize),
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 4,
      textAlign: 'center',
    },
    featureDesc: {
      fontSize: getResponsiveFontSize(11, screenSize),
      color: '#94a3b8',
      textAlign: 'center',
    },

    buttonContainer: {
      width: '100%',
      maxWidth: 520,
      flexDirection: screenSize.isPhone ? 'column' : 'row',
      gap: padding,
      marginBottom: padding * 2,
    },
    primaryButton: {
      flex: screenSize.isPhone ? 0 : 1,
      height: getButtonHeight(screenSize),
      borderRadius: 12,
      overflow: 'hidden',
    },
    secondaryButton: {
      flex: screenSize.isPhone ? 0 : 1,
      height: getButtonHeight(screenSize),
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'rgba(34, 211, 238, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(34, 211, 238, 0.06)',
      marginTop: screenSize.isPhone ? 0 : 0,
    },
    buttonGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    primaryButtonText: {
      fontSize: getResponsiveFontSize(15, screenSize),
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    secondaryButtonText: {
      fontSize: getResponsiveFontSize(15, screenSize),
      fontWeight: '700',
      color: '#22D3EE',
      letterSpacing: 0.5,
    },
    buttonPressed: {
      opacity: 0.8,
    },

    footerInfo: {
      width: '100%',
      maxWidth: maxWidth,
      alignItems: 'center',
      paddingBottom: padding,
    },
    footerText: {
      fontSize: getResponsiveFontSize(12, screenSize),
      color: '#94a3b8',
      textAlign: 'center',
      marginBottom: padding,
      fontWeight: '500',
    },
    badgesRow: {
      flexDirection: 'row',
      gap: padding * 0.75,
      justifyContent: 'center',
      flexWrap: 'wrap',
    },
    badge: {
      backgroundColor: 'rgba(34, 211, 238, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(34, 211, 238, 0.25)',
      borderRadius: 10,
      paddingHorizontal: Math.max(10, padding * 0.75),
      paddingVertical: Math.max(6, padding * 0.35),
    },
    badgeText: {
      fontSize: getResponsiveFontSize(11, screenSize),
      color: '#22D3EE',
      fontWeight: '600',
      textAlign: 'center',
    },
  });
}

function getButtonHeight(screenSize: any) {
  // Replace fixed heights with responsive values.
  if (screenSize.isDesktop) return 50;
  if (screenSize.isTablet) return 46;
  return 42;
}

