import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Dimensions,
} from 'react-native';
import { CharacterTemplate, Strokes, RecognitionResult } from '../types/handwriting';
import { AnimatedStrokePlayer } from '../components/AnimatedStrokePlayer';
import { CharacterSelector } from '../components/CharacterSelector';
import { HandwritingCanvas, HandwritingCanvasRef } from '../components/HandwritingCanvas';
import { RecognitionScoreCard } from '../components/RecognitionScoreCard';
import { GuidedOverlay } from '../components/GuidedOverlay';
import { evaluateUserDrawing } from '../engine/recognizer';
import { speakGujarati } from '../utils/speech';

interface AnimatedDrawingScreenProps {
  templates: CharacterTemplate[];
  initialTemplate?: CharacterTemplate;
}

export const AnimatedDrawingScreen: React.FC<AnimatedDrawingScreenProps> = ({
  templates,
  initialTemplate,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CharacterTemplate>(
    initialTemplate || templates[0] || ({} as CharacterTemplate)
  );

  // Animation Controls State
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [loopAnimation, setLoopAnimation] = useState(true);
  const [showGhostOutline, setShowGhostOutline] = useState(true);

  // Scrubber & Step Navigation
  const [controlledProgress, setControlledProgress] = useState<number | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0.0);
  const [currentStrokeIdx, setCurrentStrokeIdx] = useState(0);

  // Interactive Practice Pad State
  const [practiceStrokes, setPracticeStrokes] = useState<Strokes>([]);
  const [practiceResult, setPracticeResult] = useState<RecognitionResult | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState(true);
  const [practiceShowGhost, setPracticeShowGhost] = useState(false);

  const canvasRef = useRef<HandwritingCanvasRef>(null);

  const screenWidth = Dimensions.get('window').width;
  const playerSize = Math.min(screenWidth - 48, 340);
  const practiceCanvasSize = Math.min(screenWidth - 48, 320);

  // Calculate cumulative stroke intervals to support jump-to-stroke
  const strokeIntervals = useMemo(() => {
    if (!selectedTemplate || !selectedTemplate.strokes || selectedTemplate.strokes.length === 0) {
      return [];
    }
    const totalLength = selectedTemplate.strokes.reduce((sum, s) => sum + (s.length || 1), 0);
    let cumulative = 0;
    return selectedTemplate.strokes.map(s => {
      const fraction = (s.length || 1) / totalLength;
      const start = cumulative;
      cumulative += fraction;
      return { start, end: cumulative, fraction };
    });
  }, [selectedTemplate]);

  const handleSelectTemplate = (t: CharacterTemplate) => {
    setSelectedTemplate(t);
    setControlledProgress(null);
    setIsPlaying(true);
    canvasRef.current?.clear();
    setPracticeStrokes([]);
    setPracticeResult(null);
  };

  const handleReplay = () => {
    setControlledProgress(null);
    setIsPlaying(false);
    setTimeout(() => {
      setIsPlaying(true);
    }, 50);
  };

  const handleTogglePlay = () => {
    if (controlledProgress !== null) {
      setControlledProgress(null);
      setIsPlaying(true);
    } else {
      setIsPlaying(prev => !prev);
    }
  };

  const handleJumpToStroke = (idx: number) => {
    const interval = strokeIntervals[idx];
    if (interval) {
      setIsPlaying(false);
      setControlledProgress(interval.start + 0.01);
    }
  };

  const handlePrevStroke = () => {
    const prevIdx = Math.max(0, currentStrokeIdx - 1);
    handleJumpToStroke(prevIdx);
  };

  const handleNextStroke = () => {
    const nextIdx = Math.min((selectedTemplate.strokeCount || 1) - 1, currentStrokeIdx + 1);
    handleJumpToStroke(nextIdx);
  };

  const handleProgressChange = (progress: number, activeStroke: number) => {
    setCurrentProgress(progress);
    setCurrentStrokeIdx(activeStroke);
  };

  const handleScrubberPress = (e: any) => {
    const { locationX } = e.nativeEvent;
    const scrubberWidth = Math.min(screenWidth - 64, 340);
    const fraction = Math.max(0, Math.min(1, locationX / scrubberWidth));
    setIsPlaying(false);
    setControlledProgress(fraction);
  };

  const handlePracticeStrokeEnd = (strokes: Strokes) => {
    setPracticeStrokes(strokes);
    if (strokes.length === 0) {
      setPracticeResult(null);
      return;
    }
    const evalResult = evaluateUserDrawing(strokes, selectedTemplate);
    setPracticeResult(evalResult);
  };

  const handleClearPractice = () => {
    canvasRef.current?.clear();
    setPracticeStrokes([]);
    setPracticeResult(null);
  };

  const handlePronounce = () => {
    speakGujarati(selectedTemplate.gujarati, selectedTemplate.transliteration);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* Category & Character Selector */}
      <CharacterSelector
        templates={templates}
        selectedTemplate={selectedTemplate}
        onSelect={handleSelectTemplate}
      />

      {/* Tutorial Header */}
      <View style={styles.tutorialHeader}>
        <View style={styles.badgeRow}>
          <Text style={styles.titleBadge}>🎬 STROKE-BY-STROKE ANIMATION</Text>
          <Text style={styles.charSummary}>
            {selectedTemplate.gujarati} ({selectedTemplate.name}) • {selectedTemplate.strokeCount} Stroke{selectedTemplate.strokeCount > 1 ? 's' : ''}
          </Text>
        </View>

        <Text style={styles.instructionText}>
          Watch the glowing pen trace each stroke in the exact official order and direction.
        </Text>

        {/* Audio Pronunciation Button */}
        <TouchableOpacity style={styles.listenBtn} onPress={handlePronounce}>
          <Text style={styles.listenBtnText}>
            🔊 Listen Pronunciation: "{selectedTemplate.gujarati}" ({selectedTemplate.transliteration})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Animated Stroke Player Stage */}
      <View style={styles.stageContainer}>
        <AnimatedStrokePlayer
          template={selectedTemplate}
          size={playerSize}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          loop={loopAnimation}
          controlledProgress={controlledProgress}
          onPlayStateChange={setIsPlaying}
          onProgressChange={handleProgressChange}
          showGhostOutline={showGhostOutline}
        />
      </View>

      {/* Interactive Scrubber Bar */}
      <View style={styles.scrubberContainer}>
        <View style={styles.scrubberLabelRow}>
          <Text style={styles.scrubberTimeText}>
            Progress: {Math.round(currentProgress * 100)}%
          </Text>
          <Text style={styles.scrubberStrokeText}>
            Stroke {currentStrokeIdx + 1} of {selectedTemplate.strokeCount || 1}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.scrubberTrack}
          onPress={handleScrubberPress}
        >
          <View
            style={[
              styles.scrubberFill,
              { width: `${Math.round(currentProgress * 100)}%` },
            ]}
          />
          <View
            style={[
              styles.scrubberThumb,
              { left: `${Math.max(0, Math.min(97, currentProgress * 100))}%` },
            ]}
          />
        </TouchableOpacity>
      </View>

      {/* Step-by-Step Stroke Controller */}
      <View style={styles.stepControllerCard}>
        <View style={styles.stepHeaderRow}>
          <Text style={styles.stepSectionTitle}>STROKE BREAKDOWN</Text>
          <Text style={styles.stepHintText}>Tap a stroke to inspect</Text>
        </View>

        <View style={styles.stepButtonsRow}>
          <TouchableOpacity
            style={[styles.stepNavBtn, currentStrokeIdx === 0 && styles.stepNavBtnDisabled]}
            onPress={handlePrevStroke}
            disabled={currentStrokeIdx === 0}
          >
            <Text style={styles.stepNavBtnText}>⏮ Prev</Text>
          </TouchableOpacity>

          <View style={styles.strokePillsRow}>
            {selectedTemplate.strokes?.map((_, idx) => {
              const isSelected = idx === currentStrokeIdx;
              return (
                <TouchableOpacity
                  key={`stroke-pill-${idx}`}
                  style={[styles.strokePill, isSelected && styles.strokePillActive]}
                  onPress={() => handleJumpToStroke(idx)}
                >
                  <Text
                    style={[
                      styles.strokePillText,
                      isSelected && styles.strokePillTextActive,
                    ]}
                  >
                    Stroke {idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.stepNavBtn,
              currentStrokeIdx >= (selectedTemplate.strokeCount || 1) - 1 &&
                styles.stepNavBtnDisabled,
            ]}
            onPress={handleNextStroke}
            disabled={currentStrokeIdx >= (selectedTemplate.strokeCount || 1) - 1}
          >
            <Text style={styles.stepNavBtnText}>Next ⏭</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Animation Control Deck */}
      <View style={styles.controlDeck}>
        {/* Play/Pause & Replay */}
        <View style={styles.mainButtonsRow}>
          <TouchableOpacity
            style={[styles.ctrlBtn, styles.playBtn]}
            onPress={handleTogglePlay}
          >
            <Text style={styles.playBtnText}>
              {controlledProgress !== null
                ? '▶ Resume Play'
                : isPlaying
                ? '⏸ Pause'
                : '▶ Play'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ctrlBtn} onPress={handleReplay}>
            <Text style={styles.ctrlBtnText}>🔁 Replay from Start</Text>
          </TouchableOpacity>
        </View>

        {/* Playback Speed Selector */}
        <View style={styles.speedRow}>
          <Text style={styles.speedLabel}>Speed:</Text>
          {[0.5, 1.0, 1.5, 2.0].map(s => (
            <TouchableOpacity
              key={`speed-${s}`}
              style={[
                styles.speedPill,
                playbackSpeed === s && styles.activeSpeedPill,
              ]}
              onPress={() => setPlaybackSpeed(s)}
            >
              <Text
                style={[
                  styles.speedText,
                  playbackSpeed === s && styles.activeSpeedText,
                ]}
              >
                {s}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Options Row (Loop & Ghost switches) */}
        <View style={styles.optionsRow}>
          <View style={styles.optionItem}>
            <Text style={styles.optionLabel}>Loop Animation</Text>
            <Switch
              value={loopAnimation}
              onValueChange={setLoopAnimation}
              trackColor={{ false: '#334155', true: '#0284c7' }}
              thumbColor={loopAnimation ? '#38bdf8' : '#94a3b8'}
            />
          </View>

          <View style={styles.optionItem}>
            <Text style={styles.optionLabel}>Ghost Guide</Text>
            <Switch
              value={showGhostOutline}
              onValueChange={setShowGhostOutline}
              trackColor={{ false: '#334155', true: '#0284c7' }}
              thumbColor={showGhostOutline ? '#38bdf8' : '#94a3b8'}
            />
          </View>
        </View>
      </View>

      {/* Practice Pad Section ("Now You Try!") */}
      <View style={styles.practiceSection}>
        <View style={styles.practiceHeader}>
          <View>
            <Text style={styles.practiceTitle}>✍️ NOW YOUR TURN TO WRITE</Text>
            <Text style={styles.practiceSubtitle}>
              Practice drawing what you just watched above
            </Text>
          </View>
          <TouchableOpacity
            style={styles.togglePracticeBtn}
            onPress={() => setIsPracticeMode(prev => !prev)}
          >
            <Text style={styles.togglePracticeText}>
              {isPracticeMode ? 'Hide Pad' : 'Show Pad'}
            </Text>
          </TouchableOpacity>
        </View>

        {isPracticeMode && (
          <View style={styles.practiceBody}>
            {/* Practice Pad Controls: Ghost Trace Switch */}
            <View style={styles.practiceToolbar}>
              <View style={styles.practiceTraceOption}>
                <Text style={styles.practiceTraceLabel}>Trace Ghost Guide:</Text>
                <Switch
                  value={practiceShowGhost}
                  onValueChange={setPracticeShowGhost}
                  trackColor={{ false: '#334155', true: '#0284c7' }}
                  thumbColor={practiceShowGhost ? '#38bdf8' : '#94a3b8'}
                />
              </View>

              <View style={styles.practiceActionsRow}>
                <TouchableOpacity
                  style={styles.undoBtn}
                  onPress={() => canvasRef.current?.undo()}
                >
                  <Text style={styles.undoBtnText}>↩ Undo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={handleClearPractice}
                >
                  <Text style={styles.clearBtnText}>🗑 Clear</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Canvas with optional Ghost Tracing Overlay */}
            <View style={styles.canvasWrapper}>
              <HandwritingCanvas
                ref={canvasRef}
                size={practiceCanvasSize}
                strokeColor="#38bdf8"
                strokeWidth={5}
                onStrokeEnd={handlePracticeStrokeEnd}
              >
                {practiceShowGhost && (
                  <GuidedOverlay
                    template={selectedTemplate}
                    size={practiceCanvasSize}
                    showStrokes={true}
                    showStrokeOrder={true}
                    showDirectionArrows={true}
                  />
                )}
              </HandwritingCanvas>
            </View>

            {/* High-Score Celebration Banner */}
            {practiceResult && practiceResult.confidence >= 80 && (
              <View style={styles.celebrationBanner}>
                <Text style={styles.celebrationEmoji}>🎉</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.celebrationTitle}>
                    Outstanding Handwriting! ({practiceResult.confidence}%)
                  </Text>
                  <Text style={styles.celebrationSubtitle}>
                    You mastered the stroke flow and direction of "{selectedTemplate.gujarati}"!
                  </Text>
                </View>
              </View>
            )}

            {/* Live Scorecard for Practice Pad */}
            <RecognitionScoreCard result={practiceResult} />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  tutorialHeader: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  titleBadge: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  charSummary: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  instructionText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  listenBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#0284c7',
    alignItems: 'center',
  },
  listenBtnText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  stageContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  scrubberContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  scrubberLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scrubberTimeText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  scrubberStrokeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  scrubberTrack: {
    height: 10,
    backgroundColor: '#1e293b',
    borderRadius: 5,
    position: 'relative',
    justifyContent: 'center',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 5,
  },
  scrubberThumb: {
    position: 'absolute',
    top: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#0284c7',
  },
  stepControllerCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepSectionTitle: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  stepHintText: {
    color: '#64748b',
    fontSize: 11,
  },
  stepButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  stepNavBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stepNavBtnDisabled: {
    opacity: 0.35,
  },
  stepNavBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  strokePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    flex: 1,
  },
  strokePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  strokePillActive: {
    backgroundColor: '#0284c7',
  },
  strokePillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  strokePillTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  controlDeck: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  mainButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  ctrlBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  playBtn: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  ctrlBtnText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  playBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  speedLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  speedPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeSpeedPill: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  speedText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeSpeedText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  practiceSection: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  practiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  practiceTitle: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  practiceSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  togglePracticeBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  togglePracticeText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  practiceBody: {
    gap: 12,
  },
  practiceToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#131d33',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  practiceTraceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  practiceTraceLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  practiceActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  undoBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  undoBtnText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  clearBtn: {
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearBtnText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
  },
  canvasWrapper: {
    alignItems: 'center',
  },
  celebrationBanner: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  celebrationEmoji: {
    fontSize: 24,
  },
  celebrationTitle: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '800',
  },
  celebrationSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
  },
});
