import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import NeonHeader from '../components/NeonHeader';
import { apiService, checkBackendHealth } from '../services/apiService';
import { CONFIG } from '../services/config';

export default function DashboardScreen() {
  const [trends, setTrends] = useState([]);
  const [emotionalStatus, setEmotionalStatus] = useState('calm');
  const [tasks, setTasks] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    checkBackendStatus();
    loadDashboardData();
  }, []);

  const checkBackendStatus = async () => {
    const result = await checkBackendHealth();
    setBackendStatus(result.success ? 'connected' : 'disconnected');
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [trendsData, tasksData] = await Promise.all([
        apiService.getTrends(),
        apiService.getTasks('1'),
      ]);

      setTrends(trendsData.slice(0, 3));
      setTasks(tasksData.slice(0, 5));
      setInsights([
        'Your bond with Coli is growing stronger.',
        'AI trend detection indicates deep learning expansion.',
        'Your task queue has active reminders ready.',
      ]);
      setEmotionalStatus('excited');
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Unable to sync dashboard. Check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <NeonHeader title="Coli Dashboard" subtitle="Nano Banana Command Center" />

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Nano Banana Command Center</Text>
        <Text style={styles.heroSubtitle}>Live pulse of your mission, emotions, and AI response flow.</Text>
        <View style={styles.heroStats}>
          <View style={[styles.heroStat, styles.heroStatSpacing]}>
            <Text style={styles.heroStatLabel}>Mood Pulse</Text>
            <Text style={styles.heroStatValue}>{emotionalStatus}</Text>
          </View>
          <View style={[styles.heroStat, styles.heroStatMiddle, styles.heroStatSpacing]}>
            <Text style={styles.heroStatLabel}>Trend Signals</Text>
            <Text style={styles.heroStatValue}>{trends.length}</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Active Tasks</Text>
            <Text style={styles.heroStatValue}>{tasks.length}</Text>
          </View>
        </View>
      </View>

      {/* Backend Status Indicator */}
      <View style={[styles.statusBar, backendStatus === 'connected' ? styles.statusConnected : styles.statusDisconnected]}>
        <Text style={styles.statusText}>
          {backendStatus === 'connected' 
            ? '✓ Backend Connected' 
            : '✗ Backend Disconnected'}
        </Text>
      </View>

      {loading && <ActivityIndicator size="large" color="#5A8DFF" />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Emotional State</Text>
        <Text style={styles.emotionText}>Current Mood: {emotionalStatus}</Text>
        <Text style={styles.bondText}>Bond Level: Rising</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trend Insights</Text>
        {trends.length === 0 ? (
          <Text style={styles.emptyText}>No trends available yet.</Text>
        ) : (
          trends.map((trend, index) => (
            <View key={index} style={styles.trendItem}>
              <Text style={styles.trendText}>{trend.prediction}</Text>
              <Text style={styles.trendConfidence}>Confidence {Math.round((trend.confidence || 0) * 100)}%</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Tasks</Text>
        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>No active tasks yet.</Text>
        ) : (
          tasks.map((task, index) => (
            <View key={index} style={styles.taskItem}>
              <Text style={styles.taskText}>{task.task || task.description || 'Unnamed task'}</Text>
              <Text style={styles.taskStatus}>{task.status || 'pending'}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Alerts</Text>
        {insights.map((insight, index) => (
          <Text key={index} style={styles.insightText}>• {insight}</Text>
        ))}
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={loadDashboardData}>
        <Text style={styles.refreshButtonText}>Refresh Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 22,
    paddingBottom: 44,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#38bdf8',
    marginBottom: 20,
    letterSpacing: 1,
  },
  heroCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 28,
    elevation: 8,
  },
  heroTitle: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  heroStat: {
    flex: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 18,
    padding: 16,
  },
  heroStatSpacing: {
    marginRight: 12,
  },
  heroStatMiddle: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  heroStatLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  heroStatValue: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '800',
  },
  statusBar: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
    alignItems: 'center',
  },
  statusConnected: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  statusDisconnected: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  statusText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#e2e8f0',
  },
  card: {
    backgroundColor: 'rgba(12, 20, 34, 0.95)',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 7,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#A3C7FF',
    marginBottom: 14,
  },
  emotionText: {
    color: '#E8F1FF',
    fontSize: 16,
    marginBottom: 6,
  },
  bondText: {
    color: '#9BB7FF',
    fontSize: 14,
    marginTop: 4,
  },
  trendItem: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
  },
  trendText: {
    color: '#F5F7FF',
    fontSize: 15,
    lineHeight: 22,
  },
  trendConfidence: {
    color: '#7F99C8',
    fontSize: 12,
    marginTop: 8,
  },
  taskItem: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
  },
  taskText: {
    color: '#F5F7FF',
    fontSize: 15,
  },
  taskStatus: {
    color: '#82C7FF',
    fontSize: 12,
    marginTop: 8,
  },
  insightText: {
    color: '#C5D2FF',
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 22,
  },
  refreshButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#38bdf8',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 18,
    elevation: 6,
  },
  refreshButtonText: {
    color: '#020617',
    fontWeight: '800',
    fontSize: 16,
  },
  errorText: {
    color: '#FF6E6E',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    color: '#8E9AB8',
    fontSize: 14,
    lineHeight: 20,
  },
});