import { useWindowDimensions, Platform } from 'react-native';

/**
 * Responsive design system
 * Breakpoints:
 * - Phone: width < 768
 * - Tablet: width >= 768 && width < 1024
 * - Desktop: width >= 1024
 */

export const BREAKPOINTS = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
};

/**
 * Main responsive hook - use this in every screen
 */
export const useScreenSize = () => {
  const { width, height } = useWindowDimensions();
  
  return {
    width,
    height,
    isPhone: width < BREAKPOINTS.tablet,
    isTablet: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
    isDesktop: width >= BREAKPOINTS.desktop,
    isWeb: Platform.OS === 'web',
    isNative: Platform.OS !== 'web',
  };
};

/**
 * Get responsive value based on screen size
 */
export const getResponsiveValue = (phoneValue, tabletValue, desktopValue) => {
  return (screenSize) => {
    if (screenSize.isDesktop) return desktopValue;
    if (screenSize.isTablet) return tabletValue;
    return phoneValue;
  };
};

/**
 * Responsive styles utility
 */
export const createResponsiveStyles = (stylesFn) => {
  return (screenSize) => stylesFn(screenSize);
};

/**
 * Font size scaling
 */
export const getResponsiveFontSize = (baseSize, screenSize) => {
  if (screenSize.isDesktop) return baseSize * 1.2;
  if (screenSize.isTablet) return baseSize * 1.1;
  return baseSize;
};

/**
 * Spacing scaling
 */
export const getResponsiveSpacing = (baseSpacing, screenSize) => {
  if (screenSize.isDesktop) return baseSpacing * 1.3;
  if (screenSize.isTablet) return baseSpacing * 1.15;
  return baseSpacing;
};

/**
 * Calculate responsive column count for grids
 */
export const getColumnCount = (screenSize) => {
  if (screenSize.isDesktop) return 3;
  if (screenSize.isTablet) return 2;
  return 1;
};

/**
 * Calculate card width for grid layouts
 */
export const getCardWidth = (screenSize, containerWidth, columns = null, gap = 16) => {
  const colCount = columns || getColumnCount(screenSize);
  const totalGaps = (colCount - 1) * gap;
  return (containerWidth - totalGaps) / colCount;
};

/**
 * Get responsive padding
 */
export const getResponsivePadding = (screenSize) => {
  if (screenSize.isDesktop) return 32;
  if (screenSize.isTablet) return 24;
  return 16;
};

/**
 * Get responsive max width for containers
 */
export const getMaxWidth = (screenSize) => {
  if (screenSize.isDesktop) return 1200;
  if (screenSize.isTablet) return 900;
  return screenSize.width - 32; // Full width with padding on phone
};

/**
 * Determine if should use sidebar navigation (tablet+) or drawer (phone)
 */
export const shouldUseSidebar = (screenSize) => {
  return screenSize.width >= BREAKPOINTS.tablet;
};

/**
 * Get modal width
 */
export const getModalWidth = (screenSize) => {
  if (screenSize.isDesktop) return Math.min(screenSize.width * 0.6, 800);
  if (screenSize.isTablet) return screenSize.width * 0.8;
  return screenSize.width * 0.95;
};

/**
 * Get input field width
 */
export const getInputWidth = (screenSize, fullWidth = false) => {
  if (fullWidth) return '100%';
  if (screenSize.isDesktop) return '48%';
  if (screenSize.isTablet) return '48%';
  return '100%';
};

/**
 * Get responsive button height
 */
export const getButtonHeight = (screenSize) => {
  if (screenSize.isDesktop) return 48;
  if (screenSize.isTablet) return 44;
  return 40;
};

/**
 * Determine if content should scroll horizontally or wrap
 */
export const shouldWrapContent = (screenSize) => {
  return screenSize.isPhone;
};

/**
 * Get responsive header height
 */
export const getHeaderHeight = (screenSize) => {
  if (screenSize.isDesktop) return 80;
  if (screenSize.isTablet) return 70;
  return 60;
};

export default useScreenSize;
