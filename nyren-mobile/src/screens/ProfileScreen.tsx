import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, Alert, ScrollView, Platform } from 'react-native';
import theme from '../theme';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.email || '');
  const [packagePlan, setPackagePlan] = useState(user?.subscription?.plan || user?.package || 'Free');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    setUsername(user?.email || '');
    setPackagePlan(user?.subscription?.plan || user?.package || 'Free');
    setAvatar(user?.avatar || null);
  }, [user]);

  const pickImage = async () => {
    let ImagePicker;
    try {
      ImagePicker = require('expo-image-picker');
    } catch (e) {
      Alert.alert('Image Picker', 'expo-image-picker is not installed. Install it to enable image selection.');
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync?.();
      if (permission?.granted === false) {
        Alert.alert('Permission required', 'Please allow access to your photos to select an avatar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1,1] });
      if (!result.cancelled) {
        setAvatar(result.uri || result.assets?.[0]?.uri);
      }
    } catch (err) {
      console.warn('Image pick error', err);
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const saveProfile = async () => {
    // Placeholder save behavior: wire this to your API or auth context updater
    console.log('Saving profile', { name, username, packagePlan, avatar });
    Alert.alert('Saved', 'Profile changes saved (local only).');
    navigation.goBack();
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Password', 'Please provide both current and new password.');
      return;
    }
    // Placeholder: call your backend password change endpoint
    Alert.alert('Password', 'Password change requested (placeholder).');
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <Pressable style={styles.avatarWrap} onPress={pickImage} accessibilityRole="button">
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>{(name || username || 'U').charAt(0)}</Text>
          </View>
        )}
        <Text style={styles.smallNote}>Tap to change picture</Text>
      </Pressable>

      <View style={styles.field}>
        <Text style={styles.label}>Full name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Full name" placeholderTextColor="#94a3b8" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email / Username</Text>
        <TextInput value={username} onChangeText={setUsername} style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#94a3b8" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Package</Text>
        <Text style={styles.packageText}>{packagePlan}</Text>
        <Text style={styles.smallNote}>To change packages contact support or use the billing portal.</Text>
      </View>

      <View style={styles.separator} />

      <Text style={styles.subTitle}>Change password</Text>
      <View style={styles.field}>
        <Text style={styles.label}>Current password</Text>
        <TextInput value={currentPassword} onChangeText={setCurrentPassword} style={styles.input} placeholder="Current password" secureTextEntry placeholderTextColor="#94a3b8" />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>New password</Text>
        <TextInput value={newPassword} onChangeText={setNewPassword} style={styles.input} placeholder="New password" secureTextEntry placeholderTextColor="#94a3b8" />
      </View>
      <Pressable style={styles.primaryButton} onPress={changePassword}>
        <Text style={styles.primaryButtonText}>Change password</Text>
      </Pressable>

      <View style={styles.footerButtons}>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={saveProfile}>
          <Text style={styles.primaryButtonText}>Save profile</Text>
        </Pressable>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 28,
    paddingBottom: 80,
    backgroundColor: theme.colors.background,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: 0.6,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 22,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 28,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.18)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.12)',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 46,
    fontWeight: '900',
  },
  smallNote: {
    color: '#94a3b8',
    fontSize: 13,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    color: '#E6EEF8',
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 12 : 14,
    color: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    fontSize: 16,
  },
  packageText: {
    color: theme.colors.cyan,
    fontWeight: '900',
    fontSize: 18,
    marginBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginVertical: 18,
  },
  subTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: theme.colors.cyan,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: theme.colors.cyan,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryButtonText: {
    color: theme.colors.midnight,
    fontWeight: '900',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  footerButtons: {
    flexDirection: 'row',
    marginTop: 18,
    justifyContent: 'space-between',
  },
});
