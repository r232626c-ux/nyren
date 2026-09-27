import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';

type Props = { title: string; subtitle?: string };

export default function NeonHeader({ title, subtitle }: Props) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: useNative }),
        Animated.timing(glow, { toValue: 0, duration: 1400, useNativeDriver: useNative }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [glow]);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.95] });
  const scale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  return (
    <View style={styles.wrap}>
      <Animated.Text style={[styles.glow, { opacity: glowOpacity, transform: [{ scale }] }]}>
        {title}
      </Animated.Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  glow: {
    position: 'absolute',
    left: 0,
    top: 0,
    color: '#7BE6FF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    ...Platform.select({
      web: { textShadow: '0px 6px 28px rgba(56,189,248,0.9)' },
      default: { textShadowColor: '#38bdf8', textShadowOffset: { width: 0, height: 6 }, textShadowRadius: 28 },
    }),
    zIndex: 0,
  },
  title: { color: '#E6F2FF', fontSize: 24, fontWeight: '900', letterSpacing: 1, zIndex: 1 },
  subtitle: { color: '#94a3b8', marginTop: 4, fontSize: 13 },
});
