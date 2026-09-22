/**
 * Traditional Gujarati Mnemonic Word Associations & Illustrations
 * Used for Gamified Picture Clues & Educational Associations
 */

export interface WordAssociation {
  char: string;
  word: string;
  meaning: string;
  emoji: string;
}

export const GUJARATI_WORD_ASSOCIATIONS: Record<string, WordAssociation> = {
  // Vowels (સ્વર)
  'અ': { char: 'અ', word: 'અનાનસ', meaning: 'Pineapple', emoji: '🍍' },
  'આ': { char: 'આ', word: 'આગગાડી', meaning: 'Train', emoji: '🚂' },
  'ઇ': { char: 'ઇ', word: 'ઇયળ', meaning: 'Caterpillar', emoji: '🐛' },
  'ઈ': { char: 'ઈ', word: 'ઈંડું', meaning: 'Egg', emoji: '🥚' },
  'ઉ': { char: 'ઉ', word: 'ઉંદર', meaning: 'Mouse', emoji: '🐁' },
  'ઊ': { char: 'ઊ', word: 'ઊંટ', meaning: 'Camel', emoji: '🐪' },
  'ઋ': { char: 'ઋ', word: 'ઋષિ', meaning: 'Sage', emoji: '🧘' },
  'એ': { char: 'એ', word: 'એરણ', meaning: 'Anvil', emoji: '⚒️' },
  'ઐ': { char: 'ઐ', word: 'ઐરાવત', meaning: 'Royal Elephant', emoji: '🐘' },
  'ઓ': { char: 'ઓ', word: 'ઓશીકું', meaning: 'Pillow', emoji: '🛋️' },
  'ઔ': { char: 'ઔ', word: 'ઔષધ', meaning: 'Medicine', emoji: '💊' },
  'અં': { char: 'અં', word: 'અંબારી', meaning: 'Elephant Seat', emoji: '👑' },
  'અઃ': { char: 'અઃ', word: 'નમઃ', meaning: 'Namah', emoji: '🙏' },

  // Consonants (વ્યંજન)
  'ક': { char: 'ક', word: 'કબૂતર', meaning: 'Pigeon', emoji: '🕊️' },
  'ખ': { char: 'ખ', word: 'ખલ', meaning: 'Mortar', emoji: '🥣' },
  'ગ': { char: 'ગ', word: 'ગણપતિ / ગાય', meaning: 'Cow / Ganesha', emoji: '🐄' },
  'ઘ': { char: 'ઘ', word: 'ઘર', meaning: 'House', emoji: '🏡' },
  'ચ': { char: 'ચ', word: 'ચકલી', meaning: 'Sparrow', emoji: '🐦' },
  'છ': { char: 'છ', word: 'છત્રી', meaning: 'Umbrella', emoji: '☂️' },
  'જ': { char: 'જ', word: 'જમરૂખ', meaning: 'Guava', emoji: '🍐' },
  'ઝ': { char: 'ઝ', word: 'ઝભલું', meaning: 'Frock', emoji: '👗' },
  'ટ': { char: 'ટ', word: 'ટમેટું', meaning: 'Tomato', emoji: '🍅' },
  'ઠ': { char: 'ઠ', word: 'ઠળિયો', meaning: 'Fruit Seed', emoji: '🌰' },
  'ડ': { char: 'ડ', word: 'ડમરું', meaning: 'Drum', emoji: '🥁' },
  'ઢ': { char: 'ઢ', word: 'ઢગલો', meaning: 'Mound', emoji: '⛰️' },
  'ણ': { char: 'ણ', word: 'ફેણ', meaning: 'Cobra Hood', emoji: '🐍' },
  'ત': { char: 'ત', word: 'તલવાર', meaning: 'Sword', emoji: '⚔️' },
  'થ': { char: 'થ', word: 'થાળી', meaning: 'Plate', emoji: '🍽️' },
  'દ': { char: 'દ', word: 'દડો', meaning: 'Ball', emoji: '⚽' },
  'ધ': { char: 'ધ', word: 'ધજા', meaning: 'Temple Flag', emoji: '🚩' },
  'ન': { char: 'ન', word: 'નળ', meaning: 'Water Tap', emoji: '🚰' },
  'પ': { char: 'પ', word: 'પતંગ', meaning: 'Kite', emoji: '🪁' },
  'ફ': { char: 'ફ', word: 'ફળ', meaning: 'Fruit', emoji: '🍎' },
  'બ': { char: 'બ', word: 'બતક', meaning: 'Duck', emoji: '🦆' },
  'ભ': { char: 'ભ', word: 'ભમરડો', meaning: 'Spinning Top', emoji: '🪀' },
  'મ': { char: 'મ', word: 'મરચું', meaning: 'Chili', emoji: '🌶️' },
  'ય': { char: 'ય', word: 'યજ્ઞ', meaning: 'Sacred Fire', emoji: '🔥' },
  'ર': { char: 'ર', word: 'રથ', meaning: 'Chariot', emoji: '🛞' },
  'લ': { char: 'લ', word: 'લખોટી', meaning: 'Marble', emoji: '🔮' },
  'વ': { char: 'વ', word: 'વાહણ', meaning: 'Ship', emoji: '🚢' },
  'શ': { char: 'શ', word: 'શરણાઈ', meaning: 'Flute', emoji: '🎺' },
  'ષ': { char: 'ષ', word: 'ષટ્કોણ', meaning: 'Hexagon', emoji: '⬡' },
  'સ': { char: 'સ', word: 'સસલું', meaning: 'Rabbit', emoji: '🐇' },
  'હ': { char: 'હ', word: 'હાથી', meaning: 'Elephant', emoji: '🐘' },
  'ળ': { char: 'ળ', word: 'નળ', meaning: 'Water Tap / Kamal', emoji: '💧' },
  'ક્ષ': { char: 'ક્ષ', word: 'ક્ષત્રિય', meaning: 'Warrior', emoji: '🛡️' },
  'જ્ઞ': { char: 'જ્ઞ', word: 'જ્ઞાની', meaning: 'Wise Sage', emoji: '📜' },

  // Numbers (અંક)
  '૦': { char: '૦', word: 'શૂન્ય', meaning: 'Zero', emoji: '⭕' },
  '૧': { char: '૧', word: 'એક', meaning: 'One', emoji: '☝️' },
  '૨': { char: '૨', word: 'બે', meaning: 'Two', emoji: '✌️' },
  '૩': { char: '૩', word: 'ત્રણ', meaning: 'Three', emoji: '🥉' },
  '૪': { char: '૪', word: 'ચાર', meaning: 'Four', emoji: '🍀' },
  '૫': { char: '૫', word: 'પાંચ', meaning: 'Five', emoji: '🖐️' },
  '૬': { char: '૬', word: 'છ', meaning: 'Six', emoji: '🎲' },
  '૭': { char: '૭', word: 'સાત', meaning: 'Seven', emoji: '🌈' },
  '૮': { char: '૮', word: 'આઠ', meaning: 'Eight', emoji: '🐙' },
  '૯': { char: '૯', word: 'નવ', meaning: 'Nine', emoji: '🪐' },
};

export function getWordAssociation(char: string): WordAssociation {
  return (
    GUJARATI_WORD_ASSOCIATIONS[char] || {
      char,
      word: char,
      meaning: 'Gujarati Character',
      emoji: '✍️',
    }
  );
}
