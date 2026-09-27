import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { loginUser, registerUser, getProfile, logoutUser, setAuthToken, startSocialLogin } from '../../services/apiService';

const { width: screenWidth } = Dimensions.get('window');

const socialProviders = [
  { label: 'Continue with Google', key: 'google', icon: 'G' },
  { label: 'Continue with Facebook', key: 'facebook', icon: 'F' },
  { label: 'Continue with GitHub', key: 'github', icon: 'GH' },
];

type Props = {
  onLogin: () => Promise<boolean>;
  navigation: any;
  route: {
    params?: {
      nextRoute?: string;
    };
  };
};

const InputField = ({
  label,
  placeholder,
  icon,
  value,
  secureTextEntry,
  keyboardType,
  onChangeText,
  toggleSecure,
  showToggle,
}: {
  label: string;
  placeholder: string;
  icon: string;
  value: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  onChangeText: (text: string) => void;
  toggleSecure?: () => void;
  showToggle?: boolean;
}) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputShell}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#8ba4c9"
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
      {showToggle && toggleSecure ? (
        <TouchableOpacity onPress={toggleSecure} style={styles.visibilityButton}>
          <Text style={styles.visibilityText}>{secureTextEntry ? '👁️' : '🚫'}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

export default function LoginScreen({ onLogin, navigation, route }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [secureEntry, setSecureEntry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const floatAnim = useRef(new Animated.Value(0)).current;

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
      let authResponse;
      if (mode === 'signup') {
        authResponse = await registerUser(name.trim(), email.trim().toLowerCase(), password);
      } else {
        authResponse = await loginUser(email.trim().toLowerCase(), password);
      }

      console.log('[LoginScreen] authResponse:', authResponse);
      if (!authResponse?.token) {
        throw new Error('No token returned from authentication');
      }

      // Validate that token works by fetching profile immediately
      try {
        const profile = await getProfile();
        console.log('[LoginScreen] profile after auth:', profile);
        const loginCompleted = await onLogin();
        if (!loginCompleted) {
          throw new Error('Authentication completed, but auth state restoration failed.');
        }

        const targetRoute = route?.params?.nextRoute || 'Home';
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'App',
              state: {
                routes: [
                  {
                    name: 'MainTabs',
                    state: {
                      routes: [{ name: targetRoute }],
                    },
                  },
                ],
              },
            },
          ],
        });
      } catch (err) {
        // If profile fetch fails, clear token and surface message
        await logoutUser();
        const msg = err?.response?.data?.error || err?.message || 'Authentication failed during validation.';
        setErrorMessage(msg);
      }
    } catch (error) {
      const providedMessage = error?.response?.data?.error || error?.message;
      setErrorMessage(providedMessage || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setErrorMessage('');
    setActiveProvider(provider);
    try {
      await startSocialLogin(provider);
    } catch (error: any) {
      setErrorMessage(error?.message || `Could not open ${provider} sign-in.`);
    } finally {
      setActiveProvider(null);
    }
  };

  const completeSocialLogin = async (url: string) => {
    const isNativeCallback = url.startsWith('coli://auth');
    let callbackUrl: URL;
    try {
      callbackUrl = new URL(url);
    } catch {
      return;
    }
    const isWebCallback = Platform.OS === 'web' && callbackUrl.origin === window.location.origin && (callbackUrl.searchParams.has('token') || callbackUrl.searchParams.has('error'));
    if (!isNativeCallback && !isWebCallback) return;
    const params = callbackUrl.searchParams;
    const token = params.get('token');
    if (!token) {
      setErrorMessage(params.get('error') || 'Social sign-in did not complete.');
      return;
    }
    try {
      await setAuthToken(token);
      if (Platform.OS === 'web') window.history.replaceState({}, '', callbackUrl.pathname);
      if (!(await onLogin())) throw new Error('Could not load your COLI profile.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'App', state: { routes: [{ name: 'MainTabs', state: { routes: [{ name: route?.params?.nextRoute || 'Home' }] } }] } }],
      });
    } catch (error: any) {
      await logoutUser();
      setErrorMessage(error?.message || 'Social sign-in failed.');
    }
  };

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => completeSocialLogin(url));
    Linking.getInitialURL().then((url) => url && completeSocialLogin(url)).catch(() => {});
    return () => subscription.remove();
  }, [onLogin, navigation, route?.params?.nextRoute]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 4500,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim, {
              toValue: 1,
              duration: 9000,
              useNativeDriver: Platform.OS !== 'web',
            })
      ]),
    ).start();
  }, [floatAnim]);

  const floatStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: floatAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -12],
          }),
        },
      ],
    }),
    [floatAnim],
  );

  const authTitle = mode === 'login' ? 'Welcome back' : 'Create your Coli AI pass';
  const authSubtitle =
    mode === 'login'
      ? 'Log in and access the assistant, science tools, memory vault, and premium workflows.'
      : 'Sign up to begin your premium AI companion experience with Coli.';

  return (
    <View style={styles.screen}>
      <View style={styles.backdrop} />
      <Animated.View style={[styles.glowOne, { opacity: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.42] }) }]} />
      <Animated.View style={[styles.glowTwo, { opacity: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.55] }) }]} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={[styles.heroContainer, screenWidth > 900 ? styles.heroHorizontal : null]}>
            <View style={styles.leftPanel}>
              <Animated.View style={[styles.illustrationCard, floatStyle]}>
                <View style={styles.mascotBubble}>
                  <Text style={styles.mascotIcon}>🤖</Text>
                </View>
                <View style={styles.heroTextBlock}>
                  <Text style={styles.heroTitle}>COLI AI</Text>
                  <Text style={styles.heroCopy}>
                    A premium AI companion built for high-end science, fast insights, and flawless conversational workflows.
                  </Text>
                </View>
                <View style={styles.chatBubbleRow}>
                  <View style={styles.chatBubblePrimary}>
                    <Text style={styles.chatBubbleText}>Hi there — ready to explore?</Text>
                  </View>
                  <View style={styles.chatBubbleSecondary}>
                    <Text style={styles.chatBubbleText}>Launch your next experiment.</Text>
                  </View>
                </View>
              </Animated.View>
            </View>

            <View style={styles.rightPanel}>
              <Animated.View style={[styles.authCard, floatStyle]}>
                <View style={styles.modeSwitchRow}>
                  <TouchableOpacity
                    style={[styles.modeButton, mode === 'login' ? styles.modeButtonActive : null]}
                    onPress={() => setMode('login')}
                  >
                    <Text style={[styles.modeButtonText, mode === 'login' ? styles.modeButtonTextActive : null]}>
                      Login
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeButton, mode === 'signup' ? styles.modeButtonActive : null]}
                    onPress={() => setMode('signup')}
                  >
                    <Text style={[styles.modeButtonText, mode === 'signup' ? styles.modeButtonTextActive : null]}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.authHeading}>{authTitle}</Text>
                <Text style={styles.authSubtitle}>{authSubtitle}</Text>

                {mode === 'signup' && (
                  <InputField
                    label="Full name"
                    placeholder="Enter your name"
                    icon="👤"
                    value={name}
                    onChangeText={setName}
                  />
                )}

                <InputField
                  label="Email"
                  placeholder="you@coli.ai"
                  icon="✉️"
                  value={email}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                />

                <InputField
                  label="Password"
                  placeholder="Enter your password"
                  icon="🔒"
                  value={password}
                  secureTextEntry={secureEntry}
                  onChangeText={setPassword}
                  toggleSecure={() => setSecureEntry((prev) => !prev)}
                  showToggle
                />

                <View style={styles.rowBetween}>
                  <TouchableOpacity
                    style={styles.rememberRow}
                    onPress={() => setRemember((prev) => !prev)}
                  >
                    <View style={[styles.rememberCheckbox, remember ? styles.rememberCheckboxActive : null]}>
                      {remember ? <Text style={styles.rememberCheck}>✓</Text> : null}
                    </View>
                    <Text style={styles.rememberText}>Remember me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.primaryAction, isLoading ? styles.primaryActionDisabled : null]}
                  onPress={handleAuth}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryActionText}>
                      {mode === 'login' ? 'Sign In to Coli' : 'Create account'}
                    </Text>
                  )}
                </TouchableOpacity>
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {socialProviders.map((provider) => (
                  <TouchableOpacity
                    key={provider.key}
                    style={styles.socialButton}
                    onPress={() => handleSocialLogin(provider.key)}
                    disabled={!!activeProvider || isLoading}
                    accessibilityRole="button"
                  >
                    <Text style={styles.socialIcon}>{provider.icon}</Text>
                    <Text style={styles.socialLabel}>{activeProvider === provider.key ? 'Opening sign-in...' : provider.label}</Text>
                  </TouchableOpacity>
                ))}

                <Text style={styles.legalText}>
                  By continuing, you accept COLI AI{' '}
                  <Text style={styles.linkText}>Terms</Text> and{' '}
                  <Text style={styles.linkText}>Privacy</Text>.
                </Text>
              </Animated.View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#03111d',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#041222',
  },
  glowOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#2f80ed40',
    top: -40,
    left: -20,
  },
  glowTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#9d7bff40',
    bottom: -30,
    right: -10,
  },
  scrollContent: {
    minHeight: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  heroContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  heroHorizontal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftPanel: {
    flex: 1,
    paddingRight: screenWidth > 900 ? 18 : 0,
  },
  rightPanel: {
    flex: 1,
    paddingLeft: screenWidth > 900 ? 18 : 0,
  },
  illustrationCard: {
    borderRadius: 32,
    backgroundColor: 'rgba(10, 24, 46, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(156, 207, 255, 0.14)',
    padding: 26,
    ...Platform.select({
      web: {
        boxShadow: '0px 24px 60px rgba(44, 123, 229, 0.12)',
      },
      default: {
        shadowColor: '#2c7be5',
        shadowOpacity: 0.16,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 10 },
      },
    }),
  },
  mascotBubble: {
    width: 110,
    height: 110,
    borderRadius: 60,
    backgroundColor: '#152d4f',
    borderWidth: 1,
    borderColor: 'rgba(74, 153, 255, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'center',
  },
  mascotIcon: {
    fontSize: 42,
  },
  heroTextBlock: {
    marginBottom: 22,
  },
  heroTitle: {
    color: '#eff8ff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  heroCopy: {
    color: '#b8d7ff',
    fontSize: 15,
    lineHeight: 24,
  },
  chatBubbleRow: {
    marginTop: 6,
  },
  chatBubblePrimary: {
    backgroundColor: 'rgba(56, 178, 255, 0.14)',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 178, 255, 0.24)',
    marginBottom: 12,
  },
  chatBubbleSecondary: {
    backgroundColor: 'rgba(157, 123, 255, 0.12)',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(157, 123, 255, 0.2)',
  },
  chatBubbleText: {
    color: '#d9e7ff',
    fontSize: 14,
    lineHeight: 20,
  },
  authCard: {
    borderRadius: 32,
    backgroundColor: 'rgba(8, 20, 41, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(112, 134, 255, 0.12)',
    padding: 26,
    ...Platform.select({
      web: {
        boxShadow: '0px 30px 80px rgba(15, 47, 89, 0.18)',
      },
      default: {
        shadowColor: '#0f2f59',
        shadowOpacity: 0.18,
        shadowRadius: 35,
        shadowOffset: { width: 0, height: 12 },
      },
    }),
  },
  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 999,
    padding: 6,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#2268ff22',
  },
  modeButtonText: {
    color: '#9bb3cf',
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: '#e5f2ff',
  },
  authHeading: {
    color: '#f8fbff',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 10,
  },
  authSubtitle: {
    color: '#aac4ef',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 26,
  },
  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
    color: '#9db2d3',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 34, 58, 0.9)',
    borderRadius: 18,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(116, 150, 255, 0.16)',
  },
  inputIcon: {
    fontSize: 18,
    color: '#7fb7ff',
    width: 42,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    color: '#f0f8ff',
    paddingVertical: 14,
    paddingHorizontal: 0,
    fontSize: 15,
  },
  visibilityButton: {
    width: 32,
    alignItems: 'center',
  },
  visibilityText: {
    fontSize: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(152, 199, 255, 0.35)',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberCheckboxActive: {
    backgroundColor: '#1d73ff',
    borderColor: '#1d73ff',
  },
  rememberCheck: {
    color: '#fff',
    fontSize: 12,
  },
  rememberText: {
    color: '#d7e7ff',
    fontSize: 13,
  },
  forgotText: {
    color: '#71b5ff',
    fontSize: 13,
  },
  primaryAction: {
    backgroundColor: '#2d7cff',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0px 18px 40px rgba(45, 124, 255, 0.22)',
      },
      default: {
        shadowColor: '#2d7cff',
        shadowOpacity: 0.28,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
    }),
  },
  primaryActionText: {
    color: '#f4fbff',
    fontSize: 15,
    fontWeight: '800',
  },
  primaryActionDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: '#ff6f6f',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dividerText: {
    color: '#91a9ce',
    fontSize: 12,
    marginHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(147, 172, 232, 0.16)',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  socialIcon: {
    color: '#cbd9ff',
    fontSize: 16,
    width: 34,
    textAlign: 'center',
    marginRight: 10,
  },
  socialLabel: {
    color: '#e8f3ff',
    fontSize: 14,
    fontWeight: '700',
  },
  legalText: {
    color: '#8ea9c9',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    textAlign: 'center',
  },
  linkText: {
    color: '#8ed1ff',
    fontWeight: '700',
  },
});