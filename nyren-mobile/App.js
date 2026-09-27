import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Animated, LogBox, StyleSheet, Text, View, Platform, TouchableOpacity, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { bootstrapBackend } from './services/config';
import theme from './src/theme';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { apiService } from './services/apiService';

const SUPPRESSED_LOGS = [
  'Download the React DevTools for a better development experience',
  'Running application "main" with appParams:',
  'Development-level warnings: ON.',
  'Performance optimizations: OFF.',
  'props.pointerEvents is deprecated. Use style.pointerEvents',
  '"shadow*" style props are deprecated. Use "boxShadow"',
  'A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received',
  '6000ms timeout exceeded',
  'fontfaceobserver',
  '[Intervention] Slow network is detected',
  '[StateManager] invalid transition',
  '[LOCAL FALLBACK] Local Ollama is not reachable',
  'net::ERR_CONNECTION_TIMED_OUT',
  '[OLLAMA FALLBACK]',
  'Uncaught (in promise)',
  'POST http',
  'net::ERR',
  'callback @',
  'ProcessMessage @',
  'onmessage @',
  'Permission denied',
  'NotAllowedError',
  'message channel closed',
  'react-devtools',
  '404 (Not Found)',
  '404 Not Found',
  'ERR_CONNECTION_REFUSED',
  'ERR_NETWORK',
  '[API ERROR]',
  '[SAFE ERROR]',
  'timeout exceeded',
  'Failed to load resource',
  'Speech error:',
  'Speech failed to start:',
  '[VoiceOutputEngine]',
  'listener indicated',
  'asyncresponse',
  'Web speech synthesis failed',
  'not available',
  'NotSupportedError',
];

LogBox.ignoreLogs(SUPPRESSED_LOGS);

// Global error handler for unhandled promise rejections (especially from extensions)
if (typeof window !== 'undefined') {
  // Suppress message channel errors from Chrome extensions
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = String(reason);
    
    // Suppress message channel closed errors from extensions
    if (message && (
      message.includes('message channel closed') ||
      message.includes('listener indicated an asynchronous response')
    )) {
      event.preventDefault();
      return;
    }
  });

  // Suppress console errors that are from extensions
  const originalError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const errorStr = String(message);
    if (errorStr.includes('message channel closed') || 
        errorStr.includes('asynchronous response')) {
      return true; // Suppress the error
    }
    if (originalError) {
      return originalError(message, source, lineno, colno, error);
    }
  };
}

const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleInfo = console.info;
const originalConsoleGroup = console.group;
const originalConsoleGroupCollapsed = console.groupCollapsed;

const shouldSuppress = (message) => {
  if (!message) return false;
  const str = typeof message === 'string' ? message : String(message);
  return SUPPRESSED_LOGS.some((ignore) => str.includes(ignore));
};

const createSafeConsoleMethod = (original) => {
  return (...args) => {
    const message = args[0];
    if (shouldSuppress(message)) return;
    if (args.length > 1 && args.some(arg => shouldSuppress(String(arg)))) return;
    original(...args);
  };
};

console.warn = createSafeConsoleMethod(originalConsoleWarn);
console.log = createSafeConsoleMethod(originalConsoleLog);
console.error = createSafeConsoleMethod(originalConsoleError);
console.info = createSafeConsoleMethod(originalConsoleInfo);
console.group = createSafeConsoleMethod(originalConsoleGroup);
console.groupCollapsed = createSafeConsoleMethod(originalConsoleGroupCollapsed);

// Prevent React DevTools suggestion from appearing
if (typeof window !== 'undefined') {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    isDisabled: true,
    supportsFiber: true,
    onCommitRoot: () => {},
    onCommitFiberRoot: () => {},
  };
}

