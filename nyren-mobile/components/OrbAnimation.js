import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

/**
 * OrbAnimation Component
 * Premium animated glowing orb that pulses when AI is thinking
 * Jarvis-style effect with multi-layer neon blue glow
 * Features:
 * - Multiple glow layers for intense effect
 * - Pulsing animation
 * - Responsive to loading state
 */
const OrbAnimation = ({ isActive = true, size = 60 }) => {
  const pulseScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0.3);
  const rotateValue = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      // Main pulse
      pulseScale.value = withRepeat(
        withTiming(1.2, { duration: 1500 }),
        -1,
        true
      );
      // Glow intensity
      glowOpacity.value = withRepeat(
        withTiming(0.8, { duration: 1500 }),
        -1,
        true
      );
      // Rotation for inner rings
      rotateValue.value = withRepeat(
        withTiming(360, { duration: 4000 }),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(0.8, { duration: 300 });
      glowOpacity.value = withTiming(0.3, { duration: 300 });
      rotateValue.value = withTiming(0, { duration: 300 });
    }
  }, [isActive]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${rotateValue.value}deg`,
      },
    ],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer glow layer 3 (largest) */}
      <Animated.View
        style={[
          styles.glowLayerLarge,
          glowStyle,
          { width: size * 2.2, height: size * 2.2 },
        ]}
      />

      {/* Outer glow layer 2 (medium) */}
      <Animated.View
        style={[
          styles.glowLayerMedium,
          glowStyle,
          { width: size * 1.8, height: size * 1.8 },
        ]}
      />

      {/* Outer glow layer 1 (small) */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          { width: size * 1.5, height: size * 1.5 },
        ]}
      />

      {/* Main orb with pulse */}
      <Animated.View
        style={[
          orbStyle,
          styles.orb,
          { width: size, height: size },
        ]}
      >
        {/* Inner rotating rings */}
        <Animated.View
          style={[
            styles.innerRing,
            rotateStyle,
            { width: size * 0.8, height: size * 0.8 },
          ]}
        />
      </Animated.View>

      {/* Inner bright core */}
      <View
        style={[
          styles.core,
          { width: size * 0.4, height: size * 0.4 },
        ]}
      />

      {/* Center bright point */}
      <View
        style={[
          styles.centerPoint,
          { width: size * 0.15, height: size * 0.15 },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowLayerLarge: {
    position: 'absolute',
    backgroundColor: '#38bdf8',
    borderRadius: 999,
    opacity: 0.08,
    ...Platform.select({
      web: {
        boxShadow: '0 0 30px rgba(56,189,248,0.25)',
      },
      default: {
        shadowColor: '#38bdf8',
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 8,
      },
    }),
  },
  glowLayerMedium: {
    position: 'absolute',
    backgroundColor: '#38bdf8',
    borderRadius: 999,
    opacity: 0.15,
    ...Platform.select({
      web: {
        boxShadow: '0 0 28px rgba(56,189,248,0.35)',
      },
      default: {
        shadowColor: '#38bdf8',
        shadowOpacity: 0.7,
        shadowRadius: 25,
        elevation: 9,
      },
    }),
  },
  glow: {
    position: 'absolute',
    backgroundColor: '#38bdf8',
    borderRadius: 999,
    opacity: 0.3,
    ...Platform.select({
      web: {
        boxShadow: '0 0 24px rgba(56,189,248,0.45)',
      },
      default: {
        shadowColor: '#38bdf8',
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  orb: {
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.6)',
    borderWidth: 2,
    borderColor: '#0ea5e9',
    ...Platform.select({
      web: {
        boxShadow: '0 0 24px rgba(56,189,248,0.6)',
      },
      default: {
        shadowColor: '#38bdf8',
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 11,
      },
    }),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderTopColor: 'rgba(56, 189, 248, 0.8)',
    borderRightColor: 'rgba(56, 189, 248, 0.6)',
  },
  core: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#38bdf8',
    opacity: 0.9,
    ...Platform.select({
      web: {
        boxShadow: '0 0 18px rgba(56,189,248,0.6)',
      },
      default: {
        shadowColor: '#38bdf8',
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 12,
      },
    }),
  },
  centerPoint: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    opacity: 0.9,
    ...Platform.select({
      web: {
        boxShadow: '0 0 10px rgba(56,189,248,0.6)',
      },
      default: {
        shadowColor: '#38bdf8',
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 13,
      },
    }),
  },
});

export default OrbAnimation;
