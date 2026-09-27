import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useScreenSize, getResponsiveFontSize, getResponsivePadding, getMaxWidth } from '../utils/responsive';

type Props = {
  onGetStarted?: () => void;
  onExplore?: () => void;
};

export default function ResponsiveWelcomeScreen({ onGetStarted, onExplore }: Props) {
  const screenSize = useScreenSize();
  const pulse = useRef(new Animated.Value(0)).current;
  const floaty = useRef(new Animated.Value(0)).current;
  const padding = getResponsivePadding(screenSize);
  const maxWidth = getMaxWidth(screenSize);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { 
          toValue: 1, 
          duration: 2200, 
          useNativeDriver: Platform.OS !== 'web' 
        }),
        Animated.timing(pulse, { 
          toValue: 0, 
          duration: 2200, 
          useNativeDriver: Platform.OS !== 'web' 
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(floaty, { 
        toValue: 1, 
        duration: 9000, 
        useNativeDriver: Platform.OS !== 'web' 
      })
    ).start();
  }, [pulse, floaty]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.04] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.36] });
  const floatY = floaty.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });

  const styles = createResponsiveWelcomeStyles(screenSize, padding, maxWidth);

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
      >
        {/* Animated Background Grid */}
        <Animated.View 
          style={[styles.grid, { transform: [{ translateY: floatY }] }]} 
          pointerEvents="none" 
        />

        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Brand Mark */}
          <View style={styles.logoWrap}>
            <BrandLogo />
          </View>

          {/* Animated Holographic Effect */}
          <Animated.View style={[styles.heroWrap, { transform: [{ scale }] }]}>
            <HolographicHero intensity={glow} screenSize={screenSize} />
          </Animated.View>

          {/* Headlines */}
          <Text style={styles.title}>Smarter Care. Stronger Future.</Text>
          <Text style={styles.subtitle} numberOfLines={4}>
            AI-powered healthcare for students and smarter hospital access.
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          {[
            { icon: '🧠', title: 'AI Learning', desc: 'Personalized education' },
            { icon: '🏥', title: 'Smart Health', desc: 'Hospital integration' },
            { icon: '📊', title: 'Analytics', desc: 'Real-time insights' },
            { icon: '🔐', title: 'Secure', desc: 'Privacy protected' },
          ].map((feature, idx) => (
            <View key={idx} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onGetStarted}
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
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onExplore}
          >
            <Text style={styles.secondaryButtonText}>Explore Features</Text>
          </Pressable>
        </View>

        {/* Footer Info */}
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

// Simple brand logo component
function BrandLogo() {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 48, fontWeight: '900', letterSpacing: 2 }}>🧬</Text>
      <Text style={{ fontSize: 16, color: '#22D3EE', fontWeight: '700', letterSpacing: 2 }}>
        COLI
      </Text>
    </View>
  );
}

// Holographic hero effect
function HolographicHero({ intensity, screenSize }: any) {
  const heroSize = screenSize.isDesktop ? 280 : screenSize.isTablet ? 240 : 200;
  
  return (
    <View
      style={{
        width: heroSize,
        height: heroSize,
        borderRadius: heroSize / 2,
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        borderWidth: 2,
        borderColor: 'rgba(34, 211, 238, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#22D3EE',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: intensity,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      <Text style={{ fontSize: heroSize * 0.4, fontWeight: '900' }}>✨</Text>
    </View>
  );
}

function createResponsiveWelcomeStyles(screenSize: any, padding: number, maxWidth: number) {
  const featureCardWidth = screenSize.isPhone 
    ? '100%' 
    : screenSize.isTablet 
    ? '48%' 
    : '23%';

  const baseStyles = StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: '#0B1220',
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
      lineHeight: getResponsiveFontSize(16, screenSize) * 1.5,
      marginBottom: padding * 2,
    },
    featuresContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: padding,
      width: '100%',
      marginBottom: padding * 2,
      justifyContent: screenSize.isPhone ? 'center' : 'space-between',
    },
    featureCard: {
      width: featureCardWidth,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(34, 211, 238, 0.15)',
      borderRadius: 12,
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
      flexDirection: screenSize.isPhone ? 'column' : 'row',
      gap: padding,
      width: '100%',
      maxWidth: 480,
      marginBottom: padding * 2,
    },
    primaryButton: {
      flex: screenSize.isPhone ? 0 : 1,
      height: 52,
      borderRadius: 12,
      overflow: 'hidden',
    },
    secondaryButton: {
      flex: screenSize.isPhone ? 0 : 1,
      height: 52,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'rgba(34, 211, 238, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(34, 211, 238, 0.06)',
    },
    buttonGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
      alignItems: 'center',
      width: '100%',
      maxWidth: maxWidth,
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
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    badgeText: {
      fontSize: getResponsiveFontSize(11, screenSize),
      color: '#22D3EE',
      fontWeight: '600',
    },
  });

  return baseStyles;
}
