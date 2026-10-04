import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Share } from 'react-native';
import theme from '../theme';

const PROJECT_GITHUB_URL = 'https://github.com';

export default function QuickStartScreen({ navigation }) {
  const openProjectGitHub = async () => {
    try {
      const canOpen = await Linking.canOpenURL(PROJECT_GITHUB_URL);
      if (canOpen) {
        await Linking.openURL(PROJECT_GITHUB_URL);
        return;
      }
      await Share.share({
        message: `Check out the project on GitHub: ${PROJECT_GITHUB_URL}`,
        url: PROJECT_GITHUB_URL,
      });
    } catch (error) {
      await Share.share({
        message: `Check out the project on GitHub: ${PROJECT_GITHUB_URL}`,
        url: PROJECT_GITHUB_URL,
      });
    }
  };

  const shareProjectLink = async () => {
    try {
      await Share.share({
        message: `Check out this project on GitHub: ${PROJECT_GITHUB_URL}`,
        url: PROJECT_GITHUB_URL,
      });
    } catch (error) {
      console.warn('[QuickStartScreen] Share failed:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Quick Start</Text>

      <Text style={styles.paragraph}>
        Welcome to COLI. This quick start walks you through connecting an account, configuring API
        keys, and starting your first chat or search.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Create an account</Text>
        <Text style={styles.sectionText}>Sign up through the app and verify your email.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Configure API</Text>
        <Text style={styles.sectionText}>In backend, set OPENAI_API_KEY and optional search keys.</Text>
      </View>

      <Pressable style={styles.openBtn} onPress={openProjectGitHub}>
        <Text style={styles.openText}>Open GitHub</Text>
      </Pressable>

      <Pressable style={[styles.openBtn, styles.shareBtn]} onPress={shareProjectLink}>
        <Text style={styles.openText}>Share Project Link</Text>
      </Pressable>

      <Pressable style={styles.close} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: theme.colors.background,
    minHeight: '100%',
  },
  title: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  paragraph: { color: theme.colors.textSecondary, marginBottom: 12 },
  section: { marginBottom: 12, padding: 12, backgroundColor: theme.colors.surface, borderRadius: 10 },
  sectionTitle: { color: theme.colors.cyan, fontWeight: '700', marginBottom: 6 },
  sectionText: { color: theme.colors.textPrimary },
  openBtn: { marginTop: 12, padding: 12, backgroundColor: theme.colors.purple, borderRadius: 10, alignItems: 'center' },
  shareBtn: { backgroundColor: theme.colors.cyan },
  openText: { color: '#fff', fontWeight: '700' },
  close: { marginTop: 18, alignSelf: 'center' },
  closeText: { color: theme.colors.textSecondary },
});
