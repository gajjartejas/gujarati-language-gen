import { GUJARATI_WORD_ASSOCIATIONS, getWordAssociation } from '../src/data/wordAssociations';
import { VOWEL_TEMPLATES, CONSONANT_TEMPLATES, NUMBER_TEMPLATES } from '../src/data/characters';
import { evaluateUserDrawing } from '../src/engine/recognizer';

describe('Gamified Quiz & Word Associations', () => {
  it('should have mnemonic word associations for all primary vowels', () => {
    const vowels = ['અ', 'આ', 'ઇ', 'ઈ', 'ઉ', 'ઊ', 'એ', 'ઐ', 'ઓ', 'ઔ', 'અં', 'અઃ'];
    for (const v of vowels) {
      const assoc = getWordAssociation(v);
      expect(assoc).toBeDefined();
      expect(assoc.char).toBe(v);
      expect(assoc.word.length).toBeGreaterThan(0);
      expect(assoc.meaning.length).toBeGreaterThan(0);
      expect(assoc.emoji.length).toBeGreaterThan(0);
    }
  });

  it('should have mnemonic word associations for primary consonants', () => {
    const keyConsonants = ['ક', 'ખ', 'ગ', 'ઘ', 'ચ', 'છ', 'જ', 'ઝ', 'ટ', 'ત', 'પ', 'મ', 'ય', 'ર', 'લ', 'વ', 'સ', 'હ'];
    for (const c of keyConsonants) {
      const assoc = getWordAssociation(c);
      expect(assoc).toBeDefined();
      expect(assoc.char).toBe(c);
      expect(assoc.word.length).toBeGreaterThan(0);
      expect(assoc.emoji.length).toBeGreaterThan(0);
    }
  });

  it('should have number associations for 0-9', () => {
    const numbers = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'];
    for (const n of numbers) {
      const assoc = getWordAssociation(n);
      expect(assoc).toBeDefined();
      expect(assoc.char).toBe(n);
      expect(assoc.meaning.length).toBeGreaterThan(0);
    }
  });

  it('should evaluate quiz drawings accurately', () => {
    const kaTemplate = CONSONANT_TEMPLATES.find(t => t.gujarati === 'ક') || CONSONANT_TEMPLATES[0];
    expect(kaTemplate).toBeDefined();

    // Exact match drawing
    const mockDrawing = kaTemplate.strokes.map(s => s.points);
    const result = evaluateUserDrawing(mockDrawing, kaTemplate);

    expect(result.character).toBe(kaTemplate.gujarati);
    expect(result.confidence).toBeGreaterThanOrEqual(80);
    expect(result.isCorrect).toBe(true);
  });
});
