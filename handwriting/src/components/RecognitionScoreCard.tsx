import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RecognitionResult } from '../types/handwriting';

interface RecognitionScoreCardProps {
  result: RecognitionResult | null;
}

export const RecognitionScoreCard: React.FC<RecognitionScoreCardProps> = ({ result }) => {
  if (!result) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>Draw the character inside the canvas to see real-time score</Text>
      </View>
    );
  }

  const {
    confidence,
    isCorrect,
    shapeScore,
    directionScore,
    strokeCountScore,
    method,
    character,
  } = result;

  const scoreColor = isCorrect ? '#22c55e' : confidence >= 50 ? '#eab308' : '#ef4444';

  return (
    <View style={styles.card}>
      {/* Header: Status and Character */}
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.charBadge}>{character}</Text>
          <View>
            <Text style={[styles.statusText, { color: scoreColor }]}>
              {isCorrect ? '✓ Excellent Drawing' : confidence >= 50 ? 'Needs Improvement' : 'Try Again'}
            </Text>
            <Text style={styles.methodText}>
              Engine: {method === 'dtw' ? '⚡ DTW Deterministic' : '🧠 Tiny CNN ML Fallback'}
            </Text>
          </View>
        </View>

        {/* Confidence Gauge */}
        <View style={[styles.gaugeContainer, { borderColor: scoreColor }]}>
          <Text style={[styles.gaugeValue, { color: scoreColor }]}>{confidence}%</Text>
          <Text style={styles.gaugeLabel}>Accuracy</Text>
        </View>
      </View>

      {/* Metric Breakdown Bars (0.5 Shape, 0.3 Direction, 0.2 Stroke Count) */}
      <View style={styles.breakdownSection}>
        <Text style={styles.breakdownTitle}>Scoring Formula Breakdown</Text>

        {/* Shape (50%) */}
        <View style={styles.metricRow}>
          <View style={styles.metricLabelGroup}>
            <Text style={styles.metricName}>Shape Match (50%)</Text>
            <Text style={styles.metricPercent}>{Math.round(shapeScore * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(100, Math.round(shapeScore * 100))}%`, backgroundColor: '#38bdf8' },
              ]}
            />
          </View>
        </View>

        {/* Direction (30%) */}
        <View style={styles.metricRow}>
          <View style={styles.metricLabelGroup}>
            <Text style={styles.metricName}>Direction (30%)</Text>
            <Text style={styles.metricPercent}>{Math.round(directionScore * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(100, Math.round(directionScore * 100))}%`, backgroundColor: '#a855f7' },
              ]}
            />
          </View>
        </View>

        {/* Stroke Count (20%) */}
        <View style={styles.metricRow}>
          <View style={styles.metricLabelGroup}>
            <Text style={styles.metricName}>Stroke Count (20%)</Text>
            <Text style={styles.metricPercent}>{Math.round(strokeCountScore * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(100, Math.round(strokeCountScore * 100))}%`, backgroundColor: '#ec4899' },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d1117',
    borderRadius: 10,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  emptyText: {
    color: '#8b949e',
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
    paddingBottom: 10,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  charBadge: {
    fontSize: 26,
    color: '#f0f6fc',
    marginRight: 10,
    backgroundColor: '#161b22',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  methodText: {
    fontSize: 11,
    color: '#8b949e',
    marginTop: 2,
  },
  gaugeContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#161b22',
  },
  gaugeValue: {
    fontSize: 15,
    fontWeight: '800',
  },

  gaugeLabel: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  breakdownSection: {
    marginTop: 14,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  metricRow: {
    marginBottom: 8,
  },
  metricLabelGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricName: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  metricPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#0f172a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
