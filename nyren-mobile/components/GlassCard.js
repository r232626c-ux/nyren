import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

/**
 * GlassCard Component
 * Reusable glassmorphic container with blur effect
 * Base component for premium UI elements
 */
const GlassCard = ({
  children,
  style,
  blurIntensity = 'medium', // light, medium, strong
  glowColor = '#38bdf8',
  withGlow = false,
}) => {
  const blurValues = {
    light: 'rgba(2, 6, 23, 0.8)',
    medium: 'rgba(2, 6, 23, 0.9)',
    strong: 'rgba(2, 6, 23, 0.95)',
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: blurValues[blurIntensity],
          ...Platform.select({
            web: {
              boxShadow: withGlow
                ? `0 0 28px ${glowColor}`
                : '0 14px 40px rgba(0,0,0,0.16)',
            },
            default: {
              shadowColor: withGlow ? glowColor : '#000',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 5,
            },
          }),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 16,
    backdropFilter: 'blur(10px)',
    ...Platform.select({
      web: {
        boxShadow: '0 14px 40px rgba(0,0,0,0.16)',
      },
      default: {
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 5,
      },
    }),
    overflow: 'hidden',
  },
});

export default GlassCard;
