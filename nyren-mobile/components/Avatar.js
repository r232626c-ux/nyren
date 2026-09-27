import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions, Platform } from "react-native";

const { width } = Dimensions.get("window");

/* ---------------- JARVIS COLOR STATES ---------------- */
const stateColor = {
  idle: "#38BDF8",
  listening: "#22C55E",
  thinking: "#8B5CF6",
  speaking: "#F59E0B",
  alert: "#EF4444",
};

export default function Avatar({
  state = "idle",
  isTalking = false,
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.6)).current;

  const color = stateColor[state] || stateColor.idle;

  /* ---------------- CORE PULSE ---------------- */
  useEffect(() => {
    const useNative = Platform.OS !== "web";
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 1500,
          useNativeDriver: useNative,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: useNative,
        }),
      ])
    ).start();
  }, []);

  /* ---------------- ROTATING RINGS ---------------- */
  useEffect(() => {
    const useNative = Platform.OS !== "web";
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: useNative,
      })
    ).start();
  }, []);

  /* ---------------- TALKING GLOW ---------------- */
  useEffect(() => {
    if (isTalking) {
      const useNative = Platform.OS !== "web";
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 1,
            duration: 200,
            useNativeDriver: useNative,
          }),
          Animated.timing(glow, {
            toValue: 0.5,
            duration: 200,
            useNativeDriver: useNative,
          }),
        ])
      ).start();
    } else {
      glow.setValue(0.6);
    }
  }, [isTalking]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>

      {/* OUTER ROTATING RING */}
      <Animated.View
        style={[
          styles.outerRing,
          {
            borderColor: color,
            transform: [{ rotate: spin }],
          },
        ]}
      />

      {/* INNER RING */}
      <Animated.View
        style={[
          styles.innerRing,
          {
            borderColor: color,
            transform: [{ scale: pulse }],
          },
        ]}
      />

      {/* CORE ENERGY */}
      <Animated.View
        style={[
          styles.core,
          {
            backgroundColor: color,
            opacity: glow,
            transform: [{ scale: pulse }],
          },
        ]}
      />

      {/* SCAN LINE */}
      <Animated.View style={styles.scanLine} />

    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: 260,
  },

  outerRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    opacity: 0.25,
  },

  innerRing: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    opacity: 0.5,
  },

  core: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  scanLine: {
    position: "absolute",
    width: width * 0.5,
    height: 2,
    backgroundColor: "#38bdf8",
    opacity: 0.3,
  },
});