// Import screens
import ChatScreen from './screens/ChatScreen';
import VoiceScreen from './screens/VoiceScreen';
import ResearchScreen from './screens/ResearchScreen';
import MemoryScreen from './screens/MemoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import LearnScreen from './screens/LearnScreen';
import ModuleDetail from './screens/ModuleDetail';
import ScientificDashboard from './src/pages/ScientificDashboard';
import CommunityScreen from './screens/CommunityScreen';
import InboxScreen from './screens/InboxScreen';
import FeedScreen from './screens/FeedScreen';
import LoginScreen from './src/pages/LoginScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import ExploreFeaturesScreen from './src/screens/ExploreFeaturesScreen';
import QuickStartScreen from './src/screens/QuickStartScreen';
import DeveloperDocsScreen from './src/screens/DeveloperDocsScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0B1220',
    card: '#101B2E',
    text: '#F5F7FF',
    border: '#1E2A44',
    primary: '#5A8DFF',
  },
};
const AppStack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const ASSISTANT_CONTEXT = {
  Home: { mode: 'calm', messages: ['Pick one small next step. Progress counts, even in short bursts.', 'Your dashboard is ready. What would you like to move forward?', 'Take a breath, choose a priority, and start there.'] },
  Chat: { mode: 'talk', messages: ['Ask me a question and we can work it through together.', 'Want a concise answer, a deeper explanation, or a source-backed search?', 'Tell me what you are trying to solve and I will help you shape the next step.'] },
  Companion: { mode: 'talk', messages: ['I am here when you are ready to talk something through.', 'Need to think aloud? Start wherever your mind is.', 'One question at a time. I am listening.'] },
  Research: { mode: 'research', messages: ['Follow the question that keeps pulling at your curiosity.', 'A strong research idea often starts with one precise observation.', 'Keep your next experiment small enough to learn from.'] },
  Learn: { mode: 'learn', messages: ['Take the next lesson at your pace. Understanding builds one idea at a time.', 'Try explaining the last concept in your own words. That is a useful test.', 'A focused ten minutes can move a course forward.'] },
  ModuleDetail: { mode: 'learn', messages: ['Take this lesson one concept at a time.', 'Pause after each section and note what changed in your understanding.', 'When you are ready, test yourself before checking the answer.'] },
  Inbox: { mode: 'inbox', messages: ['A thoughtful reply can move a collaboration forward.', 'You can open a request and decide whether it is a good fit.', 'Small, clear messages make research teamwork easier.'] },
  Community: { mode: 'research', messages: ['Sharing a clear question can open a useful conversation.', 'What have you learned that could help another researcher?', 'Good collaboration starts with curiosity and respect.'] },
  Feed: { mode: 'research', messages: ['Save the finding that sparks your next question.', 'Look for the methods behind the headline.', 'One useful paper can change the direction of a project.'] },
  Scientific: { mode: 'research', messages: ['Start with the evidence, then follow what it suggests.', 'Check the assumptions before trusting a result.', 'A careful comparison is often more useful than a complicated one.'] },
  Memory: { mode: 'calm', messages: ['Your saved context is here when you need it.', 'Capture the detail you will want to remember later.', 'A short note now can save a long search later.'] },
  Settings: { mode: 'calm', messages: ['Your preferences are ready to adjust.', 'Make COLI work the way that suits your routine.', 'A small settings change can make repeated tasks easier.'] },
};

