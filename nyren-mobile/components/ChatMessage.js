import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const [showReason, setShowReason] = useState(false);

  return (
    <View style={[styles.row, isUser && styles.right]}>
      <View style={[styles.bubble, isUser ? styles.user : styles.ai]}>
        <Text style={styles.text}>{message.content}</Text>

        {message.structured && typeof message.structured === "object" && (
          <View style={styles.structuredContainer}>
            {Array.isArray(message.structured)
              ? message.structured.map((item, index) => (
                  <Text key={index} style={styles.structuredItem}>
                    • {typeof item === "object" ? JSON.stringify(item) : item}
                  </Text>
                ))
              : Object.entries(message.structured).map(([key, value]) => (
                  <View key={key} style={styles.structuredRow}>
                    <Text style={styles.structuredKey}>{key}:</Text>
                    <Text style={styles.structuredValue}>
                      {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
                    </Text>
                  </View>
                ))}
          </View>
        )}

        {message.sources?.length > 0 && (
          <View style={styles.sources}>
            {message.sources.map((s, i) => (
              <TouchableOpacity key={i} onPress={() => Linking.openURL(s.url)}>
                <Text style={styles.link}>{s.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {message.reasoning?.length > 0 && (
          <>
            <TouchableOpacity onPress={() => setShowReason(!showReason)}>
              <Text style={styles.reasonBtn}>
                {showReason ? "Hide reasoning" : "View reasoning"}
              </Text>
            </TouchableOpacity>

            {showReason &&
              message.reasoning.map((r, i) => (
                <Text key={i} style={styles.reason}>
                  • {r}
                </Text>
              ))}
          </>
        )}
      </View>
    </View>
  );
}

export const TypingIndicator = () => (
  <Text style={styles.typing}>Coli is thinking…</Text>
);

const styles = StyleSheet.create({
  row: {
    marginBottom: 12,
  },
  right: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    ...Platform.select({
      web: { boxShadow: '0px 8px 16px rgba(0,0,0,0.12)' },
      default: { shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 4 },
    }),
  },
  user: {
    backgroundColor: '#1f3a82',
    borderColor: '#2563eb',
  },
  ai: {
    backgroundColor: 'rgba(18,30,54,0.96)',
    borderColor: 'rgba(56,189,248,0.24)',
  },
  text: {
    color: '#E5E7EB',
    fontSize: 15,
    lineHeight: 22,
  },
  link: {
    color: '#38bdf8',
    fontSize: 12,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  typing: {
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  reasonBtn: {
    marginTop: 10,
    color: '#facc15',
    fontSize: 13,
    fontWeight: '700',
  },
  reason: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 6,
    lineHeight: 20,
  },
  structuredContainer: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.16)',
  },
  structuredRow: {
    marginBottom: 10,
  },
  structuredKey: {
    color: '#38bdf8',
    fontWeight: '700',
    marginBottom: 4,
  },
  structuredValue: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 20,
  },
  structuredItem: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
});