import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import apiService from '../../../services/apiService';

type Job = {
  id: string;
  status?: string;
  taskType?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type JobTrackerProps = {
  userId?: string | null;
  jobs?: Job[];
  selectedJobId?: string | null;
  onJobSelected: (job: Job) => void;
  onRefresh?: () => void;
};

const statusStyles = {
  pending: { backgroundColor: '#2C3F65', color: '#FBCB00' },
  running: { backgroundColor: '#23406C', color: '#7DD3FC' },
  completed: { backgroundColor: '#1F3B2F', color: '#7EE787' },
  failed: { backgroundColor: '#4B1F28', color: '#FF7E7E' },
};

const normalizeJobs = (jobsInput: any): Job[] => {
  if (Array.isArray(jobsInput)) return jobsInput;
  if (jobsInput && Array.isArray(jobsInput.jobs)) return jobsInput.jobs;
  return [];
};

export default function JobTracker({ userId, jobs: initialJobs = [], selectedJobId, onJobSelected, onRefresh }: JobTrackerProps) {
  const [jobs, setJobs] = useState<Job[]>(normalizeJobs(initialJobs));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setJobs(normalizeJobs(initialJobs));
  }, [initialJobs]);

  const refresh = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getJobs(userId, new AbortController().signal);
      const payload = data?.jobs ?? data;
      setJobs(Array.isArray(payload) ? payload : payload.jobs ?? []);
      onRefresh && onRefresh();
    } catch (err) {
      console.error('[JobTracker] refresh', err);
      setError('Unable to refresh jobs.');
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status) => {
    const key = status?.toLowerCase();
    const style = statusStyles[key] || statusStyles.pending;
    return (
      <View style={[styles.statusBadge, { backgroundColor: style.backgroundColor }]}> 
        <Text style={[styles.statusText, { color: style.color }]}>{status || 'pending'}</Text>
      </View>
    );
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Active jobs</Text>
        <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#5A8DFF" style={{ marginVertical: 12 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : jobs.length === 0 ? (
        <Text style={styles.emptyText}>No analysis jobs available yet.</Text>
      ) : (
        jobs.map((job) => (
          <TouchableOpacity
            key={job.id}
            style={[
              styles.jobCard,
              selectedJobId === job.id && styles.jobCardSelected,
            ]}
            onPress={() => onJobSelected(job)}
          >
            <View style={styles.row}>
              <Text style={styles.jobName}>{job.taskType || 'analysis'}</Text>
              {renderStatus(job.status)}
            </View>
            <Text style={styles.jobMeta}>Job ID: {job.id}</Text>
            <Text style={styles.jobMeta}>Updated: {new Date(job.updatedAt).toLocaleString()}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    color: '#C8D7FF',
    fontWeight: '700',
    fontSize: 15,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#1A2A4B',
    borderWidth: 1,
    borderColor: '#2F4EA0',
  },
  refreshText: {
    color: '#A3C7FF',
    fontSize: 12,
  },
  jobCard: {
    backgroundColor: '#0E1A2F',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#172A45',
    marginBottom: 10,
  },
  jobCardSelected: {
    borderColor: '#5A8DFF',
    backgroundColor: '#152842',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  jobName: {
    color: '#E7F2FF',
    fontWeight: '700',
    fontSize: 14,
  },
  jobMeta: {
    color: '#9BACD8',
    fontSize: 12,
    marginBottom: 2,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyText: {
    color: '#8B9AC1',
    fontSize: 13,
  },
  errorText: {
    color: '#FF8B8B',
    fontSize: 13,
  },
});