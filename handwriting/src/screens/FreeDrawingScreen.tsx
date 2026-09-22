import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CharacterTemplate, Strokes, RecognitionCandidate } from '../types/handwriting';
import { HandwritingCanvas, HandwritingCanvasRef } from '../components/HandwritingCanvas';
import { recognizeHandwriting } from '../engine/recognizer';

interface FreeDrawingScreenProps {
  templates: CharacterTemplate[];
  onSelectCandidate?: (template: CharacterTemplate) => void;
}

export const FreeDrawingScreen: React.FC<FreeDrawingScreenProps> = ({
  templates,
  onSelectCandidate,
}) => {
  const [candidates, setCandidates] = useState<RecognitionCandidate[]>([]);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const canvasRef = useRef<HandwritingCanvasRef>(null);

  const screenWidth = Dimensions.get('window').width;
  const canvasSize = Math.min(screenWidth - 48, 360);

  const runRecognition = useCallback(
    (strokes: Strokes) => {
      if (strokes.length === 0) {
        setCandidates([]);
        return;
      }

      setIsRecognizing(true);
      setTimeout(() => {
        const results = recognizeHandwriting(strokes, templates, {
          enableMlFallback: true,
          maxCandidates: 6,
          categoryFilter: activeCategory === 'all' ? undefined : (activeCategory as any),
        });
        setCandidates(results);
        setIsRecognizing(false);
      }, 20);
    },
    [templates, activeCategory]
  );

  const handleStrokesEnd = (strokes: Strokes) => {
    runRecognition(strokes);
  };

  const handleClear = () => {
    canvasRef.current?.clear();
    setCandidates([]);
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
    if (canvasRef.current) {
      const remaining = canvasRef.current.getStrokes();
      runRecognition(remaining);
    }
  };

  return (
    <ScrollView
      style={[
        styles.screen,
        Platform.OS === 'web' && ({ overflowY: 'visible', flex: 'none', height: 'auto' } as any),
      ]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      scrollEnabled={Platform.OS !== 'web'}
    >
      {/* Category Filter */}
      <View style={styles.filterRow}>
        {[
          { id: 'all', label: 'All' },
          { id: 'consonant', label: 'Consonants' },
          { id: 'vowel', label: 'Vowels' },
          { id: 'number', label: 'Numbers' },
        ].map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.filterPill,
              activeCategory === cat.id && styles.activeFilterPill,
            ]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Text
              style={[
                styles.filterText,
                activeCategory === cat.id && styles.activeFilterText,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Freehand Canvas */}
      <View style={styles.canvasContainer}>
        <HandwritingCanvas
          ref={canvasRef}
          size={canvasSize}
          strokeColor="#38bdf8"
          strokeWidth={5}
          onStrokeEnd={handleStrokesEnd}
        />
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleClear}>
          <Text style={styles.actionBtnText}>🗑 Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleUndo}>
          <Text style={styles.actionBtnText}>↩ Undo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.recognizeBtn]}
          onPress={() => {
            if (canvasRef.current) {
              runRecognition(canvasRef.current.getStrokes());
            }
          }}
        >
          {isRecognizing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.recognizeBtnText}>⚡ Recognize</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Recognition Candidates List */}
      <View style={styles.resultsCard}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Top Predicted Characters</Text>
          {isRecognizing && <ActivityIndicator size="small" color="#38bdf8" />}
        </View>

        {candidates.length === 0 ? (
          <Text style={styles.emptyResultsText}>
            Draw any Gujarati letter or number on the canvas
          </Text>
        ) : (
          <View style={styles.candidateGrid}>
            {candidates.map((cand, idx) => (
              <TouchableOpacity
                key={`cand-${cand.template.id}-${idx}`}
                style={[
                  styles.candidateCard,
                  idx === 0 && styles.topCandidateCard,
                ]}
                onPress={() => onSelectCandidate?.(cand.template)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.rankBadge}>#{idx + 1}</Text>
                  <Text style={styles.confidenceText}>{cand.confidence}%</Text>
                </View>

                <Text style={styles.candidateGujarati}>
                  {cand.template.gujarati}
                </Text>

                <Text style={styles.candidateName}>{cand.template.name}</Text>
                <Text style={styles.candidateMethod}>
                  {cand.method === 'dtw' ? 'DTW Match' : 'ML Fallback'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeFilterPill: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  canvasContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionBtnText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  recognizeBtn: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  recognizeBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  resultsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  emptyResultsText: {
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  candidateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  candidateCard: {
    width: '31%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  topCandidateCard: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  rankBadge: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  candidateGujarati: {
    fontSize: 32,
    color: '#f8fafc',
    marginVertical: 4,
    fontWeight: '700',
  },
  candidateName: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  candidateMethod: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
});
