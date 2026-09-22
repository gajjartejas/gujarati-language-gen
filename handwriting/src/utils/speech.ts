/**
 * Cross-platform Audio & Speech Synthesis for Gujarati Handwriting Suite
 * Integrates high-fidelity pre-recorded Kano MP3 audio assets from /assets/audio/
 * with seamless fallback to Web Speech API ('gu-IN' / Indic voices).
 */

const AUDIO_CACHE: Record<string, HTMLAudioElement> = {};

// Common audio mapping for Kakko, Numbers, and primary characters
const CHAR_AUDIO_MAP: Record<string, string> = {
  // Consonants
  'ક': 'kakko/1_ka.mp3',
  'ખ': 'kakko/2_kha.mp3',
  'ગ': 'kakko/3_ga.mp3',
  'ઘ': 'kakko/4_gha.mp3',
  'ચ': 'kakko/5_cha.mp3',
  'છ': 'kakko/6_chha.mp3',
  'જ': 'kakko/7_ja.mp3',
  'ઝ': 'kakko/8_za.mp3',
  'ટ': 'kakko/9_ta.mp3',
  'ઠ': 'kakko/10_tha.mp3',
  'ડ': 'kakko/11_da.mp3',
  'ઢ': 'kakko/12_dha.mp3',
  'ણ': 'kakko/13_na.mp3',
  'ત': 'kakko/14_ta.mp3',
  'થ': 'kakko/15_tha.mp3',
  'દ': 'kakko/16_da.mp3',
  'ધ': 'kakko/17_dha.mp3',
  'ન': 'kakko/18_na.mp3',
  'પ': 'kakko/19_pa.mp3',
  'ફ': 'kakko/20_pha_or_fa.mp3',
  'બ': 'kakko/21_ba.mp3',
  'ભ': 'kakko/22_bha.mp3',
  'મ': 'kakko/23_ma.mp3',
  'ય': 'kakko/24_ya.mp3',
  'ર': 'kakko/25_ra.mp3',
  'લ': 'kakko/26_la.mp3',
  'વ': 'kakko/27_va.mp3',
  'શ': 'kakko/28_sha.mp3',
  'ષ': 'kakko/29_sha.mp3',
  'સ': 'kakko/30_sa.mp3',
  'હ': 'kakko/31_ha.mp3',
  'ળ': 'kakko/32_la.mp3',
  'ક્ષ': 'kakko/33_ksha_or_xa.mp3',
  'જ્ઞ': 'kakko/34_gna.mp3',
  // Vowels
  'અ': 'kakko/35_a.mp3',
  'આ': 'kakko/36_a.mp3',
  'ઇ': 'kakko/37_i.mp3',
  'ઈ': 'kakko/38_i.mp3',
  'ઉ': 'kakko/39_u.mp3',
  'ઊ': 'kakko/40_u.mp3',
  'ઋ': 'kakko/41_ru.mp3',
  'એ': 'kakko/42_e.mp3',
  'ઐ': 'kakko/43_ai.mp3',
  'ઓ': 'kakko/44_o.mp3',
  'ઔ': 'kakko/45_am.mp3',
  // Numbers
  '૦': 'numbers/0.mp3',
  '૧': 'numbers/1.mp3',
  '૨': 'numbers/2.mp3',
  '૩': 'numbers/3.mp3',
  '૪': 'numbers/4.mp3',
  '૫': 'numbers/5.mp3',
  '૬': 'numbers/6.mp3',
  '૭': 'numbers/7.mp3',
  '૮': 'numbers/8.mp3',
  '૯': 'numbers/9.mp3',
};

export const speakGujarati = (text: string, phonetic?: string): boolean => {
  try {
    // 1. Attempt high-fidelity pre-recorded audio playback on web
    if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
      const audioSubpath = CHAR_AUDIO_MAP[text.trim()];
      if (audioSubpath) {
        // Resolve path relative to current site location
        // When on /gujarati-language-gen/handwriting/, assets are at ../assets/audio/
        const basePath = window.location.pathname.includes('/handwriting')
          ? '../assets/audio/'
          : 'assets/audio/';
        const audioUrl = basePath + audioSubpath;

        let audio = AUDIO_CACHE[audioUrl];
        if (!audio) {
          audio = new Audio(audioUrl);
          AUDIO_CACHE[audioUrl] = audio;
        }
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Successfully playing pre-recorded audio
            })
            .catch(() => {
              // Browser policy blocked or file not found, fall back to Web Speech
              playWebSpeech(text, phonetic);
            });
          return true;
        }
      }
    }

    // 2. Fallback to Web Speech API
    return playWebSpeech(text, phonetic);
  } catch (e) {
    console.warn('Audio playback error:', e);
    return false;
  }
};

function playWebSpeech(text: string, phonetic?: string): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'gu-IN';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const guVoice = voices.find(
      v => v.lang.startsWith('gu') || v.name.toLowerCase().includes('gujarati')
    );
    const hiVoice = voices.find(
      v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')
    );

    if (guVoice) {
      utterance.voice = guVoice;
    } else if (hiVoice) {
      utterance.voice = hiVoice;
    } else if (phonetic && voices.length > 0) {
      const enUtterance = new SpeechSynthesisUtterance(phonetic);
      enUtterance.lang = 'en-US';
      enUtterance.rate = 0.8;
      window.speechSynthesis.speak(enUtterance);
      return true;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  }
  return false;
}
