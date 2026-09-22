import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { CharacterTemplate } from '../types/handwriting';
import { BenchmarkRunner } from '../components/BenchmarkRunner';

interface BenchmarkScreenProps {
  templates: CharacterTemplate[];
}

export const BenchmarkScreen: React.FC<BenchmarkScreenProps> = ({ templates }) => {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* Benchmark Harness */}
      <BenchmarkRunner templates={templates} />

      {/* Architecture Specs Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Engine Technical Specifications</Text>

        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Architecture:</Text>
          <Text style={styles.specVal}>Hybrid (DTW Deterministic + Tiny CNN Fallback)</Text>
        </View>

        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Normalization:</Text>
          <Text style={styles.specVal}>32 Points Arc-Length Resampling + Centered [0, 1] BBox</Text>
        </View>

        <View style={styles.specRow}>
          <Text style={styles.specLabel}>DTW Configuration:</Text>
          <Text style={styles.specVal}>Sakoe-Chiba Band (Window = 8)</Text>
        </View>

        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Direction Analysis:</Text>
          <Text style={styles.specVal}>Tangent Unit Vectors + Cosine Reverse Detection</Text>
        </View>

        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Scoring Weights:</Text>
          <Text style={styles.specVal}>0.5 Shape + 0.3 Direction + 0.2 Stroke Count</Text>
        </View>

        <View style={styles.specRow}>
          <Text style={styles.specLabel}>ML Fallback Model:</Text>
          <Text style={styles.specVal}>Tiny CNN (Conv2D x2, MaxPool, Dense) ~90KB INT8</Text>
        </View>

        <View style={styles.specRow}>
          <Text style={styles.specLabel}>App Footprint:</Text>
          <Text style={styles.specVal}>&lt; 1.5MB total (Strictly within &lt;10MB limit)</Text>
        </View>

        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Hardware Target:</Text>
          <Text style={styles.specVal}>Low-end 4GB RAM devices (100% offline, &lt;35ms latency)</Text>
        </View>
      </View>

      {/* Dataset Statistics */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Loaded Template Dataset</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{templates.length}</Text>
            <Text style={styles.statLabel}>Total Templates</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>
              {templates.filter(t => t.category === 'consonant').length}
            </Text>
            <Text style={styles.statLabel}>Consonants</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>
              {templates.filter(t => t.category === 'vowel').length}
            </Text>
            <Text style={styles.statLabel}>Vowels</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>
              {templates.filter(t => t.category === 'number').length}
            </Text>
            <Text style={styles.statLabel}>Numbers</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  specLabel: {
    fontSize: 12,
    color: '#94a3b8',
    flex: 1,
  },
  specVal: {
    fontSize: 12,
    color: '#f1f5f9',
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '700',
    color: '#38bdf8',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
});
