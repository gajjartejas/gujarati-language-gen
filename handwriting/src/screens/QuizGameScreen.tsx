import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { CharacterTemplate, Strokes, RecognitionResult } from '../types/handwriting';
import { HandwritingCanvas, HandwritingCanvasRef } from '../components/HandwritingCanvas';
import { GuidedOverlay } from '../components/GuidedOverlay';
import { AnimatedStrokePlayer } from '../components/AnimatedStrokePlayer';
import { evaluateUserDrawing } from '../engine/recognizer';
import { speakGujarati } from '../utils/speech';
import {
  VOWEL_TEMPLATES,
  CONSONANT_TEMPLATES,
  NUMBER_TEMPLATES,
  KAKKO_TEMPLATES,
} from '../data/characters';
import { getWordAssociation } from '../data/wordAssociations';
import { ModeSelector, ActiveTab } from '../components/ModeSelector';

type QuizLevel = 'vowels' | 'consonants' | 'numbers' | 'mixed';
type QuizMode = 'picture' | 'audio';

interface QuizGameScreenProps {
  templates?: CharacterTemplate[];
  onSelectTemplate?: (template: CharacterTemplate) => void;
  activeTab?: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
}

export const QuizGameScreen: React.FC<QuizGameScreenProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const [level, setLevel] = useState<QuizLevel>('vowels');
  const [mode, setMode] = useState<QuizMode>('picture');

  // Round / Question state
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userStrokes, setUserStrokes] = useState<Strokes>([]);
  const [evaluationResult, setEvaluationResult] = useState<RecognitionResult | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  // Score & Streak
  const [starsTotal, setStarsTotal] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Peek Solution & Hints
  const [showGhostPeek, setShowGhostPeek] = useState(false);
  const [showAnimatedModal, setShowAnimatedModal] = useState(false);
  const [isRoundFinished, setIsRoundFinished] = useState(false);

  const canvasRef = useRef<HandwritingCanvasRef>(null);

  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= 880;
  const canvasSize = isWide ? 330 : Math.min(windowWidth - 64, 330);

  // Active pool of characters for current level
  const characterPool = useMemo(() => {
    switch (level) {
      case 'vowels':
        return VOWEL_TEMPLATES;
      case 'consonants':
        return CONSONANT_TEMPLATES;
      case 'numbers':
        return NUMBER_TEMPLATES;
      case 'mixed':
      default:
        return KAKKO_TEMPLATES.slice(0, 20);
    }
  }, [level]);

  // Round questions (5 questions per round)
  const roundQuestions = useMemo(() => {
    const shuffled = [...characterPool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  }, [characterPool, level]);

  const currentQuestion = roundQuestions[questionIndex] || roundQuestions[0];
  const wordClue = useMemo(() => {
    if (!currentQuestion) return null;
    return getWordAssociation(currentQuestion.gujarati);
  }, [currentQuestion]);

  // Reset question state
  const resetCanvas = () => {
    canvasRef.current?.clear();
    setUserStrokes([]);
    setEvaluationResult(null);
    setHasChecked(false);
    setShowGhostPeek(false);
  };

  // Play audio automatically when entering question or switching mode
  useEffect(() => {
    resetCanvas();
    if (currentQuestion && mode === 'audio') {
      const timer = setTimeout(() => {
        speakGujarati(currentQuestion.gujarati, currentQuestion.transliteration);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [questionIndex, level, mode]);

  const handlePlayAudio = () => {
    if (currentQuestion) {
      speakGujarati(currentQuestion.gujarati, currentQuestion.transliteration);
    }
  };

  const handlePeekGhost = () => {
    setShowGhostPeek(true);
    setTimeout(() => {
      setShowGhostPeek(false);
    }, 2000);
  };

  const handleStrokesEnd = (strokes: Strokes) => {
    setUserStrokes(strokes);
  };

  // Evaluate user submission
  const handleCheckAnswer = () => {
    if (userStrokes.length === 0 || !currentQuestion) return;

    const result = evaluateUserDrawing(userStrokes, currentQuestion);
    setEvaluationResult(result);
    setHasChecked(true);

    const conf = result.confidence;
    if (conf >= 70) {
      const earnedStars = conf >= 85 ? 3 : 2;
      setStarsTotal(prev => prev + earnedStars);
      setCurrentStreak(prev => {
        const next = prev + 1;
        setBestStreak(b => Math.max(b, next));
        return next;
      });
      speakGujarati(currentQuestion.gujarati, currentQuestion.transliteration);
    } else if (conf >= 50) {
      setStarsTotal(prev => prev + 1);
      setCurrentStreak(0);
    } else {
      setCurrentStreak(0);
    }
  };

  const handleNextQuestion = () => {
    if (questionIndex + 1 < roundQuestions.length) {
      setQuestionIndex(prev => prev + 1);
    } else {
      setIsRoundFinished(true);
    }
  };

  const handleRestartRound = () => {
    setQuestionIndex(0);
    setStarsTotal(0);
    setCurrentStreak(0);
    setIsRoundFinished(false);
    resetCanvas();
  };

  const earnedStars = useMemo(() => {
    if (!evaluationResult) return 0;
    if (evaluationResult.confidence >= 85) return 3;
    if (evaluationResult.confidence >= 70) return 2;
    if (evaluationResult.confidence >= 50) return 1;
    return 0;
  }, [evaluationResult]);

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
      {/* 2-Column Workspace Layout */}
      <View style={[styles.workspaceLayout, isWide ? styles.workspaceLayoutRow : styles.workspaceLayoutCol]}>
        {/* Left Column: Question Clue Banner + Canvas Stage */}
        <View style={[styles.stagesColumn, isWide && styles.stagesColumnWide]}>
          {/* Question Clue Banner */}
          <View style={styles.promptCard}>
            {mode === 'picture' ? (
              <View style={styles.promptContent}>
                <Text style={styles.promptEmoji}>{wordClue?.emoji || '✍️'}</Text>
                <View style={styles.promptTextWrapper}>
                  <Text style={styles.promptTitle}>Write starting letter for:</Text>
                  <Text style={styles.promptWord}>
                    {wordClue?.word} ({wordClue?.meaning})
                  </Text>
                  <Text style={styles.promptSub}>
                    Letter sound: "{currentQuestion?.transliteration}"
                  </Text>
                </View>
                <TouchableOpacity style={styles.soundMiniBtn} onPress={handlePlayAudio} activeOpacity={0.7}>
                  <Text style={styles.soundMiniText}>🔊</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.promptContent}>
                <Text style={styles.promptEmoji}>🎧</Text>
                <View style={styles.promptTextWrapper}>
                  <Text style={styles.promptTitle}>Listen and write the letter:</Text>
                  <Text style={styles.promptWord}>
                    "{currentQuestion?.transliteration}"
                  </Text>
                  <Text style={styles.promptSub}>
                    Tap speaker to hear pronunciation
                  </Text>
                </View>
                <TouchableOpacity style={styles.soundListenBtn} onPress={handlePlayAudio} activeOpacity={0.7}>
                  <Text style={styles.soundListenText}>🔊 Listen</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Canvas Stage Card */}
          <View style={styles.stageCard}>
            <View style={styles.stageCardHeader}>
              <Text style={styles.stageCardTitle}>✍️ Handwriting Pad</Text>
              <View style={styles.badgeHeaderDtw}>
                <Text style={styles.badgeHeaderDtwText}>Question {questionIndex + 1} of {roundQuestions.length}</Text>
              </View>
            </View>

            {/* Canvas Stage */}
            <View style={styles.svgStage}>
              <HandwritingCanvas
                ref={canvasRef}
                size={canvasSize}
                strokeColor="#38bdf8"
                strokeWidth={5}
                onStrokeEnd={handleStrokesEnd}
              >
                {showGhostPeek && (
                  <GuidedOverlay
                    template={currentQuestion}
                    size={canvasSize}
                    showStrokes={true}
                    showStrokeOrder={true}
                    showDirectionArrows={true}
                  />
                )}
              </HandwritingCanvas>
            </View>

            {/* Canvas Tool Actions */}
            <View style={styles.canvasActionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={resetCanvas} activeOpacity={0.7}>
                <Text style={styles.actionBtnText}>🗑 Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => canvasRef.current?.undo()}
                activeOpacity={0.7}
              >
                <Text style={styles.actionBtnText}>↩ Undo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.peekBtn]}
                onPress={handlePeekGhost}
                activeOpacity={0.7}
              >
                <Text style={styles.peekBtnText}>💡 Peek (2s)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.solutionBtn]}
                onPress={() => setShowAnimatedModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.solutionBtnText}>🎬 Animation</Text>
              </TouchableOpacity>
            </View>

            {/* Submit / Check Answer Button */}
            {!hasChecked ? (
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  userStrokes.length === 0 && styles.submitBtnDisabled,
                ]}
                onPress={handleCheckAnswer}
                disabled={userStrokes.length === 0}
                activeOpacity={0.7}
              >
                <Text style={styles.submitBtnText}>✅ Check My Handwriting</Text>
              </TouchableOpacity>
            ) : (
              /* Evaluation Feedback Card */
              <View style={styles.feedbackCard}>
                <View style={styles.starsRow}>
                  {[1, 2, 3].map(i => (
                    <Text
                      key={`star-${i}`}
                      style={[
                        styles.starIcon,
                        i <= earnedStars ? styles.starEarned : styles.starDim,
                      ]}
                    >
                      ⭐
                    </Text>
                  ))}
                </View>

                <Text style={styles.feedbackScoreText}>
                  Accuracy: {evaluationResult?.confidence || 0}%
                </Text>

                <Text style={styles.feedbackMsg}>
                  {earnedStars === 3
                    ? `🎉 Masterpiece! You wrote "${currentQuestion?.gujarati}" flawlessly!`
                    : earnedStars === 2
                    ? `👍 Great job! Very recognizable "${currentQuestion?.gujarati}".`
                    : earnedStars === 1
                    ? `🌱 Good try! Refine stroke curves for "${currentQuestion?.gujarati}".`
                    : `❌ Let's practice "${currentQuestion?.gujarati}" again! Check the animated help.`}
                </Text>

                {evaluationResult?.errors && evaluationResult.errors.wrongDirection && (
                  <Text style={styles.errorNote}>
                    ⚠️ Tip: Check the stroke direction arrows.
                  </Text>
                )}

                <View style={styles.feedbackActionsRow}>
                  <TouchableOpacity style={styles.retryBtn} onPress={resetCanvas} activeOpacity={0.7}>
                    <Text style={styles.retryBtnText}>🔄 Try Again</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={handleNextQuestion}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.nextBtnText}>
                      {questionIndex + 1 < roundQuestions.length
                        ? 'Next Letter ➔'
                        : 'See Results 🏆'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Right Column: Settings & Scoreboard Panel */}
        <View style={[styles.settingsPanel, isWide && styles.settingsPanelWide]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelHeaderTitle}>⚙️ Level & Scoreboard</Text>
          </View>

          {/* Practice Mode Switcher */}
          <ModeSelector activeTab={activeTab} onSelectTab={onSelectTab} />

          {/* Level Selection Tabs */}
          <View style={styles.panelGroup}>
            <Text style={styles.panelLabel}>LEVEL</Text>
            <View style={styles.levelSelector}>
              {(
                [
                  { id: 'vowels', label: 'Vowels' },
                  { id: 'consonants', label: 'Consonants' },
                  { id: 'numbers', label: 'Numbers' },
                  { id: 'mixed', label: 'Master' },
                ] as const
              ).map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.levelTab, level === tab.id && styles.levelTabActive]}
                  onPress={() => {
                    setLevel(tab.id);
                    handleRestartRound();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.levelTabText,
                      level === tab.id && styles.levelTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mode Switcher */}
          <View style={styles.panelGroup}>
            <Text style={styles.panelLabel}>CLUE MODE</Text>
            <View style={styles.modeContainer}>
              <TouchableOpacity
                style={[styles.modePill, mode === 'picture' && styles.modePillActive]}
                onPress={() => setMode('picture')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeText, mode === 'picture' && styles.modeTextActive]}>
                  🖼️ Picture Clue
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modePill, mode === 'audio' && styles.modePillActive]}
                onPress={() => setMode('audio')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeText, mode === 'audio' && styles.modeTextActive]}>
                  🎧 Listen & Write
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Score & Streak Stats Card */}
          <View style={styles.panelGroup}>
            <Text style={styles.panelLabel}>SCOREBOARD</Text>
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>PROGRESS</Text>
                <Text style={styles.statValue}>
                  {questionIndex + 1} / {roundQuestions.length}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>STARS</Text>
                <Text style={[styles.statValue, { color: '#fbbf24' }]}>
                  ⭐ {starsTotal}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>STREAK</Text>
                <Text style={[styles.statValue, { color: '#ff6b35' }]}>
                  🔥 {currentStreak}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Round Finished Summary Modal */}
      <Modal visible={isRoundFinished} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTrophy}>🏆</Text>
            <Text style={styles.summaryTitle}>Round Complete!</Text>
            <Text style={styles.summarySub}>
              You practiced {roundQuestions.length} Gujarati letters in {level.toUpperCase()} mode.
            </Text>

            <View style={styles.summaryStatsGrid}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatNum}>⭐ {starsTotal}</Text>
                <Text style={styles.summaryStatLabel}>Stars Earned</Text>
              </View>

              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatNum}>🔥 {bestStreak}</Text>
                <Text style={styles.summaryStatLabel}>Best Streak</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.playAgainBtn}
              onPress={handleRestartRound}
              activeOpacity={0.7}
            >
              <Text style={styles.playAgainText}>🔁 Play Next Round</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Animated Solution Peek Modal */}
      <Modal visible={showAnimatedModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.animatedModalBox}>
            <View style={styles.animatedModalHeader}>
              <Text style={styles.animatedModalTitle}>
                Solution: {currentQuestion?.gujarati} ({currentQuestion?.name})
              </Text>
              <TouchableOpacity onPress={() => setShowAnimatedModal(false)}>
                <Text style={styles.closeModalText}>✕ Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalPlayerWrapper}>
              <AnimatedStrokePlayer
                template={currentQuestion}
                size={Math.min(windowWidth - 64, 280)}
                isPlaying={true}
                playbackSpeed={1.0}
                loop={true}
              />
            </View>

            <TouchableOpacity
              style={styles.gotItBtn}
              onPress={() => setShowAnimatedModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.gotItText}>Got it! Let me draw</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#0a0e14',
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: '100%',
    maxWidth: 1140,
    alignSelf: 'center',
  },

  /* Workspace Layout */
  workspaceLayout: {
    width: '100%',
    marginBottom: 24,
  },
  workspaceLayoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  workspaceLayoutCol: {
    flexDirection: 'column',
    gap: 20,
  },

  /* Left Column */
  stagesColumn: {
    width: '100%',
    gap: 16,
  },
  stagesColumnWide: {
    flex: 1,
    minWidth: 0,
  },

  promptCard: {
    backgroundColor: 'rgba(22, 29, 39, 0.85)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  promptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  promptEmoji: {
    fontSize: 38,
  },
  promptTextWrapper: {
    flex: 1,
  },
  promptTitle: {
    color: '#8b949e',
    fontSize: 11,
    fontWeight: '700',
  },
  promptWord: {
    color: '#f0f6fc',
    fontSize: 17,
    fontWeight: '800',
  },
  promptSub: {
    color: '#38bdf8',
    fontSize: 12,
    marginTop: 2,
  },
  soundMiniBtn: {
    backgroundColor: '#21262d',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363d',
  },
  soundMiniText: {
    fontSize: 18,
  },
  soundListenBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  soundListenText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },

  stageCard: {
    backgroundColor: 'rgba(22, 29, 39, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  stageCardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  svgStage: {
    backgroundColor: '#0a0e14',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  canvasActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#21262d',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363d',
  },
  actionBtnText: {
    color: '#c9d1d9',
    fontSize: 11,
    fontWeight: '600',
  },
  peekBtn: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderColor: '#ca8a04',
  },
  peekBtnText: {
    color: '#facc15',
    fontSize: 11,
    fontWeight: '700',
  },
  solutionBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#0284c7',
  },
  solutionBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },

  submitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38bdf8',
    width: '100%',
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  feedbackCard: {
    backgroundColor: '#0d1117',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#30363d',
    alignItems: 'center',
    width: '100%',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  starIcon: {
    fontSize: 24,
  },
  starEarned: {
    opacity: 1,
  },
  starDim: {
    opacity: 0.2,
  },
  feedbackScoreText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '800',
  },
  feedbackMsg: {
    color: '#c9d1d9',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 6,
    lineHeight: 17,
  },
  errorNote: {
    color: '#f59e0b',
    fontSize: 11,
    marginBottom: 6,
  },
  feedbackActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    width: '100%',
  },
  retryBtn: {
    flex: 1,
    backgroundColor: '#21262d',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363d',
  },
  retryBtnText: {
    color: '#c9d1d9',
    fontSize: 12,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Right Settings Panel */
  settingsPanel: {
    backgroundColor: 'rgba(22, 29, 39, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    width: '100%',
  },
  settingsPanelWide: {
    width: 320,
    flexShrink: 0,
  },
  panelHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  panelHeaderTitle: {
    fontSize: 15,
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

  levelSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  levelTab: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#21262d',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363d',
  },
  levelTabActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  levelTabText: {
    color: '#8b949e',
    fontSize: 11,
    fontWeight: '600',
  },
  levelTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  modeContainer: {
    flexDirection: 'row',
    backgroundColor: '#0d1117',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#30363d',
    gap: 4,
  },
  modePill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  modePillActive: {
    backgroundColor: '#21262d',
  },
  modeText: {
    color: '#8b949e',
    fontSize: 11,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#0d1117',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#30363d',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#8b949e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statValue: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  summaryBox: {
    backgroundColor: '#161b22',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  summaryTrophy: {
    fontSize: 44,
    marginBottom: 8,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  summarySub: {
    color: '#8b949e',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 8,
  },
  summaryStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
    width: '100%',
    justifyContent: 'center',
  },
  summaryStatItem: {
    backgroundColor: '#0d1117',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363d',
    flex: 1,
  },
  summaryStatNum: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  summaryStatLabel: {
    color: '#8b949e',
    fontSize: 11,
    marginTop: 2,
  },
  playAgainBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 6,
    width: '100%',
    alignItems: 'center',
  },
  playAgainText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  animatedModalBox: {
    backgroundColor: '#161b22',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  animatedModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  animatedModalTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  closeModalText: {
    color: '#f85149',
    fontSize: 12,
    fontWeight: '700',
  },
  modalPlayerWrapper: {
    marginBottom: 14,
  },
  gotItBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  gotItText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
