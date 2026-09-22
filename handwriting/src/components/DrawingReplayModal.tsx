import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CharacterTemplate, Strokes, Stroke } from '../types/handwriting';

interface DrawingReplayModalProps {
  visible: boolean;
  onClose: () => void;
  userStrokes: Strokes;
  template: CharacterTemplate;
}

export const DrawingReplayModal: React.FC<DrawingReplayModalProps> = ({
  visible,
  onClose,
  userStrokes,
  template,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(1.0); // 0.0 to 1.0
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const screenWidth = Dimensions.get('window').width;
  const boxSize = Math.min(Math.floor((screenWidth - 64) / 2), 220);

  // Total points across all user strokes
  const totalUserPoints = userStrokes.reduce((acc, s) => acc + s.length, 0);

  // Slice user strokes according to playback progress
  const getProgressStrokes = (progress: number): Strokes => {
    if (userStrokes.length === 0 || progress <= 0) return [];
    if (progress >= 1) return userStrokes;

    const targetPoints = Math.floor(totalUserPoints * progress);
    let counted = 0;
    const result: Strokes = [];

    for (const stroke of userStrokes) {
      if (counted + stroke.length <= targetPoints) {
        result.push(stroke);
        counted += stroke.length;
      } else {
        const remaining = targetPoints - counted;
        if (remaining > 0) {
          result.push(stroke.slice(0, remaining));
        }
        break;
      }
    }
    return result;
  };

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      const step = (now: number) => {
        const delta = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        setPlaybackProgress(prev => {
          const next = prev + delta * 0.4; // completes replay in ~2.5s
          if (next >= 1.0) {
            setIsPlaying(false);
            return 1.0;
          }
          return next;
        });

        animationFrameRef.current = requestAnimationFrame(step);
      };
      animationFrameRef.current = requestAnimationFrame(step);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying]);

  const handlePlayToggle = () => {
    if (playbackProgress >= 1.0) {
      setPlaybackProgress(0.01);
    }
    setIsPlaying(prev => !prev);
  };

  const currentStrokes = getProgressStrokes(playbackProgress);

  const strokeToSvgPath = (stroke: Stroke): string => {
    if (stroke.length === 0) return '';
    let d = `M ${stroke[0].x} ${stroke[0].y}`;
    for (let i = 1; i < stroke.length; i++) {
      d += ` L ${stroke[i].x} ${stroke[i].y}`;
    }
    return d;
  };

  const templateToSvgPath = (
    strokePoints: Array<{ x: number; y: number }>,
    size: number
  ): string => {
    if (strokePoints.length === 0) return '';
    const pad = 18;
    const drawSize = size - pad * 2;
    let d = `M ${pad + strokePoints[0].x * drawSize} ${pad + strokePoints[0].y * drawSize}`;
    for (let i = 1; i < strokePoints.length; i++) {
      d += ` L ${pad + strokePoints[i].x * drawSize} ${pad + strokePoints[i].y * drawSize}`;
    }
    return d;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>⏪ Replay & Side-by-Side Compare</Text>
              <Text style={styles.subtitle}>
                Character: {template?.gujarati} ({template?.name})
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* View Mode Toggle */}
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              style={[
                styles.modeBtn,
                viewMode === 'side-by-side' && styles.activeModeBtn,
              ]}
              onPress={() => setViewMode('side-by-side')}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  viewMode === 'side-by-side' && styles.activeModeBtnText,
                ]}
              >
                Side-by-Side
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeBtn,
                viewMode === 'overlay' && styles.activeModeBtn,
              ]}
              onPress={() => setViewMode('overlay')}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  viewMode === 'overlay' && styles.activeModeBtnText,
                ]}
              >
                Differential Overlay
              </Text>
            </TouchableOpacity>
          </View>

          {/* Display Canvases */}
          {viewMode === 'side-by-side' ? (
            <View style={styles.canvasesRow}>
              {/* User Drawing Canvas */}
              <View style={styles.canvasCard}>
                <Text style={styles.canvasTitle}>Your Drawing (Replay)</Text>
                <View style={[styles.canvasBox, { width: boxSize, height: boxSize }]}>
                  <Svg width={boxSize} height={boxSize}>
                    {currentStrokes.map((s, idx) => (
                      <Path
                        key={`user-s-${idx}`}
                        d={strokeToSvgPath(s)}
                        stroke="#38bdf8"
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    ))}
                  </Svg>
                </View>
              </View>

              {/* Teacher Template Canvas */}
              <View style={styles.canvasCard}>
                <Text style={styles.canvasTitle}>Canonical Template</Text>
                <View style={[styles.canvasBox, { width: boxSize, height: boxSize }]}>
                  <Svg width={boxSize} height={boxSize}>
                    {template?.strokes.map((s, idx) => (
                      <Path
                        key={`tmpl-s-${idx}`}
                        d={templateToSvgPath(s.points, boxSize)}
                        stroke="#22c55e"
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    ))}
                  </Svg>
                </View>
              </View>
            </View>
          ) : (
            /* Differential Overlay View */
            <View style={styles.overlayContainer}>
              <View style={[styles.canvasBox, { width: 280, height: 280 }]}>
                <Svg width={280} height={280}>
                  {/* Template in green dashed */}
                  {template?.strokes.map((s, idx) => (
                    <Path
                      key={`tmpl-ov-${idx}`}
                      d={templateToSvgPath(s.points, 280)}
                      stroke="#22c55e"
                      strokeWidth={5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      opacity={0.6}
                    />
                  ))}
                  {/* User in solid cyan */}
                  {currentStrokes.map((s, idx) => (
                    <Path
                      key={`user-ov-${idx}`}
                      d={strokeToSvgPath(s)}
                      stroke="#38bdf8"
                      strokeWidth={3.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  ))}
                </Svg>
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#38bdf8' }]} />
                  <Text style={styles.legendText}>Your Stroke</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                  <Text style={styles.legendText}>Teacher Guide</Text>
                </View>
              </View>
            </View>
          )}

          {/* Replay Controls & Timeline Slider */}
          <View style={styles.timelineRow}>
            <TouchableOpacity style={styles.playBtn} onPress={handlePlayToggle}>
              <Text style={styles.playBtnText}>{isPlaying ? '⏸ Pause' : '▶ Play'}</Text>
            </TouchableOpacity>

            {/* Progress Bar / Slider */}
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${Math.round(playbackProgress * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(playbackProgress * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeModeBtn: {
    backgroundColor: '#0284c7',
  },
  modeBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeModeBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  canvasesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  canvasCard: {
    flex: 1,
    alignItems: 'center',
  },
  canvasTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  canvasBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  overlayContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  playBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  playBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  progressContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
});
