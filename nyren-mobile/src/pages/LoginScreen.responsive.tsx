import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { loginUser, registerUser } from '../../services/apiService';
import { useScreenSize, getResponsivePadding, getResponsiveFontSize, getMaxWidth } from '../utils/responsive';

type Props = {
  onLogin: () => Promise<boolean>;
  navigation: any;
  route?: { params?: { nextRoute?: string } };
};

const ResponsiveLoginScreen = ({ onLogin, navigation, route }: Props) => {
  const screenSize = useScreenSize();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureEntry, setSecureEntry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const floatAnim = useRef(new Animated.Value(0)).current;

  const padding = getResponsivePadding(screenSize);
  const maxWidth = getMaxWidth(screenSize);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 3000, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3000, useNativeDriver: Platform.OS !== 'web' }),
      ])
    ).start();
  }, [floatAnim]);

  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });

  const handleAuth = async () => {
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMessage('Please enter your full name to sign up.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const response = await loginUser(email, password);
        if (response.success) {
          await onLogin();
        } else {
          setErrorMessage(response.message || 'Login failed');
        }
      } else {
        const response = await registerUser(name, email, password);
        if (response.success) {
          await onLogin();
        } else {
          setErrorMessage(response.message || 'Signup failed');
        }
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createResponsiveLoginStyles(screenSize, padding, maxWidth);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <LinearGradient
        colors={['#070A16', '#080E1D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <Animated.View style={[styles.headerWrap, { transform: [{ translateY: floatY }] }]}>
            <Text style={styles.brandText}>COLI</Text>
            <Text style={styles.brandSubtext}>AI + Healthcare</Text>
          </Animated.View>

          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
              onPress={() => {
                setMode('login');
                setErrorMessage('');
                setName('');
              }}
            >
              <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
              onPress={() => {
                setMode('signup');
                setErrorMessage('');
              }}
            >
              <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Error Message */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Name Field (Sign Up Only) */}
            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    placeholder="John Doe"
                    placeholderTextColor="#8ba4c9"
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    editable={!isLoading}
                  />
                </View>
              </View>
            )}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  placeholder="you@example.com"
                  placeholderTextColor="#8ba4c9"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#8ba4c9"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureEntry}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setSecureEntry(!secureEntry)}
                  style={styles.visibilityButton}
                >
                  <Text style={styles.visibilityIcon}>{secureEntry ? '👁️' : '🚫'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Primary Button */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#8B5CF6', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Forgot Password Link */}
            {mode === 'login' && (
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {/* Social Buttons */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtonsContainer}>
              {['Google', 'GitHub'].map((provider) => (
                <TouchableOpacity
                  key={provider}
                  style={[
                    styles.socialButton,
                    screenSize.isPhone ? { flex: 1 } : { width: '48%' },
                  ]}
                  disabled={isLoading}
                >
                  <Text style={styles.socialButtonText}>{provider}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Terms */}
            <Text style={styles.termsText}>
              By signing in, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

function createResponsiveLoginStyles(screenSize: any, padding: number, maxWidth: number) {
  const baseStyles = StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: '#0B1220',
    },
    keyboardAvoiding: {
      flex: 1,
    },
    scrollContent: {
      minHeight: '100%',
      paddingHorizontal: padding,
      paddingVertical: padding * 1.5,
      alignItems: 'center',
    },
    headerWrap: {
      alignItems: 'center',
      marginBottom: padding * 2,
      width: '100%',
    },
    brandText: {
      fontSize: getResponsiveFontSize(48, screenSize),
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: 3.2,
      marginBottom: 4,
    },
    brandSubtext: {
      fontSize: getResponsiveFontSize(12, screenSize),
      color: '#22D3EE',
      fontWeight: '600',
      letterSpacing: 1.2,
    },
    modeSelector: {
      flexDirection: 'row',
      gap: padding * 0.5,
      marginBottom: padding * 2,
      width: Math.min(300, maxWidth),
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: 'rgba(34,211,238,0.1)',
    },
    modeTab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: 'transparent',
    },
    modeTabActive: {
      backgroundColor: 'rgba(34,211,238,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(34,211,238,0.3)',
    },
    modeTabText: {
      fontSize: getResponsiveFontSize(13, screenSize),
      color: '#94a3b8',
      fontWeight: '600',
    },
    modeTabTextActive: {
      color: '#22D3EE',
    },
    formContainer: {
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
    },
    errorBox: {
      width: '100%',
      backgroundColor: 'rgba(239,68,68,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.3)',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: padding,
    },
    errorText: {
      color: '#ff6b6b',
      fontSize: getResponsiveFontSize(12, screenSize),
      fontWeight: '500',
    },
    inputGroup: {
      width: '100%',
      marginBottom: padding,
    },
    inputLabel: {
      fontSize: getResponsiveFontSize(12, screenSize),
      color: '#94a3b8',
      marginBottom: 8,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(34,211,238,0.2)',
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 48,
    },
    inputIcon: {
      fontSize: 18,
      marginRight: 10,
    },
    input: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: getResponsiveFontSize(14, screenSize),
      paddingVertical: 8,
    },
    visibilityButton: {
      padding: 8,
    },
    visibilityIcon: {
      fontSize: 16,
    },
    primaryButton: {
      width: '100%',
      marginTop: padding * 0.5,
      marginBottom: padding,
      borderRadius: 10,
      overflow: 'hidden',
      height: 48,
    },
    buttonGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      fontSize: getResponsiveFontSize(14, screenSize),
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    linkButton: {
      marginBottom: padding,
    },
    linkText: {
      fontSize: getResponsiveFontSize(12, screenSize),
      color: '#22D3EE',
      fontWeight: '500',
      textDecorationLine: 'underline',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginVertical: padding * 0.75,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dividerText: {
      marginHorizontal: padding * 0.5,
      fontSize: getResponsiveFontSize(11, screenSize),
      color: '#94a3b8',
      fontWeight: '500',
    },
    socialButtonsContainer: {
      flexDirection: screenSize.isPhone ? 'row' : 'row',
      gap: 12,
      width: '100%',
      marginBottom: padding,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    socialButton: {
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(34,211,238,0.15)',
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    socialButtonText: {
      fontSize: getResponsiveFontSize(12, screenSize),
      color: '#94a3b8',
      fontWeight: '600',
    },
    termsText: {
      fontSize: getResponsiveFontSize(11, screenSize),
      color: '#94a3b8',
      textAlign: 'center',
      lineHeight: 18,
    },
    termsLink: {
      color: '#22D3EE',
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  });

  return baseStyles;
}

export default ResponsiveLoginScreen;
