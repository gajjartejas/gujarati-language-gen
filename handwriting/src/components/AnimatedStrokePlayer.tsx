import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { CharacterTemplate, Stroke } from '../types/handwriting';

interface AnimatedStrokePlayerProps {
  template: CharacterTemplate;
  size: number;
  isPlaying: boolean;
  playbackSpeed: number; // 0.5, 1.0, 1.5, 2.0
  loop?: boolean;
  controlledProgress?: number | null; // Optional external scrubbing
  onPlayStateChange?: (playing: boolean) => void;
  onProgressChange?: (progress: number, activeStroke: number) => void;
  strokeColor?: string;
  guideColor?: string;
  showGhostOutline?: boolean;
}

export const AnimatedStrokePlayer: React.FC<AnimatedStrokePlayerProps> = ({
  template,
  size,
  isPlaying,
  playbackSpeed = 1.0,
  loop = true,
  controlledProgress,
  onPlayStateChange,
  onProgressChange,
  strokeColor = '#38bdf8',
  guideColor = '#334155',
  showGhostOutline = true,
}) => {
  // Global progress across all strokes: 0.0 to 1.0
  const [progress, setProgress] = useState(0.0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const padding = 28;
  const drawableSize = size - padding * 2;

  const toCanvasX = (nx: number) => padding + nx * drawableSize;
  const toCanvasY = (ny: number) => padding + ny * drawableSize;

  // Compute stroke cumulative weights based on relative length
  const strokeWeights = useMemo(() => {
    if (!template || !template.strokes || template.strokes.length === 0) return [];
    const totalLength = template.strokes.reduce((sum, s) => sum + (s.length || 1), 0);
    let cumulative = 0;
    return template.strokes.map(s => {
      const fraction = (s.length || 1) / totalLength;
      const start = cumulative;
      cumulative += fraction;
      return { start, end: cumulative, fraction };
    });
  }, [template]);

  // Reset progress when template changes
  useEffect(() => {
    setProgress(0.0);
  }, [template?.id]);

  // Sync external controlled progress if provided
  useEffect(() => {
    if (controlledProgress !== undefined && controlledProgress !== null) {
      setProgress(Math.max(0, Math.min(1, controlledProgress)));
    }
  }, [controlledProgress]);

  // Animation Loop via requestAnimationFrame (smooth 60fps)
  useEffect(() => {
    if (isPlaying && (controlledProgress === undefined || controlledProgress === null)) {
      lastTimeRef.current = performance.now();

      const animate = (now: number) => {
        const deltaSeconds = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        // Base animation duration ~ 2.4s for full character at 1x
        const advance = (deltaSeconds / 2.4) * playbackSpeed;

        setProgress(prev => {
          let next = prev + advance;
          if (next >= 1.0) {
            if (loop) {
              return 0.0;
            } else {
              onPlayStateChange?.(false);
              return 1.0;
            }
          }
          return next;
        });

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, loop, onPlayStateChange, controlledProgress]);

  if (!template || !template.strokes) return null;

  // Calculate current active stroke index and current stroke partial progress
  let activeStrokeIdx = 0;
  let activeStrokeFraction = 0;

  for (let i = 0; i < strokeWeights.length; i++) {
    const sw = strokeWeights[i];
    if (progress >= sw.start && progress <= sw.end) {
      activeStrokeIdx = i;
      activeStrokeFraction = sw.fraction > 0 ? (progress - sw.start) / sw.fraction : 1;
      break;
    } else if (progress > sw.end && i === strokeWeights.length - 1) {
      activeStrokeIdx = i;
      activeStrokeFraction = 1.0;
    }
  }

  // Notify parent of progress & active stroke
  useEffect(() => {
    onProgressChange?.(progress, activeStrokeIdx);
  }, [progress, activeStrokeIdx, onProgressChange]);

  // Find pen cursor position at current stroke fraction
  const currentStroke = template.strokes[activeStrokeIdx];
  let cursorX = toCanvasX(currentStroke?.startPoint.x || 0.5);
  let cursorY = toCanvasY(currentStroke?.startPoint.y || 0.5);

  if (currentStroke && currentStroke.points.length > 0) {
    const pointIdx = Math.min(
      currentStroke.points.length - 1,
      Math.floor(activeStrokeFraction * (currentStroke.points.length - 1))
    );
    const p = currentStroke.points[pointIdx];
    cursorX = toCanvasX(p.x);
    cursorY = toCanvasY(p.y);
  }

  // Generates SVG path string for a stroke up to a specified point count
  const renderPartialStroke = (points: Array<{ x: number; y: number }>, upToFraction: number) => {
    if (points.length === 0 || upToFraction <= 0) return '';
    const totalCount = Math.max(1, Math.floor(upToFraction * points.length));

    let d = `M ${toCanvasX(points[0].x)} ${toCanvasY(points[0].y)}`;
    for (let i = 1; i < totalCount; i++) {
      d += ` L ${toCanvasX(points[i].x)} ${toCanvasY(points[i].y)}`;
    }
    return d;
  };

  const renderFullStroke = (points: Array<{ x: number; y: number }>) => {
    return renderPartialStroke(points, 1.0);
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="cursorGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <Stop offset="50%" stopColor="#0284c7" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* 1. Ghost Template (Dashed outline so user sees the complete character) */}
        {showGhostOutline &&
          template.strokes.map((s, idx) => (
            <Path
              key={`ghost-${idx}`}
              d={renderFullStroke(s.points)}
              stroke={guideColor}
              strokeWidth={3}
              strokeDasharray="6, 6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.4}
            />
          ))}

        {/* 2. Completed Strokes in solid cyan */}
        {template.strokes.map((s, idx) => {
          if (idx < activeStrokeIdx) {
            return (
              <Path
                key={`completed-${idx}`}
                d={renderFullStroke(s.points)}
                stroke={strokeColor}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            );
          } else if (idx === activeStrokeIdx) {
            return (
              <Path
                key={`active-${idx}`}
                d={renderPartialStroke(s.points, activeStrokeFraction)}
                stroke={strokeColor}
                strokeWidth={5.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            );
          }
          return null;
        })}

        {/* 3. Numbered Starting Bubbles */}
        {template.strokes.map((s, idx) => {
          const sx = toCanvasX(s.startPoint.x);
          const sy = toCanvasY(s.startPoint.y);
          const isDone = idx < activeStrokeIdx;
          const isCurrent = idx === activeStrokeIdx;

          return (
            <React.Fragment key={`bubble-${idx}`}>
              {isCurrent && (
                <Circle
                  cx={sx}
                  cy={sy}
                  r={14}
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="rgba(56, 189, 248, 0.2)"
                />
              )}
              <Circle
                cx={sx}
                cy={sy}
                r={9}
                fill={isDone ? '#166534' : isCurrent ? '#0284c7' : '#334155'}
              />
            </React.Fragment>
          );
        })}

        {/* 4. Glowing Pen / Brush Cursor */}
        {isPlaying && progress > 0.01 && progress < 0.99 && (
          <>
            {/* Outer Glow Halo */}
            <Circle cx={cursorX} cy={cursorY} r={18} fill="url(#cursorGlow)" />
            {/* Core Brush Tip */}
            <Circle cx={cursorX} cy={cursorY} r={6} fill="#ffffff" />
            <Circle cx={cursorX} cy={cursorY} r={3} fill="#0284c7" />
          </>
        )}
      </Svg>

      {/* Start Bubble Number Labels */}
      {template.strokes.map((s, idx) => {
        const sx = toCanvasX(s.startPoint.x);
        const sy = toCanvasY(s.startPoint.y);
        const isDone = idx < activeStrokeIdx;
        return (
          <View
            key={`num-${idx}`}
            style={[styles.numberBadge, { left: sx - 9, top: sy - 9 }]}
          >
            <Text style={styles.numberText}>{isDone ? '✓' : idx + 1}</Text>
          </View>
        );
      })}

      {/* Active Stroke Info Chip */}
      <View style={styles.strokeInfoChip}>
        <Text style={styles.strokeInfoText}>
          Stroke {activeStrokeIdx + 1} of {template.strokeCount}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#334155',
    alignSelf: 'center',
    position: 'relative',
  },
  numberBadge: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  strokeInfoChip: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  strokeInfoText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
});
