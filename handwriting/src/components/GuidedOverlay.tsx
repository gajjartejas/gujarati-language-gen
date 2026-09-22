import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Circle, Line, Polygon } from 'react-native-svg';
import { CharacterTemplate } from '../types/handwriting';

interface GuidedOverlayProps {
  template: CharacterTemplate;
  size: number;
  activeStrokeIndex?: number;
  showStrokes?: boolean;
  showStrokeOrder?: boolean;
  showDirectionArrows?: boolean;
  strokeColor?: string;
  outlineColor?: string;
}

export const GuidedOverlay: React.FC<GuidedOverlayProps> = ({
  template,
  size,
  activeStrokeIndex = 0,
  showStrokes = true,
  showStrokeOrder = true,
  showDirectionArrows = true,
  strokeColor = '#64748b',
}) => {
  if (!template || !template.strokes) return null;

  const padding = 24;
  const drawableSize = size - padding * 2;

  // Transforms normalized [0..1] coordinates to canvas pixels
  const toCanvasX = (nx: number) => padding + nx * drawableSize;
  const toCanvasY = (ny: number) => padding + ny * drawableSize;

  const buildStrokePath = (points: Array<{ x: number; y: number }>): string => {
    if (points.length === 0) return '';
    let d = `M ${toCanvasX(points[0].x)} ${toCanvasY(points[0].y)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${toCanvasX(points[i].x)} ${toCanvasY(points[i].y)}`;
    }
    return d;
  };

  // Calculates directional arrow coordinates along initial segment of stroke
  const getDirectionArrow = (points: Array<{ x: number; y: number }>) => {
    if (points.length < 3) return null;
    const p1 = { x: toCanvasX(points[0].x), y: toCanvasY(points[0].y) };
    const p2 = { x: toCanvasX(points[3].x), y: toCanvasY(points[3].y) };

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 5) return null;

    const ux = dx / len;
    const uy = dy / len;

    // Arrow tip positioned 22px away from start
    const tipDist = 24;
    const tip = { x: p1.x + ux * tipDist, y: p1.y + uy * tipDist };

    // Wings
    const arrowSize = 6;
    const wing1 = {
      x: tip.x - ux * arrowSize + uy * arrowSize,
      y: tip.y - uy * arrowSize - ux * arrowSize,
    };
    const wing2 = {
      x: tip.x - ux * arrowSize - uy * arrowSize,
      y: tip.y - uy * arrowSize + ux * arrowSize,
    };

    return {
      shaftStart: p1,
      shaftEnd: tip,
      points: `${tip.x},${tip.y} ${wing1.x},${wing1.y} ${wing2.x},${wing2.y}`,
    };
  };

  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Render strokes with real-time active / completed / upcoming states */}
        {showStrokes &&
          template.strokes.map((stroke, index) => {
            const isCompleted = index < activeStrokeIndex;
            const isActive = index === activeStrokeIndex;

            let color = strokeColor;
            let width = 3;
            let dashArray = '6, 6';
            let opacity = 0.4;

            if (isCompleted) {
              color = '#22c55e';
              width = 2.5;
              dashArray = '4, 4';
              opacity = 0.45;
            } else if (isActive) {
              color = '#38bdf8'; // Glowing active blue
              width = 4.5;
              dashArray = '8, 4';
              opacity = 0.95;
            }

            const arrow = isActive && showDirectionArrows ? getDirectionArrow(stroke.points) : null;

            return (
              <React.Fragment key={`guide-stroke-${index}`}>
                <Path
                  d={buildStrokePath(stroke.points)}
                  stroke={color}
                  strokeWidth={width}
                  strokeDasharray={dashArray}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={opacity}
                />

                {/* Direction arrow on active stroke */}
                {arrow && (
                  <>
                    <Line
                      x1={arrow.shaftStart.x}
                      y1={arrow.shaftStart.y}
                      x2={arrow.shaftEnd.x}
                      y2={arrow.shaftEnd.y}
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                    />
                    <Polygon points={arrow.points} fill="#38bdf8" />
                  </>
                )}
              </React.Fragment>
            );
          })}

        {/* Start bubbles for stroke ordering (1, 2, 3) */}
        {showStrokeOrder &&
          template.strokes.map((stroke, index) => {
            const startX = toCanvasX(stroke.startPoint.x);
            const startY = toCanvasY(stroke.startPoint.y);
            const isCompleted = index < activeStrokeIndex;
            const isActive = index === activeStrokeIndex;

            const bubbleColor = isCompleted
              ? '#166534'
              : isActive
              ? '#0284c7'
              : '#334155';

            return (
              <React.Fragment key={`start-bubble-${index}`}>
                {/* Outer pulsing ring for active stroke */}
                {isActive && (
                  <Circle
                    cx={startX}
                    cy={startY}
                    r={15}
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fill="rgba(56, 189, 248, 0.25)"
                  />
                )}
                <Circle
                  cx={startX}
                  cy={startY}
                  r={10}
                  fill={bubbleColor}
                  opacity={isActive ? 1.0 : 0.8}
                />
              </React.Fragment>
            );
          })}
      </Svg>

      {/* Number text labels over the start circles */}
      {showStrokeOrder &&
        template.strokes.map((stroke, index) => {
          const startX = toCanvasX(stroke.startPoint.x);
          const startY = toCanvasY(stroke.startPoint.y);
          const isCompleted = index < activeStrokeIndex;
          const isActive = index === activeStrokeIndex;

          return (
            <View
              key={`start-num-${index}`}
              style={[
                styles.numberBadge,
                {
                  left: startX - 10,
                  top: startY - 10,
                },
              ]}
            >
              <Text
                style={[
                  styles.numberText,
                  isActive && styles.activeNumberText,
                  isCompleted && styles.completedNumberText,
                ]}
              >
                {isCompleted ? '✓' : index + 1}
              </Text>
            </View>
          );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  numberBadge: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  activeNumberText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  completedNumberText: {
    color: '#4ade80',
    fontWeight: '900',
  },
});
