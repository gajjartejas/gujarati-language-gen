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

type QuizLevel = 'vowels' | 'consonants' | 'numbers' | 'mixed';
type QuizMode = 'picture' | 'audio';

interface QuizGameScreenProps {
  templates?: CharacterTemplate[];
}

export const QuizGameScreen: React.FC<QuizGameScreenProps> = () => {
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

  const screenWidth = Dimensions.get('window').width;
  const canvasSize = Math.min(screenWidth - 48, 330);

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
        // Pick a balanced subset of Kakko
        return KAKKO_TEMPLATES.slice(0, 20);
    }
  }, [level]);

  // Round questions (5 questions per round)
  const roundQuestions = useMemo(() => {
    // Shuffle deterministic subset of pool
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
      // Speak positive praise
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
      {/* Level Selection Tabs */}
      <View style={styles.levelSelector}>
        {(
          [
            { id: 'vowels', label: '🌱 Vowels' },
            { id: 'consonants', label: '🌿 Consonants' },
            { id: 'numbers', label: '🔢 Numbers' },
            { id: 'mixed', label: '🏆 Master' },
          ] as const
        ).map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.levelTab, level === tab.id && styles.levelTabActive]}
            onPress={() => {
              setLevel(tab.id);
              handleRestartRound();
            }}
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

      {/* Mode Switcher (Picture Clue vs Audio Dictation) */}
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modePill, mode === 'picture' && styles.modePillActive]}
          onPress={() => setMode('picture')}
        >
          <Text
            style={[styles.modeText, mode === 'picture' && styles.modeTextActive]}
          >
            🖼️ Picture Clue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modePill, mode === 'audio' && styles.modePillActive]}
          onPress={() => setMode('audio')}
        >
          <Text
            style={[styles.modeText, mode === 'audio' && styles.modeTextActive]}
          >
            🎧 Listen & Write
          </Text>
        </TouchableOpacity>
      </View>

      {/* Header Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>ROUND PROGRESS</Text>
          <Text style={styles.statValue}>
            {questionIndex + 1} / {roundQuestions.length}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>STARS EARNED</Text>
          <Text style={[styles.statValue, { color: '#eab308' }]}>
            ⭐ {starsTotal}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>STREAK</Text>
          <Text style={[styles.statValue, { color: '#f97316' }]}>
            🔥 {currentStreak}
          </Text>
        </View>
      </View>

      {/* Question Prompt Card */}
      <View style={styles.promptCard}>
        {mode === 'picture' ? (
          <View style={styles.promptContent}>
            <Text style={styles.promptEmoji}>{wordClue?.emoji || '✍️'}</Text>
            <View style={styles.promptTextWrapper}>
              <Text style={styles.promptTitle}>
                Write starting letter for:
              </Text>
              <Text style={styles.promptWord}>
                {wordClue?.word} ({wordClue?.meaning})
              </Text>
              <Text style={styles.promptSub}>
                Letter sound: "{currentQuestion.transliteration}"
              </Text>
            </View>
            <TouchableOpacity style={styles.soundMiniBtn} onPress={handlePlayAudio}>
              <Text style={styles.soundMiniText}>🔊</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.promptContent}>
            <Text style={styles.promptEmoji}>🎧</Text>
            <View style={styles.promptTextWrapper}>
              <Text style={styles.promptTitle}>Listen and write the letter:</Text>
              <Text style={styles.promptWord}>
                "{currentQuestion.transliteration}"
              </Text>
              <Text style={styles.promptSub}>
                Tap speaker to hear pronunciation
              </Text>
            </View>
            <TouchableOpacity style={styles.soundListenBtn} onPress={handlePlayAudio}>
              <Text style={styles.soundListenText}>🔊 Listen Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Writing Canvas with Temporary Ghost Peek Option */}
      <View style={styles.canvasStage}>
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
        <TouchableOpacity style={styles.actionBtn} onPress={resetCanvas}>
          <Text style={styles.actionBtnText}>🗑 Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => canvasRef.current?.undo()}
        >
          <Text style={styles.actionBtnText}>↩ Undo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.peekBtn]}
          onPress={handlePeekGhost}
        >
          <Text style={styles.peekBtnText}>💡 Peek Guide (2s)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.solutionBtn]}
          onPress={() => setShowAnimatedModal(true)}
        >
          <Text style={styles.solutionBtnText}>🎬 Animated Help</Text>
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
              ? `🎉 Masterpiece! You wrote "${currentQuestion.gujarati}" flawlessly!`
              : earnedStars === 2
              ? `👍 Great job! Very recognizable "${currentQuestion.gujarati}".`
              : earnedStars === 1
              ? `🌱 Good try! Refine stroke curves for "${currentQuestion.gujarati}".`
              : `❌ Let's practice "${currentQuestion.gujarati}" again! Check the animated help.`}
          </Text>

          {/* Diagnostic error note if any */}
          {evaluationResult?.errors && evaluationResult.errors.wrongDirection && (
            <Text style={styles.errorNote}>
              ⚠️ Tip: Check the stroke direction arrows.
            </Text>
          )}

          <View style={styles.feedbackActionsRow}>
            <TouchableOpacity style={styles.retryBtn} onPress={resetCanvas}>
              <Text style={styles.retryBtnText}>🔄 Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleNextQuestion}
            >
              <Text style={styles.nextBtnText}>
                {questionIndex + 1 < roundQuestions.length
                  ? 'Next Letter ➡️'
                  : 'See Results 🏆'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
                Solution: {currentQuestion.gujarati} ({currentQuestion.name})
              </Text>
              <TouchableOpacity onPress={() => setShowAnimatedModal(false)}>
                <Text style={styles.closeModalText}>✕ Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalPlayerWrapper}>
              <AnimatedStrokePlayer
                template={currentQuestion}
                size={Math.min(screenWidth - 64, 280)}
                isPlaying={true}
                playbackSpeed={1.0}
                loop={true}
              />
            </View>

            <TouchableOpacity
              style={styles.gotItBtn}
              onPress={() => setShowAnimatedModal(false)}
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
    flex: 1,
    backgroundColor: '#090d16',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  levelSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  levelTab: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  levelTabActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  levelTabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  levelTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modePill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  modePillActive: {
    backgroundColor: '#1e293b',
  },
  modeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statValue: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  promptCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  promptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promptEmoji: {
    fontSize: 34,
  },
  promptTextWrapper: {
    flex: 1,
  },
  promptTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  promptWord: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  promptSub: {
    color: '#38bdf8',
    fontSize: 12,
    marginTop: 2,
  },
  soundMiniBtn: {
    backgroundColor: '#1e293b',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  soundMiniText: {
    fontSize: 18,
  },
  soundListenBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  soundListenText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  canvasStage: {
    alignItems: 'center',
    marginBottom: 10,
  },
  canvasActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  peekBtn: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderColor: '#ca8a04',
  },
  peekBtnText: {
    color: '#facc15',
    fontSize: 12,
    fontWeight: '700',
  },
  solutionBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#0284c7',
  },
  solutionBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  feedbackCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  starIcon: {
    fontSize: 26,
  },
  starEarned: {
    opacity: 1,
  },
  starDim: {
    opacity: 0.2,
  },
  feedbackScoreText: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '800',
  },
  feedbackMsg: {
    color: '#cbd5e1',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 18,
  },
  errorNote: {
    color: '#f59e0b',
    fontSize: 12,
    marginBottom: 8,
  },
  feedbackActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  retryBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  summaryBox: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  summaryTrophy: {
    fontSize: 50,
    marginBottom: 10,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  summarySub: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 10,
  },
  summaryStatsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 16,
    width: '100%',
    justifyContent: 'center',
  },
  summaryStatItem: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryStatNum: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  summaryStatLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
  },
  playAgainBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  playAgainText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  animatedModalBox: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  animatedModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
  },
  animatedModalTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  closeModalText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  modalPlayerWrapper: {
    marginBottom: 16,
  },
  gotItBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  gotItText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
