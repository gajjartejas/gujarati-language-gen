import { Strokes, CharacterTemplate, StrokeMatchDetail } from '../types/handwriting';
import { calculateDtwDistance, dtwDistanceToShapeScore } from './dtw';
import { matchStrokeDirections } from './direction';

export const WEIGHT_SHAPE = 0.5;
export const WEIGHT_STROKE_COUNT = 0.2;
export const WEIGHT_DIRECTION = 0.3;

export interface StrokeEvaluation {
  shapeScore: number;
  strokeCountScore: number;
  directionScore: number;
  finalScore: number;
  confidence: number;
  strokeDetails: StrokeMatchDetail[];
  wrongDirection: boolean;
}

/**
 * Evaluates normalized user strokes against a character template.
 * Computes exact PRD formula:
 * finalScore = 0.5 * shape + 0.2 * strokeCount + 0.3 * direction
 */
export function evaluateStrokesAgainstTemplate(
  userStrokes: Strokes,
  template: CharacterTemplate
): StrokeEvaluation {
  const expectedCount = template.strokeCount;
  const actualCount = userStrokes.length;

  if (actualCount === 0 || expectedCount === 0) {
    return {
      shapeScore: 0,
      strokeCountScore: 0,
      directionScore: 0,
      finalScore: 0,
      confidence: 0,
      strokeDetails: [],
      wrongDirection: false,
    };
  }

  // 1. Stroke Count Score (0.2 weight)
  // Max score 1.0 when count matches. Penalized by 0.35 per extra/missing stroke.
  const countDiff = Math.abs(actualCount - expectedCount);
  const strokeCountScore = Math.max(0, 1 - 0.35 * countDiff);

  // 2. Stroke-by-Stroke Matching (DTW & Direction)
  const compareCount = Math.min(actualCount, expectedCount);
  const strokeDetails: StrokeMatchDetail[] = [];

  let sumShape = 0;
  let sumDir = 0;
  let hasWrongDirection = false;

  for (let i = 0; i < compareCount; i++) {
    const userStroke = userStrokes[i];
    const templateStroke = template.strokes[i]?.points || [];

    const dtwDist = calculateDtwDistance(userStroke, templateStroke);
    const shapeScore = dtwDistanceToShapeScore(dtwDist);
    const dirMatch = matchStrokeDirections(userStroke, templateStroke);

    const passed = shapeScore >= 0.6 && !dirMatch.isReversed;
    if (dirMatch.isReversed) {
      hasWrongDirection = true;
    }

    strokeDetails.push({
      strokeIndex: i,
      passed,
      wrongDirection: dirMatch.isReversed,
      shapeScore,
      directionScore: dirMatch.score,
      dtwDistance: dtwDist,
    });

    sumShape += shapeScore;
    sumDir += dirMatch.score;
  }

  // If user drew fewer strokes than expected, penalize missing strokes
  const shapeScore = compareCount > 0 ? (sumShape / expectedCount) : 0;
  const directionScore = compareCount > 0 ? (sumDir / expectedCount) : 0;

  // 3. Final Weighted Score
  const finalScore =
    WEIGHT_SHAPE * shapeScore +
    WEIGHT_STROKE_COUNT * strokeCountScore +
    WEIGHT_DIRECTION * directionScore;

  const confidence = Math.round(Math.max(0, Math.min(100, finalScore * 100)));

  return {
    shapeScore,
    strokeCountScore,
    directionScore,
    finalScore,
    confidence,
    strokeDetails,
    wrongDirection: hasWrongDirection,
  };
}
