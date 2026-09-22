import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Dimensions,
  Platform,
} from 'react-native';
import { CharacterTemplate, Strokes, RecognitionResult } from '../types/handwriting';
import { HandwritingCanvas, HandwritingCanvasRef } from '../components/HandwritingCanvas';
import { GuidedOverlay } from '../components/GuidedOverlay';
import { CharacterSelector } from '../components/CharacterSelector';
import { RecognitionScoreCard } from '../components/RecognitionScoreCard';
import { StrokeDiagnostics } from '../components/StrokeDiagnostics';
import { DrawingReplayModal } from '../components/DrawingReplayModal';
import { WorksheetModal } from '../components/WorksheetModal';
import { evaluateUserDrawing } from '../engine/recognizer';
import { speakGujarati } from '../utils/speech';

interface GuidedPracticeScreenProps {
  templates: CharacterTemplate[];
  initialTemplate?: CharacterTemplate;
}

export const GuidedPracticeScreen: React.FC<GuidedPracticeScreenProps> = ({
  templates,
  initialTemplate,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CharacterTemplate>(
    initialTemplate || templates[0] || ({} as CharacterTemplate)
  );

  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [showStrokeOrder, setShowStrokeOrder] = useState<boolean>(true);
  const [strokeColor, setStrokeColor] = useState<string>('#38bdf8');
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [userStrokes, setUserStrokes] = useState<Strokes>([]);

  // Feature Modals
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [isWorksheetOpen, setIsWorksheetOpen] = useState(false);

  const canvasRef = useRef<HandwritingCanvasRef>(null);

  const screenWidth = Dimensions.get('window').width;
  const canvasSize = Math.min(screenWidth - 48, 360);

  const handleStrokesEnd = useCallback(
    (strokes: Strokes) => {
      setUserStrokes(strokes);
      if (strokes.length === 0) {
        setResult(null);
        return;
      }
      const evalResult = evaluateUserDrawing(strokes, selectedTemplate);
      setResult(evalResult);
    },
    [selectedTemplate]
  );

  const handleStrokesChange = useCallback((strokes: Strokes) => {
    setUserStrokes(strokes);
  }, []);

  const handleSelectTemplate = (t: CharacterTemplate) => {
    setSelectedTemplate(t);
    canvasRef.current?.clear();
    setUserStrokes([]);
    setResult(null);
  };

  const handleClear = () => {
    canvasRef.current?.clear();
    setUserStrokes([]);
    setResult(null);
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  // Real-time Next-Stroke Hint
  const strokeCount = selectedTemplate.strokeCount || 1;
  const drawnCount = userStrokes.length;
  const activeStrokeIndex = drawnCount;

  let nextStrokeHint = '';
  if (drawnCount === 0) {
    nextStrokeHint = `💡 Stroke 1: Start at bubble ① and follow the arrow`;
  } else if (drawnCount < strokeCount) {
    nextStrokeHint = `💡 Next: Start at bubble ${drawnCount + 1} of ${strokeCount} (blue glowing stroke)`;
  } else {
    nextStrokeHint = `✓ All ${strokeCount} strokes drawn! Check accuracy below.`;
  }

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
      {/* Category & Character Picker */}
      <CharacterSelector
        templates={templates}
        selectedTemplate={selectedTemplate}
        onSelect={handleSelectTemplate}
      />

      {/* Real-time Next-Stroke Hint Banner & Pronunciation */}
      <View style={styles.hintBannerRow}>
        <View
          style={[
            styles.hintBanner,
            drawnCount >= strokeCount && styles.hintBannerComplete,
          ]}
        >
          <Text style={styles.hintText}>{nextStrokeHint}</Text>
        </View>

        <TouchableOpacity
          style={styles.listenBtn}
          onPress={() => speakGujarati(selectedTemplate.gujarati, selectedTemplate.transliteration)}
        >
          <Text style={styles.listenBtnText}>🔊 Listen</Text>
        </TouchableOpacity>
      </View>

      {/* Drawing Canvas with Guided Overlay & Real-Time Stroke Hints */}
      <View style={styles.canvasContainer}>
        <HandwritingCanvas
          ref={canvasRef}
          size={canvasSize}
          strokeColor={strokeColor}
          strokeWidth={5}
          onStrokeEnd={handleStrokesEnd}
          onStrokesChange={handleStrokesChange}
        >
          {showOverlay && (
            <GuidedOverlay
              template={selectedTemplate}
              size={canvasSize}
              activeStrokeIndex={activeStrokeIndex}
              showStrokes={true}
              showStrokeOrder={showStrokeOrder}
              showDirectionArrows={true}
            />
          )}
        </HandwritingCanvas>
      </View>

      {/* Canvas Action Bar */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleClear}>
          <Text style={styles.actionBtnText}>🗑 Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleUndo}>
          <Text style={styles.actionBtnText}>↩ Undo</Text>
        </TouchableOpacity>

        {/* Feature Button: Replay & Compare */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.featureBtn]}
          onPress={() => setIsReplayOpen(true)}
          disabled={userStrokes.length === 0}
        >
          <Text
            style={[
              styles.actionBtnText,
              userStrokes.length === 0 && styles.disabledText,
            ]}
          >
            ⏪ Replay
          </Text>
        </TouchableOpacity>

        {/* Feature Button: Print Worksheet */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.worksheetBtn]}
          onPress={() => setIsWorksheetOpen(true)}
        >
          <Text style={styles.actionBtnText}>📄 Worksheet</Text>
        </TouchableOpacity>

        {/* Color Switcher */}
        <View style={styles.colorPalette}>
          {['#38bdf8', '#4ade80', '#f472b6', '#fbbf24'].map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                strokeColor === color && styles.activeColorDot,
              ]}
              onPress={() => setStrokeColor(color)}
            />
          ))}
        </View>
      </View>

      {/* Guide Toggles */}
      <View style={styles.togglesCard}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Show Ghost Guide & Next Stroke Glow</Text>
          <Switch
            value={showOverlay}
            onValueChange={setShowOverlay}
            trackColor={{ false: '#334155', true: '#0284c7' }}
            thumbColor={showOverlay ? '#38bdf8' : '#94a3b8'}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Show Stroke Numbers (1, 2, 3)</Text>
          <Switch
            value={showStrokeOrder}
            onValueChange={setShowStrokeOrder}
            trackColor={{ false: '#334155', true: '#0284c7' }}
            thumbColor={showStrokeOrder ? '#38bdf8' : '#94a3b8'}
          />
        </View>
      </View>

      {/* Recognition ScoreCard */}
      <RecognitionScoreCard result={result} />

      {/* Stroke Diagnostics */}
      <StrokeDiagnostics result={result} />

      {/* Drawing Replay & Compare Modal */}
      <DrawingReplayModal
        visible={isReplayOpen}
        onClose={() => setIsReplayOpen(false)}
        userStrokes={userStrokes}
        template={selectedTemplate}
      />

      {/* Printable Worksheet Modal */}
      <WorksheetModal
        visible={isWorksheetOpen}
        onClose={() => setIsWorksheetOpen(false)}
        template={selectedTemplate}
      />
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
  hintBanner: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  hintBannerComplete: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  hintText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  canvasContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  actionBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionBtnText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  featureBtn: {
    backgroundColor: '#0369a1',
    borderColor: '#38bdf8',
  },
  worksheetBtn: {
    backgroundColor: '#15803d',
    borderColor: '#22c55e',
  },
  disabledText: {
    opacity: 0.5,
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 4,
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  activeColorDot: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  togglesCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  hintBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  listenBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
});
