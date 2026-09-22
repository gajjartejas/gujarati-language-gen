import {
  evaluateStrokesAgainstTemplate,
  WEIGHT_SHAPE,
  WEIGHT_STROKE_COUNT,
  WEIGHT_DIRECTION,
} from '../src/engine/scoring';
import { generateFeedback } from '../src/engine/feedback';
import { CharacterTemplate, Strokes } from '../src/types/handwriting';

describe('Scoring Formula & Diagnostic Feedback Engine', () => {
  test('scoring weights strictly follow PRD Section 8: 0.5 Shape, 0.2 Count, 0.3 Direction', () => {
    expect(WEIGHT_SHAPE).toBe(0.5);
    expect(WEIGHT_STROKE_COUNT).toBe(0.2);
    expect(WEIGHT_DIRECTION).toBe(0.3);
    expect(WEIGHT_SHAPE + WEIGHT_STROKE_COUNT + WEIGHT_DIRECTION).toBeCloseTo(1.0);
  });

  const mockTemplate: CharacterTemplate = {
    id: 'mock_char',
    name: 'Mock Character',
    gujarati: 'ક',
    transliteration: 'ka',
    category: 'consonant',
    strokeCount: 2,
    strokes: [
      {
        id: 's0',
        points: Array.from({ length: 32 }, (_, i) => ({ x: i / 31, y: 0.2 })),
        startPoint: { x: 0, y: 0.2 },
        endPoint: { x: 1, y: 0.2 },
        length: 1,
      },
      {
        id: 's1',
        points: Array.from({ length: 32 }, (_, i) => ({ x: 0.5, y: i / 31 })),
        startPoint: { x: 0.5, y: 0 },
        endPoint: { x: 0.5, y: 1 },
        length: 1,
      },
    ],
  };

  test('perfect drawing scores near 100% and isCorrect = true', () => {
    const perfectStrokes: Strokes = mockTemplate.strokes.map(s => s.points);
    const feedback = generateFeedback(perfectStrokes, mockTemplate);

    expect(feedback.confidence).toBeGreaterThanOrEqual(95);
    expect(feedback.isCorrect).toBe(true);
    expect(feedback.errors.missingStrokes).toBe(0);
    expect(feedback.errors.extraStrokes).toBe(0);
    expect(feedback.errors.wrongDirection).toBe(false);
  });

  test('missing stroke is flagged in errors and lowers strokeCountScore', () => {
    // Only 1 stroke drawn out of 2 expected
    const incompleteStrokes: Strokes = [mockTemplate.strokes[0].points];
    const feedback = generateFeedback(incompleteStrokes, mockTemplate);

    expect(feedback.errors.missingStrokes).toBe(1);
    expect(feedback.isCorrect).toBe(false);
    expect(feedback.strokeCountScore).toBeLessThan(1.0);
  });

  test('extra stroke is penalized in errors', () => {
    // 3 strokes drawn out of 2 expected
    const extraStrokes: Strokes = [
      mockTemplate.strokes[0].points,
      mockTemplate.strokes[1].points,
      Array.from({ length: 32 }, (_, i) => ({ x: 0.1, y: i / 31 })),
    ];

    const feedback = generateFeedback(extraStrokes, mockTemplate);
    expect(feedback.errors.extraStrokes).toBe(1);
    expect(feedback.strokeCountScore).toBeLessThan(1.0);
  });

  test('reverse drawn stroke triggers wrongDirection error flag', () => {
    const reversedStrokes: Strokes = [
      Array.from({ length: 32 }, (_, i) => ({ x: (31 - i) / 31, y: 0.2 })), // backwards
      mockTemplate.strokes[1].points,
    ];

    const feedback = generateFeedback(reversedStrokes, mockTemplate);
    expect(feedback.errors.wrongDirection).toBe(true);
    expect(feedback.isCorrect).toBe(false);
  });
});
