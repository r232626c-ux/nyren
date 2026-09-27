import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function AIInterpretationPanel({ interpretation }) {
  if (!interpretation) {
    return (
      <Text style={styles.emptyText}>
        No AI interpretation available for the selected job.
      </Text>
    );
  }

  const model =
    interpretation?.model ||
    interpretation?.provider ||
    "unknown";

  const confidence =
    interpretation?.confidence ??
    interpretation?.confidenceScore ??
    null;

  const meaning =
    interpretation?.biologicalMeaning ||
    interpretation?.biological_meaning ||
    null;

  const recommendations =
    interpretation?.recommendations ||
    interpretation?.recommendation ||
    null;

  const details =
    interpretation?.details ||
    interpretation?.interpretation ||
    interpretation?.summary ||
    null;

  const formattedConfidence =
    typeof confidence === "number"
      ? confidence.toFixed(2)
      : null;

  return (
    <View style={styles.panel}>
      {/* Meta */}
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Model:</Text>
        <Text style={styles.metaValue}>{model}</Text>
      </View>

      {formattedConfidence && (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Confidence:</Text>
          <Text style={styles.metaValue}>{formattedConfidence}</Text>
        </View>
      )}

      {/* Biological Meaning */}
      {meaning && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biological Meaning</Text>
          <Text style={styles.sectionBody}>{String(meaning)}</Text>
        </View>
      )}

      {/* Interpretation */}
      {details && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interpretation</Text>
          <Text style={styles.sectionBody}>{String(details)}</Text>
        </View>
      )}

      {/* Recommendations */}
      {recommendations && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>

          {Array.isArray(recommendations) ? (
            recommendations.map((item, index) => (
              <Text key={index} style={styles.sectionBody}>
                • {String(item)}
              </Text>
            ))
          ) : (
            <Text style={styles.sectionBody}>
              {String(recommendations)}
            </Text>
          )}
        </View>
      )}

      {/* Raw fallback */}
      {!meaning && !details && !recommendations && (
        <ScrollView style={styles.rawBox}>
          <Text style={styles.rawText}>
            {JSON.stringify(interpretation, null, 2)}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#0E1A2F",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E2E4B",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  metaLabel: {
    color: "#9DB9FF",
    fontSize: 12,
    fontWeight: "700",
  },
  metaValue: {
    color: "#E7F1FF",
    fontSize: 12,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    color: "#B5CCFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionBody: {
    color: "#DCE7FF",
    fontSize: 13,
    lineHeight: 20,
  },
  rawBox: {
    marginTop: 12,
    backgroundColor: "#0A1322",
    borderRadius: 14,
    padding: 14,
    maxHeight: 200,
  },
  rawText: {
    color: "#A4B8D8",
    fontSize: 12,
    lineHeight: 18,
  },
  emptyText: {
    color: "#8B9AC9",
    fontSize: 13,
  },
});