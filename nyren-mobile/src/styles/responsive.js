import { StyleSheet, Platform } from 'react-native';
import { useScreenSize, getResponsivePadding, getResponsiveFontSize, getMaxWidth } from '../utils/responsive';

/**
 * Global responsive styles that auto-adjust based on screen size
 */
export const createResponsiveScreenStyles = (screenSize) => {
  const padding = getResponsivePadding(screenSize);
  const maxWidth = getMaxWidth(screenSize);

  return StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: '#0B1220',
    },
    scrollContainer: {
      flex: 1,
      alignItems: 'center',
    },
    scrollContent: {
      width: '100%',
      maxWidth: maxWidth,
      paddingHorizontal: padding,
      paddingVertical: padding,
      alignSelf: 'center',
    },
    responsiveContainer: {
      flex: 1,
      width: '100%',
      maxWidth: maxWidth,
      alignSelf: 'center',
      paddingHorizontal: padding,
    },
    gradientBackground: {
      ...StyleSheet.absoluteFill,
      backgroundColor: '#0B1220',
    },
    header: {
      paddingBottom: padding,
      marginBottom: padding * 0.5,
    },
    headerTitle: {
      fontSize: getResponsiveFontSize(28, screenSize),
      fontWeight: '900',
      color: '#FFFFFF',
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: getResponsiveFontSize(14, screenSize),
      color: '#94a3b8',
      maxWidth: '90%',
    },
    card: {
      borderRadius: 16,
      padding: padding * 0.75,
      marginBottom: padding * 0.5,
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderWidth: 1,
      borderColor: 'rgba(34,211,238,0.1)',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: screenSize.isPhone ? 'center' : 'space-between',
      marginHorizontal: screenSize.isPhone ? -padding * 0.25 : 0,
    },
    formContainer: {
      width: '100%',
      paddingVertical: padding,
    },
  });
};

/**
 * Responsive input styles
 */
export const createResponsiveInputStyles = (screenSize) => {
  const padding = getResponsivePadding(screenSize);

  return StyleSheet.create({
    inputContainer: {
      width: '100%',
      marginBottom: padding,
    },
    input: {
      width: '100%',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(34,211,238,0.2)',
      color: '#FFFFFF',
      fontSize: getResponsiveFontSize(14, screenSize),
    },
    inputLabel: {
      fontSize: getResponsiveFontSize(12, screenSize),
      color: '#94a3b8',
      marginBottom: 8,
      fontWeight: '600',
    },
  });
};

/**
 * Responsive button styles
 */
export const createResponsiveButtonStyles = (screenSize) => {
  const padding = getResponsivePadding(screenSize);

  return StyleSheet.create({
    button: {
      width: '100%',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: padding * 0.5,
    },
    buttonText: {
      fontSize: getResponsiveFontSize(14, screenSize),
      fontWeight: '700',
      color: '#FFFFFF',
    },
    buttonGroup: {
      flexDirection: screenSize.isPhone ? 'column' : 'row',
      gap: padding * 0.5,
      width: '100%',
    },
  });
};

/**
 * Responsive grid item
 */
export const getGridItemWidth = (screenSize, containerWidth, gap = 16) => {
  let columns = 1;
  if (screenSize.isDesktop) columns = 3;
  else if (screenSize.isTablet) columns = 2;

  const totalGap = (columns - 1) * gap;
  return (containerWidth - totalGap) / columns;
};

export default createResponsiveScreenStyles;
