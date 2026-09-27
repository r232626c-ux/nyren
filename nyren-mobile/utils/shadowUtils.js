import { Platform } from 'react-native';

/**
 * Converts React Native shadow props to CSS boxShadow for web
 * Usage:
 *   const styles = StyleSheet.create({
 *     box: getShadow({ color: '#000', opacity: 0.08, radius: 18, offset: { width: 0, height: 10 } })
 *   });
 */
export const getShadow = ({ color = '#000', opacity = 0.1, radius = 8, offset = { width: 0, height: 4 } } = {}) => {
  if (Platform.OS === 'web') {
    // Convert to CSS boxShadow format
    const rgba = convertHexToRgba(color, opacity);
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${rgba}`,
    };
  }

  // Native platforms use shadow props
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: offset,
  };
};

/**
 * Convert hex color to rgba string
 */
const convertHexToRgba = (hex, alpha = 1) => {
  // Handle #rgb and #rrggbb formats
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,0,0,${alpha})`;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * Preset shadows for common use cases
 */
export const SHADOWS = {
  small: getShadow({ color: '#000', opacity: 0.08, radius: 10, offset: { width: 0, height: 4 } }),
  medium: getShadow({ color: '#000', opacity: 0.12, radius: 15, offset: { width: 0, height: 6 } }),
  large: getShadow({ color: '#000', opacity: 0.18, radius: 25, offset: { width: 0, height: 12 } }),
  glow: getShadow({ color: '#38bdf8', opacity: 0.3, radius: 30, offset: { width: 0, height: 10 } }),
  glowYellow: getShadow({ color: '#fbbf24', opacity: 0.2, radius: 20, offset: { width: 0, height: 8 } }),
};
