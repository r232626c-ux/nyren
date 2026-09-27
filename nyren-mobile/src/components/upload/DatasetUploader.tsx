import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import apiService from '../../../services/apiService';

const ACCEPTED_EXTENSIONS = ['csv', 'tsv', 'txt', 'json', 'xls', 'xlsx', 'fastq', 'fq'];
const MIME_TYPES = {
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  txt: 'text/plain',
  json: 'application/json',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  fastq: 'application/octet-stream',
  fq: 'application/octet-stream',
};

const getFileExtension = (filename) => {
  const parts = filename?.split('.') || [];
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

export default function DatasetUploader({ userId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('No file selected');
  const [summary, setSummary] = useState(null);

  const selectFile = async () => {
    try {
      const result: any = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type !== 'success') {
        return;
      }

      const extension = getFileExtension(result.name || '');
      if (!ACCEPTED_EXTENSIONS.includes(extension)) {
        return Alert.alert(
          'Invalid file',
          'Supported dataset formats: CSV, TSV, TXT, JSON, XLS, XLSX.'
        );
      }

      setFileName(result.name);
      await uploadFile(result, extension);
    } catch (error) {
      console.error('[DatasetUploader] selectFile', error);
      Alert.alert('Upload error', 'Unable to select dataset file.');
    }
  };

  const uploadFile = async (file, extension) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const fileType = MIME_TYPES[extension] || 'application/octet-stream';
      const sanitizedName = file.name || `dataset.${extension || 'csv'}`;

      if (Platform.OS === 'web') {
        const fileBlob = await fetch(file.uri).then((resp) => resp.blob());
        formData.append('file', new File([fileBlob], sanitizedName, { type: fileType }));
      } else {
        const fileData = {
          uri: file.uri,
          name: sanitizedName,
          type: fileType,
        } as any;
        formData.append('file', fileData);
      }

      if (userId) {
        formData.append('userId', userId);
      }
      formData.append('name', sanitizedName);
      formData.append('type', 'gene_expression');

      const response = await apiService.uploadDocument(formData);
      const payload = response?.data ?? response;

      setSummary(payload);
      onUploadComplete && onUploadComplete({
        datasetId: payload.datasetId,
        datasetName: payload.datasetName,
        raw_payload: payload.raw_payload ?? {},
      });
    } catch (error) {
      console.error('[DatasetUploader] uploadFile', error);
      Alert.alert('Upload failed', error.response?.data?.message || error.message || 'Unable to upload dataset.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.uploadButton} onPress={selectFile} disabled={uploading}>
        <Text style={styles.uploadButtonText}>{uploading ? 'Uploading...' : 'Select Dataset File'}</Text>
      </TouchableOpacity>
      <Text style={styles.fileLabel}>{fileName}</Text>
      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>Dataset: {summary.datasetName}</Text>
          <Text style={styles.summaryText}>Rows: {summary.rowCount ?? 'unknown'}</Text>
          <Text style={styles.summaryText}>Headers: {summary.headers?.join(', ') ?? 'N/A'}</Text>
        </View>
      )}
      {uploading && <ActivityIndicator style={styles.indicator} size="small" color="#5A8DFF" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 6,
  },
  uploadButton: {
    backgroundColor: '#3B5EFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  fileLabel: {
    color: '#A8B8DB',
    marginTop: 10,
    fontSize: 13,
  },
  summaryCard: {
    marginTop: 12,
    backgroundColor: '#0D1B33',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1F2E4B',
  },
  summaryText: {
    color: '#E7F1FF',
    fontSize: 13,
    marginBottom: 6,
  },
  indicator: {
    marginTop: 12,
  },
});