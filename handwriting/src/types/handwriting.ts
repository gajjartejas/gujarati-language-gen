/**
 * Core Handwriting Recognition Data Types
 * Conforms to PRD Specification in gujarati_handwriting_detailed.md
 */

export interface Point {
  x: number;
  y: number;
  t?: number;
}

export type Stroke = Point[];
export type Strokes = Stroke[];

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

export interface DirectionVector {
  dx: number;
  dy: number;
  angle: number;
}

export type CharacterCategory = 'vowel' | 'consonant' | 'barakhadi' | 'number';

export interface TemplateStroke {
  id?: string;
  points: Point[];
  startPoint: Point;
  endPoint: Point;
  length: number;
}

export interface CharacterTemplate {
  id: string;
  name: string;
  gujarati: string;
  transliteration: string;
  category: CharacterCategory;
  strokeCount: number;
  strokes: TemplateStroke[];
  svgPath?: string;
}

export interface StrokeMatchDetail {
  strokeIndex: number;
  passed: boolean;
  wrongDirection: boolean;
  shapeScore: number;
  directionScore: number;
  dtwDistance: number;
}

export interface RecognitionFeedback {
  confidence: number; // 0..100
  isCorrect: boolean;
  shapeScore: number; // 0..1
  strokeCountScore: number; // 0..1
  directionScore: number; // 0..1
  finalScore: number; // 0..1
  errors: {
    missingStrokes: number;
    extraStrokes: number;
    wrongDirection: boolean;
    strokeDetails: StrokeMatchDetail[];
  };
}

export interface RecognitionResult {
  character: string;
  id: string;
  confidence: number;
  isCorrect: boolean;
  overallScore: number;
  shapeScore: number;
  directionScore: number;
  strokeCountScore: number;
  errors: {
    missingStrokes: number;
    extraStrokes: number;
    wrongDirection: boolean;
    strokeDetails: StrokeMatchDetail[];
  };
  method: 'dtw' | 'ml-fallback';
}

export interface RecognitionCandidate {
  template: CharacterTemplate;
  score: number;
  shapeScore: number;
  directionScore: number;
  strokeCountScore: number;
  confidence: number;
  feedback: RecognitionFeedback;
  method: 'dtw' | 'ml-fallback';
}

export interface IMLModelRunner {
  predict(raster64x64: Float32Array): Promise<Array<{ classIndex: number; probability: number }>>;
}
