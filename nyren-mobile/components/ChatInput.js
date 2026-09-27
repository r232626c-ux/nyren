import React from "react";
import { View, TextInput, TouchableOpacity, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useScreenSize } from '../src/utils/responsive';

export default function ChatInput({
  value,
  onChangeText,
  onSend,
  isLoading,
  onMenu,
  onUploadPress,
  mode,
  setMode,
}) {
  const screenSize = useScreenSize();
  const handleSend = () => {
    try {
      console.log('[ChatInput] handleSend triggered');
    } catch (e) {}
    if (typeof onSend === "function") {
      onSend();
    }
  };

  const inputContainerMaxWidth = screenSize.isDesktop ? 1180 : screenSize.isTablet ? 860 : '100%';

  return (
    <View style={[styles.container, { maxWidth: inputContainerMaxWidth, alignSelf: 'center' }] }>

      {/* MODE TOGGLE */}
      <View style={[styles.modeBox, { marginRight: screenSize.isPhone ? 6 : 10 }]}>
        <TouchableOpacity onPress={() => setMode("chat")} style={styles.modeBtn}>
          <Ionicons
            name="chatbubble"
            size={16}
            color={mode === "chat" ? "#38bdf8" : "#64748b"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode("search")} style={styles.modeBtn}>
          <Ionicons
            name="search"
            size={16}
            color={mode === "search" ? "#38bdf8" : "#64748b"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode("reason")} style={styles.modeBtn}>
          <Ionicons
            name="bulb"
            size={16}
            color={mode === "reason" ? "#facc15" : "#64748b"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode("docs")} style={styles.modeBtn}>
          <Ionicons
            name="document"
            size={16}
            color={mode === "docs" ? "#10b981" : "#64748b"}
          />
        </TouchableOpacity>
      </View>

      {/* MENU */}
      <TouchableOpacity onPress={onMenu} style={styles.iconBtn}>
        <Ionicons name="menu" size={20} color="#9ca3af" />
      </TouchableOpacity>

      {/* INPUT */}
      <TextInput
        style={styles.input}
        placeholder="Message Coli..."
        placeholderTextColor="#6b7280"
        value={value}
        onChangeText={onChangeText}
        returnKeyType="send"
        blurOnSubmit={false}
        multiline={false}
        onKeyPress={(e) => {
          if (e.nativeEvent.key === "Enter") {
            handleSend();
          }
        }}
        onSubmitEditing={handleSend}
      />

      {/* FILE UPLOAD */}
      <TouchableOpacity onPress={onUploadPress} style={styles.iconBtn}>
        <Ionicons name="attach" size={20} color="#facc15" />
      </TouchableOpacity>

      {/* SEND */}
      <Pressable
        onPress={handleSend}
        disabled={isLoading}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.sendBtn}
      >
        <Ionicons
          name="send"
          size={20}
          color={isLoading ? "#64748b" : "#38bdf8"}
        />
      </Pressable>

    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 10,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 5,
  },

  modeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(148,163,184,0.18)',
    flexShrink: 1,
  },

  modeBtn: {
    padding: 8,
    borderRadius: 12,
  },

  input: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 44,
    maxWidth: '100%',
  },

  iconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  sendBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(56,189,248,0.18)',
  },
});