const AppNavigator = () => {
  const { user } = useAuth();
  const [activeScreen, setActiveScreen] = useState('Home');
  const [assistantMessage, setAssistantMessage] = useState('');
  const [checkingAssistant, setCheckingAssistant] = useState(false);
  const [robotMood, setRobotMood] = useState('idle');
  const responseIndex = useRef({});
  const robotMotion = useRef(new Animated.Value(0)).current;
  const pageContext = ASSISTANT_CONTEXT[activeScreen] || ASSISTANT_CONTEXT.Home;

  useEffect(() => {
    robotMotion.setValue(0);
    const duration = pageContext.mode === 'inbox' ? 600 : pageContext.mode === 'talk' ? 850 : pageContext.mode === 'learn' ? 1400 : 1100;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(robotMotion, { toValue: 1, duration, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(robotMotion, { toValue: 0, duration, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [activeScreen, robotMotion, pageContext.mode]);

  const getNextScreenMessage = () => {
    const messages = pageContext.messages;
    const previousIndex = responseIndex.current[activeScreen];
    let nextIndex = Math.floor(Math.random() * messages.length);
    if (messages.length > 1 && nextIndex === previousIndex) nextIndex = (nextIndex + 1) % messages.length;
    responseIndex.current[activeScreen] = nextIndex;
    return messages[nextIndex];
  };

  const handleTapColi = async () => {
    if (checkingAssistant) return;
    setCheckingAssistant(true);
    setAssistantMessage('');
    setRobotMood('thinking');
    try {
      if (user?.uuid) {
        const [requestsResponse, conversationsResponse] = await Promise.all([
          apiService.get('/api/inbox/requests'),
          apiService.get('/api/inbox/conversations'),
        ]);
        const requests = requestsResponse?.data?.data || requestsResponse?.data || [];
        const conversations = conversationsResponse?.data?.data || conversationsResponse?.data || [];
        if (Array.isArray(requests) && requests.length > 0) {
          setAssistantMessage(`You have ${requests.length} researcher request${requests.length === 1 ? '' : 's'} waiting in Inbox.`);
          return;
        }
        const newestInbound = Array.isArray(conversations)
          ? conversations
            .filter((conversation) => conversation.lastMessage?.senderId !== user.uuid)
            .sort((left, right) => new Date(right.lastMessage?.createdAt || 0) - new Date(left.lastMessage?.createdAt || 0))[0]
          : null;
        if (newestInbound?.lastMessage) {
          setAssistantMessage(`Message from ${newestInbound.otherUser?.name || 'a researcher'}: ${newestInbound.lastMessage.content || 'sent you a message'}`);
          return;
        }
      }
      setAssistantMessage(getNextScreenMessage());
    } catch (error) {
      setAssistantMessage(getNextScreenMessage());
    } finally {
      setCheckingAssistant(false);
      setRobotMood('speaking');
      setTimeout(() => setRobotMood('idle'), 900);
    }
  };

  const verticalMotion = robotMotion.interpolate({ inputRange: [0, 1], outputRange: [0, pageContext.mode === 'learn' ? -2 : -3] });
  const rotation = robotMotion.interpolate({ inputRange: [0, 0.5, 1], outputRange: pageContext.mode === 'talk' ? ['-4deg', '4deg', '-4deg'] : ['0deg', '0deg', '0deg'] });

  return (
    <View style={styles.appNavigator}>
      <AppStack.Navigator
        initialRouteName="Home"
        sceneContainerStyle={styles.sceneContainer}
        screenOptions={{ headerShown: false }}
        screenListeners={({ route }) => ({ focus: () => setActiveScreen(route.name) })}
      >
        <AppStack.Screen name="Home" component={HomeScreen} />
        <AppStack.Screen name="Chat" component={ChatScreen} />
        <AppStack.Screen name="Companion" component={VoiceScreen} />
        <AppStack.Screen name="Research" component={ResearchScreen} />
        <AppStack.Screen name="Learn" component={LearnScreen} />
        <AppStack.Screen name="ModuleDetail" component={ModuleDetail} />
        <AppStack.Screen name="Scientific" component={ScientificDashboard} />
        <AppStack.Screen name="Community" component={CommunityScreen} />
        <AppStack.Screen name="Inbox" component={InboxScreen} />
        <AppStack.Screen name="Feed" component={FeedScreen} />
        <AppStack.Screen name="Memory" component={MemoryScreen} />
        <AppStack.Screen name="Settings" component={SettingsScreen} />
      </AppStack.Navigator>

      <View style={[styles.assistantRail, assistantMessage ? styles.assistantRailExpanded : null]}>
        <Pressable
          onPress={handleTapColi}
          disabled={checkingAssistant}
          style={({ pressed }) => [styles.assistantTap, pressed && styles.assistantPressed]}
          accessibilityRole="button"
          accessibilityLabel="Tap COLI for a message, motivation, or researcher notifications"
        >
          <Animated.View style={[styles.assistantRobot, { transform: [{ translateY: verticalMotion }, { rotate: rotation }] }]}>
            <View style={[styles.robotAntenna, robotMood === 'speaking' && styles.robotAntennaActive]} />
            <View style={[styles.robotHead, robotMood === 'speaking' && styles.robotHeadActive]}>
              <View style={styles.robotEarLeft} />
              <View style={styles.robotVisor}>
                <View style={[styles.robotEye, robotMood === 'thinking' && styles.robotEyeThinking]} />
                <View style={[styles.robotEye, robotMood === 'thinking' && styles.robotEyeThinking]} />
              </View>
              <View style={styles.robotEarRight} />
            </View>
          </Animated.View>
          <Text style={styles.assistantTapText}>{checkingAssistant ? 'Checking...' : 'Tap COLI'}</Text>
          {checkingAssistant ? <ActivityIndicator size="small" color="#75d8df" /> : null}
        </Pressable>
        {assistantMessage ? <Text style={styles.assistantMessage} accessibilityLiveRegion="polite">{assistantMessage}</Text> : null}
      </View>
    </View>
  );
};

const Stack = createNativeStackNavigator();

// Custom drawer content (only used on mobile)
const CustomDrawerContent = ({ navigation }) => {
  const { logout, user, refreshUser } = useAuth();
  const [displayUser, setDisplayUser] = useState(user);

  useEffect(() => {
    setDisplayUser(user);
    console.log('[Drawer] User updated:', user?.name || user?.email || 'No name/email');
  }, [user]);

  const menuItems = [
    { name: 'Home', icon: '🏠', screen: 'Home' },
    { name: 'Chat', icon: '💬', screen: 'Chat' },
    { name: 'Research', icon: '🔬', screen: 'Research' },
    { name: 'Learn', icon: '📚', screen: 'Learn' },
    { name: 'Companion', icon: '🌐', screen: 'Companion' },
    { name: 'Scientific', icon: '⚛️', screen: 'Scientific' },
    { name: 'Community', icon: '👥', screen: 'Community' },
    { name: 'Inbox', icon: '📩', screen: 'Inbox' },
    { name: 'Feed', icon: '📰', screen: 'Feed' },
    { name: 'Memory', icon: '🧠', screen: 'Memory' },
  ];

  const handleLogout = async () => {
    await logout();
    navigation.closeDrawer();
  };

  const navigateToScreen = (screen) => {
    try {
      console.log('[Drawer] navigateToScreen:', screen);
      // navigate first, then close drawer to avoid race conditions
      if (screen === 'Research') {
        navigation.navigate('MainTabs', { screen: 'Research' });
      } else {
        navigation.navigate('MainTabs', { screen });
      }
      // small delay before closing drawer ensures navigation resolves on web/native
      setTimeout(() => navigation.closeDrawer(), 80);
    } catch (e) {
      console.log('[Drawer] navigation error:', e?.message || e);
    }
  };

  return (
    <LinearGradient
      colors={['#070A16', '#080E1D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.1, y: 1 }}
      style={styles.drawerContainer}
    >
      <ScrollView 
        style={styles.drawerScrollView}
        contentContainerStyle={styles.drawerScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.drawerHeader}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.drawerTitle}>COLI</Text>
              <View style={styles.titleAccent} />
            </View>
            <View style={styles.headerActions}>
              <Pressable style={styles.luxuryIconButton} onPress={() => {
                navigation.closeDrawer();
                navigation.navigate('MainTabs', { screen: 'Settings' });
              }} accessibilityRole="button" accessibilityLabel="Open settings">
                <Ionicons name="settings-outline" size={20} color="#22D3EE" />
              </Pressable>
              <Pressable style={[styles.luxuryIconButton, { marginLeft: 10 }]} onPress={async () => {
                await handleLogout();
              }} accessibilityRole="button" accessibilityLabel="Logout">
                <Ionicons name="log-out-outline" size={18} color="#ff6b6b" />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.luxuryUserContainer}>
          <Pressable 
            onPress={() => {
              navigation.closeDrawer();
              navigation.navigate('MainTabs', { screen: 'Settings' });
            }}
            style={({ pressed }) => [
              styles.userCardContainer,
              pressed && styles.userCardContainerPressed
            ]}
          >
            <LinearGradient
              colors={['rgba(34,211,238,0.12)', 'rgba(139,92,246,0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.userCardGradient}
            >
              <View style={styles.userRow}>
                <View style={styles.luxuryUserAvatar}>
                  <Text style={styles.userAvatarText}>{(displayUser?.name || displayUser?.email || 'U').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userInfoColumn}>
                  <Text style={styles.luxuryUserName} numberOfLines={1}>
                    {displayUser?.name || displayUser?.email || 'Mobile User'}
                  </Text>
                </View>
                <Pressable 
                  style={styles.refreshProfileButton}
                  onPress={async (e) => {
                    e.stopPropagation?.();
                    console.log('[Drawer] Refreshing profile...');
                    await refreshUser?.();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Refresh profile"
                >
                  <Ionicons name="refresh" size={16} color="#22D3EE" />
                </Pressable>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.drawerMenu}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.premiumMenuItem}
              onPress={() => {
                navigation.closeDrawer();
                navigation.navigate('MainTabs', { screen: item.screen });
              }}
              activeOpacity={0.7}
              activeOpacityValue={0.7}
            >
              <View style={styles.menuItemContent}>
                <Text style={styles.drawerItemText}>{item.name}</Text>
                <Text style={styles.drawerItemMeta}>{`Access ${item.name}`}</Text>
              </View>
              <View style={styles.chevronContainer}>
                <Ionicons name="chevron-forward" size={16} color="rgba(34,211,238,0.4)" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.drawerFooter}>
          <Text style={styles.drawerVersion}>v1.0.0</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

// Create wrapper component that only uses GestureHandlerRootView on native
const AppContent = ({ children }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webRoot}>
        {children}
      </View>
    );
  }

  // On native, use the gesture handler
  const { GestureHandlerRootView } = require('react-native-gesture-handler');
  return <GestureHandlerRootView style={styles.root}>{children}</GestureHandlerRootView>;

};

const DrawerNavigator = () => (
  <Drawer.Navigator
    screenOptions={{
      headerShown: false,
      drawerType: 'slide',
      overlayColor: 'transparent',
      drawerStyle: styles.drawerStyle,
      sceneContainerStyle: styles.sceneContainer,
      swipeEdgeWidth: 60,
    }}
    drawerContent={(props) => <CustomDrawerContent {...props} />}
  >
    <Drawer.Screen name="MainTabs" component={AppNavigator} />
  </Drawer.Navigator>
);

const MainApp = () => {
  const { isLoggedIn, authLoading, login } = useAuth();

  if (authLoading) {
    return (
      <AppContent>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      </AppContent>
    );
  }

  return (
    <AppContent>
      <NavigationContainer theme={darkTheme}>
        <StatusBar style="light" />
        {isLoggedIn ? (
          <DrawerNavigator />
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
            <Stack.Screen name="Welcome">
              {(props) => (
                <WelcomeScreen {...props} onGetStarted={() => props.navigation.navigate('Login')} onExplore={() => props.navigation.navigate('ExploreFeatures')} />
              )}
            </Stack.Screen>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLogin={login} />}
            </Stack.Screen>
            <Stack.Screen
              name="ExploreFeatures"
              component={ExploreFeaturesScreen}
              options={{ title: 'Explore Features', presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="QuickStart"
              component={QuickStartScreen}
              options={{ title: 'Quick Start', presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="DeveloperDocs"
              component={DeveloperDocsScreen}
              options={{ title: 'Developer Docs', presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </AppContent>
  );
};

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleUnhandledRejection = (event) => {
        const reason = event?.reason;
        const message = typeof reason === 'string' ? reason : reason?.message || String(reason);
        if (shouldSuppress(message)) {
          event.preventDefault?.();
          return;
        }
      };

      const handleErrorEvent = (event) => {
        const message = event?.message || event?.error?.message || String(event?.error);
        if (shouldSuppress(message)) {
          event.preventDefault?.();
          return true;
        }
      };

      // Override global error handler
      const originalErrorHandler = window.onerror;
      window.onerror = (msg, url, line, col, error) => {
        const fullMsg = `${msg}`;
        if (shouldSuppress(fullMsg) || shouldSuppress(String(error))) {
          return true; // Suppress the error
        }
        return originalErrorHandler ? originalErrorHandler(msg, url, line, col, error) : false;
      };

      // capture unhandled promise rejections and errors
      if (window.addEventListener) {
        window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
        window.addEventListener('error', handleErrorEvent, true);
      }
      window.onunhandledrejection = handleUnhandledRejection;

      bootstrapBackend().catch((error) => {
        originalConsoleWarn('[App] Backend bootstrap failed:', error.message || error);
      });

      return () => {
        window.onerror = originalErrorHandler;
        if (window.removeEventListener) {
          window.removeEventListener('unhandledrejection', handleUnhandledRejection);
          window.removeEventListener('error', handleErrorEvent);
        }
      };
    }

    bootstrapBackend().catch((error) => {
      originalConsoleWarn('[App] Backend bootstrap failed:', error.message || error);
    });
  }, []);

  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  appNavigator: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#0B1220',
  },
  assistantRail: {
    flexShrink: 0,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(117,216,223,0.16)',
    backgroundColor: '#08151c',
  },
  assistantRailExpanded: {
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  assistantTap: {
    minWidth: 96,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    borderRadius: 9,
    backgroundColor: 'rgba(117,216,223,0.1)',
  },
  assistantPressed: { opacity: 0.7 },
  assistantRobot: {
    width: 28,
    height: 27,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  robotAntenna: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: 6,
    borderRadius: 2,
    backgroundColor: '#71c8d0',
  },
  robotAntennaActive: { backgroundColor: '#f4c95d' },
  robotHead: {
    width: 27,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#4d7180',
    backgroundColor: '#1b303a',
  },
  robotHeadActive: { borderColor: '#71c8d0' },
  robotVisor: {
    width: 17,
    height: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    borderRadius: 4,
    backgroundColor: '#07151c',
  },
  robotEye: { width: 3, height: 4, borderRadius: 2, backgroundColor: '#72d9e0' },
  robotEyeThinking: { backgroundColor: '#f4c95d' },
  robotEarLeft: {
    position: 'absolute',
    left: -3,
    width: 3,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#46616d',
  },
  robotEarRight: {
    position: 'absolute',
    right: -3,
    width: 3,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#46616d',
  },
  assistantTapText: { color: '#9fe4e9', fontSize: 11, fontWeight: '800' },
  assistantMessage: {
    flex: 1,
    minWidth: 0,
    color: '#d5e7e9',
    fontSize: 12,
    lineHeight: 17,
  },
  root: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  webRoot: {
    flex: 1,
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#0B1220',
  },
  sceneContainer: {
    backgroundColor: '#0B1220',
  },
  header: {
    backgroundColor: '#08132B',
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  drawerContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 48 : 28,
    backgroundColor: 'transparent',
  },
  drawerScrollView: {
    flex: 1,
  },
  drawerScrollContent: {
    paddingBottom: 32,
  },
  drawerHeader: {
    paddingHorizontal: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34,211,238,0.12)',
    marginBottom: 24,
  },
  titleAccent: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(34,211,238,0.6)',
    marginTop: 8,
    borderRadius: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  drawerTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2.8,
  },
  brandBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(56,189,248,0.16)',
  },
  brandBadgeText: {
    color: theme.colors.cyan,
    fontSize: 12,
    fontWeight: '700',
  },
  drawerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    maxWidth: '80%',
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  luxuryIconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(34,211,238,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22D3EE',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  drawerMenu: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  premiumMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginVertical: 10,
    backgroundColor: 'rgba(34,211,238,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(34,211,238,0.2)',
    shadowColor: '#22D3EE',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
  },
  menuItemGradientIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.04)',
    borderWidth: 1.2,
    borderColor: 'rgba(212,175,55,0.16)',
    shadowColor: '#d4af37',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  drawerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.24)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  drawerIcon: {
    fontSize: 32,
    color: '#22D3EE',
  },
  drawerItemText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  drawerItemMeta: {
    fontSize: 11,
    color: 'rgba(34,211,238,0.6)',
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  drawerFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34,211,238,0.12)',
  },
  luxuryUserContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    marginBottom: 12,
  },
  userCardContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  userCardContainerPressed: {
    opacity: 0.8,
  },
  userCardGradient: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.15)',
  },
  userStatusContainer: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userInfoColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  refreshProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(34,211,238,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  luxuryUserAvatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(34,211,238,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(34,211,238,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(56,189,248,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#22D3EE',
    fontSize: 22,
    fontWeight: '800',
  },
  luxuryUserName: {
    color: '#eef2ff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  userName: {
    color: '#eef2ff',
    fontSize: 16,
    fontWeight: '700',
  },
  luxuryUserStatus: {
    color: '#22D3EE',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  userStatusText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  logoutButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1f2937',
    marginBottom: 12,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  drawerVersion: {
    fontSize: 11,
    color: 'rgba(34,211,238,0.4)',
    textAlign: 'center',
    letterSpacing: 0.8,
    fontWeight: '500',
  },
  drawerStyle: {
    width: 320,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1220',
  },
  loadingText: {
    color: '#E5E9FF',
    fontSize: 16,
    letterSpacing: 0.24,
  },
});
