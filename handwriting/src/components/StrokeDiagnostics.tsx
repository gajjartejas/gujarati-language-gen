import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RecognitionResult } from '../types/handwriting';

interface StrokeDiagnosticsProps {
  result: RecognitionResult | null;
}

export const StrokeDiagnostics: React.FC<StrokeDiagnosticsProps> = ({ result }) => {
  if (!result) return null;

  const { errors } = result;
  const hasErrors =
    errors.missingStrokes > 0 || errors.extraStrokes > 0 || errors.wrongDirection;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stroke Diagnostics & Errors</Text>

      {/* High-level Error Alerts */}
      <View style={styles.alertsContainer}>
        {errors.missingStrokes > 0 && (
          <View style={[styles.alertBadge, styles.errorBadge]}>
            <Text style={styles.badgeIcon}>⚠️</Text>
            <Text style={styles.badgeText}>
              Missing {errors.missingStrokes} stroke{errors.missingStrokes > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {errors.extraStrokes > 0 && (
          <View style={[styles.alertBadge, styles.warnBadge]}>
            <Text style={styles.badgeIcon}>➕</Text>
            <Text style={styles.badgeText}>
              {errors.extraStrokes} extra stroke{errors.extraStrokes > 1 ? 's' : ''} detected
            </Text>
          </View>
        )}

        {errors.wrongDirection && (
          <View style={[styles.alertBadge, styles.errorBadge]}>
            <Text style={styles.badgeIcon}>🔄</Text>
            <Text style={styles.badgeText}>Stroke drawn in reverse direction</Text>
          </View>
        )}

        {!hasErrors && (
          <View style={[styles.alertBadge, styles.successBadge]}>
            <Text style={styles.badgeIcon}>✓</Text>
            <Text style={styles.badgeText}>All strokes in correct sequence & direction</Text>
          </View>
        )}
      </View>

      {/* Stroke by Stroke Checklist */}
      {errors.strokeDetails && errors.strokeDetails.length > 0 && (
        <View style={styles.detailsList}>
          {errors.strokeDetails.map((s, idx) => (
            <View key={`stroke-diag-${idx}`} style={styles.strokeItem}>
              <View style={styles.strokeHeader}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: s.passed ? '#22c55e' : s.wrongDirection ? '#ef4444' : '#eab308' },
                  ]}
                />
                <Text style={styles.strokeLabel}>Stroke {idx + 1}</Text>
              </View>

              <View style={styles.strokeStats}>
                {s.wrongDirection ? (
                  <Text style={styles.reverseWarning}>Reversed</Text>
                ) : (
                  <Text style={styles.directionGood}>Dir OK</Text>
                )}
                <Text style={styles.shapeText}>
                  Shape: {Math.round(s.shapeScore * 100)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  alertsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  warnBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  successBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgeIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 13,
    color: '#f8fafc',
    fontWeight: '500',
  },
  detailsList: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
    gap: 6,
  },
  strokeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  strokeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  strokeLabel: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  strokeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reverseWarning: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  directionGood: {
    fontSize: 12,
    color: '#22c55e',
  },
  shapeText: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
