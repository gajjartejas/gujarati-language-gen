import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Platform,
  useWindowDimensions,
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

  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= 880;
  const playerSize = isWide ? 330 : Math.min(windowWidth - 64, 330);
  const practiceCanvasSize = isWide ? 280 : Math.min(windowWidth - 64, 280);


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
    const scrubberWidth = Math.min(windowWidth - 64, 340);
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
    <ScrollView
      style={[
        styles.screen,
        Platform.OS === 'web' && ({ overflowY: 'visible', flex: 'none', height: 'auto' } as any),
      ]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      scrollEnabled={Platform.OS !== 'web'}
    >
      {/* Top Workspace: Stages Left + Settings Right */}
      <View style={[styles.workspaceLayout, isWide ? styles.workspaceLayoutRow : styles.workspaceLayoutCol]}>
        {/* Left Column: Header Banner + Animated Player Stage */}
        <View style={[styles.stagesColumn, isWide && styles.stagesColumnWide]}>
          {/* Active Character Header Banner */}
          <View style={styles.charHeaderBanner}>
            <View style={styles.charMainInfo}>
              <Text style={styles.charGlyphLarge}>{selectedTemplate.gujarati}</Text>
              <View style={styles.charNames}>
                <Text style={styles.charTitle}>
                  {selectedTemplate.gujarati} ({selectedTemplate.name})
                </Text>
                <Text style={styles.charSubtitle}>
                  {selectedTemplate.category === 'vowel'
                    ? 'Swar Vowel (સ્વર)'
                    : selectedTemplate.category === 'number'
                    ? 'Ank Number (અંક)'
                    : 'Kakko Consonant (વ્યંજન)'}
                </Text>
              </View>
            </View>

            <View style={styles.charMetaTags}>
              <View style={styles.tagAccent}>
                <Text style={styles.tagAccentText}>
                  {selectedTemplate.category?.toUpperCase() || 'KAKKO'}
                </Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {selectedTemplate.strokeCount || 1} Stroke{(selectedTemplate.strokeCount || 1) > 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity style={styles.listenBtn} onPress={handlePronounce} activeOpacity={0.7}>
                <Text style={styles.listenBtnText}>🔊 Listen</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Animated Stroke Player Stage Card */}
          <View style={styles.stageCard}>
            <View style={styles.stageCardHeader}>
              <View style={styles.stageCardHeaderLeft}>
                <Text style={styles.stageCardTitle}>🎬 Stroke-by-Stroke Animation</Text>
              </View>
              <View style={styles.badgeHeaderDtw}>
                <Text style={styles.badgeHeaderDtwText}>Official Order</Text>
              </View>
            </View>

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
                <Text style={styles.stepHintText}>Tap a stroke to jump</Text>
              </View>

              <View style={styles.stepButtonsRow}>
                <TouchableOpacity
                  style={[styles.stepNavBtn, currentStrokeIdx === 0 && styles.stepNavBtnDisabled]}
                  onPress={handlePrevStroke}
                  disabled={currentStrokeIdx === 0}
                  activeOpacity={0.7}
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
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.strokePillText,
                            isSelected && styles.strokePillTextActive,
                          ]}
                        >
                          {idx + 1}
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
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepNavBtnText}>Next ⏭</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Right Column: Settings & Controls Panel */}
        <View style={[styles.settingsPanel, isWide && styles.settingsPanelWide]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelHeaderTitle}>⚙️ Settings & Controls</Text>
          </View>

          {/* Animation Actions */}
          <View style={styles.panelGroup}>
            <Text style={styles.panelLabel}>PLAYBACK</Text>
            <View style={styles.panelBtnGrid}>
              <TouchableOpacity
                style={[styles.btnActionPrimary, isPlaying && styles.btnActionPlaying]}
                onPress={handleTogglePlay}
                activeOpacity={0.7}
              >
                <Text style={styles.btnActionPrimaryText}>
                  {controlledProgress !== null
                    ? '▶ Resume'
                    : isPlaying
                    ? '⏸ Pause'
                    : '▶ Play'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnActionSecondary} onPress={handleReplay} activeOpacity={0.7}>
                <Text style={styles.btnActionSecondaryText}>🔄 Replay</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Speed Selector */}
          <View style={styles.panelGroup}>
            <Text style={styles.panelLabel}>SPEED</Text>
            <View style={styles.speedRow}>
              {[0.5, 0.75, 1.0, 1.5, 2.0].map(s => (
                <TouchableOpacity
                  key={`speed-${s}`}
                  style={[
                    styles.speedPill,
                    playbackSpeed === s && styles.activeSpeedPill,
                  ]}
                  onPress={() => setPlaybackSpeed(s)}
                  activeOpacity={0.7}
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
          </View>

          {/* Options Toggles */}
          <View style={styles.panelGroup}>
            <Text style={styles.panelLabel}>DISPLAY OPTIONS</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Loop Animation</Text>
              <Switch
                value={loopAnimation}
                onValueChange={setLoopAnimation}
                trackColor={{ false: '#21262d', true: '#0369a1' }}
                thumbColor={loopAnimation ? '#38bdf8' : '#6e7681'}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Ghost Guide</Text>
              <Switch
                value={showGhostOutline}
                onValueChange={setShowGhostOutline}
                trackColor={{ false: '#21262d', true: '#0369a1' }}
                thumbColor={showGhostOutline ? '#38bdf8' : '#6e7681'}
              />
            </View>
          </View>

          {/* Practice Pad Section ("Now You Try!") */}
          <View style={styles.panelGroup}>
            <View style={styles.practiceHeaderRow}>
              <Text style={styles.panelLabel}>✍️ TRY IT YOURSELF</Text>
              <TouchableOpacity
                onPress={() => setIsPracticeMode(prev => !prev)}
                activeOpacity={0.7}
              >
                <Text style={styles.togglePracticeText}>
                  {isPracticeMode ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            {isPracticeMode && (
              <View style={styles.practiceBody}>
                <View style={styles.practiceToolbar}>
                  <View style={styles.practiceTraceOption}>
                    <Text style={styles.practiceTraceLabel}>Ghost:</Text>
                    <Switch
                      value={practiceShowGhost}
                      onValueChange={setPracticeShowGhost}
                      trackColor={{ false: '#21262d', true: '#0369a1' }}
                      thumbColor={practiceShowGhost ? '#38bdf8' : '#6e7681'}
                    />
                  </View>

                  <View style={styles.practiceActionsRow}>
                    <TouchableOpacity
                      style={styles.btnActionSecondarySmall}
                      onPress={() => canvasRef.current?.undo()}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.btnActionSecondaryTextSmall}>↩ Undo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnClearSmall}
                      onPress={handleClearPractice}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.btnClearTextSmall}>🗑 Clear</Text>
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
                    </View>
                  </View>
                )}

                <RecognitionScoreCard result={practiceResult} />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Bottom Section: Character Catalog Browser */}
      <View style={styles.catalogSection}>
        <CharacterSelector
          templates={templates}
          selectedTemplate={selectedTemplate}
          onSelect={handleSelectTemplate}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#0a0e14',
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: '100%',
    maxWidth: 1140,
    alignSelf: 'center',
  },

  /* Workspace Layout */
  workspaceLayout: {
    width: '100%',
    marginBottom: 20,
  },
  workspaceLayoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  workspaceLayoutCol: {
    flexDirection: 'column',
    gap: 16,
  },

  /* Left Column: Stages */
  stagesColumn: {
    width: '100%',
    gap: 12,
  },
  stagesColumnWide: {
    flex: 1,
    minWidth: 0,
  },

  /* Character Summary Banner */
  charHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexWrap: 'wrap',
    gap: 10,
  },
  charMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  charGlyphLarge: {
    fontSize: 34,
    fontWeight: '700',
    color: '#ff6b35',
    lineHeight: 38,
  },
  charNames: {
    flexDirection: 'column',
  },
  charTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f0f6fc',
  },
  charSubtitle: {
    fontSize: 12,
    color: '#8b949e',
  },
  charMetaTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: '#30363d',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  tagText: {
    fontSize: 11,
    color: '#8b949e',
    fontWeight: '600',
  },
  tagAccent: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderWidth: 1,
    borderColor: '#ff6b35',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  tagAccentText: {
    fontSize: 11,
    color: '#ff6b35',
    fontWeight: '700',
  },
  listenBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  listenBtnText: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '700',
  },

  /* Stage Card */
  stageCard: {
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  stageCardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stageCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b949e',
  },
  badgeHeaderDtw: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  badgeHeaderDtwText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stageContainer: {
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#30363d',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
  },

  /* Right Settings Panel */
  settingsPanel: {
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 12,
    padding: 16,
    gap: 14,
    width: '100%',
  },
  settingsPanelWide: {
    width: 320,
    flexShrink: 0,
  },
  panelHeader: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
  },
  panelHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f0f6fc',
  },
  panelGroup: {
    gap: 8,
  },
  panelLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8b949e',
    letterSpacing: 0.5,
  },
  panelBtnGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  btnActionPrimary: {
    flex: 1,
    backgroundColor: '#0284c7',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActionPlaying: {
    backgroundColor: '#1e293b',
    borderColor: '#64748b',
  },
  btnActionPrimaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  btnActionSecondary: {
    flex: 1,
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: '#30363d',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActionSecondaryText: {
    color: '#c9d1d9',
    fontSize: 12,
    fontWeight: '600',
  },
  practiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnActionSecondarySmall: {
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: '#30363d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  btnActionSecondaryTextSmall: {
    color: '#c9d1d9',
    fontSize: 11,
  },
  btnClearSmall: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  btnClearTextSmall: {
    color: '#f85149',
    fontSize: 11,
    fontWeight: '700',
  },
  catalogSection: {
    width: '100%',
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  catalogHeader: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
    paddingBottom: 6,
  },
  catalogTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f0f6fc',
  },
  catalogSubtitle: {
    fontSize: 11,
    color: '#8b949e',
    marginTop: 2,
  },
  scrubberContainer: {
    backgroundColor: '#0d1117',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#30363d',
    width: '100%',
  },
  scrubberLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  scrubberTimeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  scrubberStrokeText: {
    color: '#8b949e',
    fontSize: 11,
    fontWeight: '600',
  },
  scrubberTrack: {
    height: 8,
    backgroundColor: '#21262d',
    borderRadius: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 4,
  },
  scrubberThumb: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#0284c7',
  },
  stepControllerCard: {
    backgroundColor: '#0d1117',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#30363d',
    width: '100%',
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepSectionTitle: {
    color: '#8b949e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  stepHintText: {
    color: '#6e7681',
    fontSize: 10,
  },
  stepButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  stepNavBtn: {
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: '#30363d',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  stepNavBtnDisabled: {
    opacity: 0.35,
  },
  stepNavBtnText: {
    color: '#8b949e',
    fontSize: 11,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: '#30363d',
  },
  strokePillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  strokePillText: {
    color: '#8b949e',
    fontSize: 11,
    fontWeight: '600',
  },
  strokePillTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speedPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: '#30363d',
  },
  activeSpeedPill: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  speedText: {
    color: '#8b949e',
    fontSize: 11,
    fontWeight: '600',
  },
  activeSpeedText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  toggleLabel: {
    color: '#c9d1d9',
    fontSize: 12,
  },
  togglePracticeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  practiceBody: {
    gap: 8,
    backgroundColor: '#0d1117',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  practiceToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  practiceTraceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  practiceTraceLabel: {
    color: '#8b949e',
    fontSize: 11,
  },
  practiceActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  canvasWrapper: {
    alignItems: 'center',
    marginVertical: 4,
  },
  celebrationBanner: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#3fb950',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  celebrationEmoji: {
    fontSize: 18,
  },
  celebrationTitle: {
    color: '#3fb950',
    fontSize: 11,
    fontWeight: '700',
  },
});

