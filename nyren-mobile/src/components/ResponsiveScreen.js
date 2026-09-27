import React from 'react';
import { SafeAreaView, ScrollView, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useScreenSize, getResponsivePadding, getMaxWidth } from '../utils/responsive';

/**
 * Reusable responsive screen wrapper
 * Handles safe areas, scrolling, and responsive padding automatically
 */
export const ResponsiveScreen = ({
  children,
  scrollable = true,
  backgroundColor = '#0B1220',
  gradientColors = ['#070A16', '#080E1D'],
  padding = null,
  maxWidth = null,
  showsVerticalScrollIndicator = false,
  onScroll = null,
}) => {
  const screenSize = useScreenSize();
  const defaultPadding = padding !== null ? padding : getResponsivePadding(screenSize);
  const defaultMaxWidth = maxWidth !== null ? maxWidth : getMaxWidth(screenSize);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    gradient: {
      ...StyleSheet.absoluteFill,
    },
    content: {
      flex: 1,
    },
    scrollViewContent: {
      width: '100%',
      maxWidth: defaultMaxWidth,
      alignSelf: 'center',
      paddingHorizontal: defaultPadding,
      paddingVertical: defaultPadding,
      flexGrow: 1,
    },
    viewContent: {
      width: '100%',
      maxWidth: defaultMaxWidth,
      alignSelf: 'center',
      paddingHorizontal: defaultPadding,
      paddingVertical: defaultPadding,
      flex: 1,
    },
  });

  const ContentWrapper = scrollable ? ScrollView : View;
  const contentStyle = scrollable ? styles.scrollViewContent : styles.viewContent;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={styles.gradient}
      />
      <ContentWrapper
        style={styles.content}
        contentContainerStyle={scrollable ? styles.scrollViewContent : undefined}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        onScroll={onScroll}
      >
        {children}
      </ContentWrapper>
    </SafeAreaView>
  );
};

/**
 * Responsive section container
 */
export const ResponsiveSection = ({ children, spacing = 'default' }) => {
  const screenSize = useScreenSize();
  const spacingMap = {
    compact: getResponsivePadding(screenSize) * 0.5,
    default: getResponsivePadding(screenSize),
    comfortable: getResponsivePadding(screenSize) * 1.5,
  };

  return (
    <View style={{ marginBottom: spacingMap[spacing], width: '100%' }}>
      {children}
    </View>
  );
};

/**
 * Responsive grid container for cards
 */
export const ResponsiveGrid = ({ children, gap = 16 }) => {
  const screenSize = useScreenSize();
  const numColumns = screenSize.isDesktop ? 3 : screenSize.isTablet ? 2 : 1;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: screenSize.isPhone ? 'center' : 'space-between',
        gap: gap,
        width: '100%',
      }}
    >
      {children}
    </View>
  );
};

/**
 * Responsive form container
 */
export const ResponsiveForm = ({ children, columns = 'auto' }) => {
  const screenSize = useScreenSize();
  
  let numColumns = 1;
  if (columns === 'auto') {
    numColumns = screenSize.isDesktop ? 2 : 1;
  } else {
    numColumns = columns;
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      {children}
    </View>
  );
};

export default ResponsiveScreen;
