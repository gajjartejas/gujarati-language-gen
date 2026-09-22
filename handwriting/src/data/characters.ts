import { CharacterTemplate } from '../types/handwriting';
import rawTemplates from './templates.json';

export const CHARACTER_TEMPLATES: CharacterTemplate[] = rawTemplates as unknown as CharacterTemplate[];

export const VOWEL_TEMPLATES = CHARACTER_TEMPLATES.filter(t => t.category === 'vowel');
export const CONSONANT_TEMPLATES = CHARACTER_TEMPLATES.filter(t => t.category === 'consonant');
export const NUMBER_TEMPLATES = CHARACTER_TEMPLATES.filter(t => t.category === 'number');
export const BARAKHADI_TEMPLATES = CHARACTER_TEMPLATES.filter(t => t.category === 'barakhadi');

// Combined Kakko (Vowels + Consonants)
export const KAKKO_TEMPLATES = [...VOWEL_TEMPLATES, ...CONSONANT_TEMPLATES];

export const TEMPLATE_MAP = new Map<string, CharacterTemplate>(
  CHARACTER_TEMPLATES.map(t => [t.id, t])
);

export function getTemplateById(id: string): CharacterTemplate | undefined {
  return TEMPLATE_MAP.get(id);
}

export function getTemplateByGujarati(char: string): CharacterTemplate | undefined {
  return CHARACTER_TEMPLATES.find(t => t.gujarati === char);
}
