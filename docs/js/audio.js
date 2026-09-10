/**
 * audio.js: Kano-style sound manager for Gujarati pronunciations and UI sound effects.
 */

class SoundManager {
  constructor() {
    this.soundEnabled = localStorage.getItem('gujarati_sound_enabled') !== 'false'; // Default enabled
    this.audioElement = new Audio();
    this.currentAudioSrc = null;
    this.isPlaying = false;

    this.audioElement.addEventListener('ended', () => {
      this.setPlayingState(false);
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio playback notice:', e);
      this.setPlayingState(false);
    });
  }

  initUI() {
    this.updateSoundButton();
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('gujarati_sound_enabled', this.soundEnabled);
    this.updateSoundButton();
    if (!this.soundEnabled && this.isPlaying) {
      this.audioElement.pause();
      this.setPlayingState(false);
    }
    return this.soundEnabled;
  }

  updateSoundButton() {
    const btn = document.getElementById('btn-sound-toggle');
    if (btn) {
      btn.innerHTML = this.soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
      btn.classList.toggle('active', this.soundEnabled);
      btn.title = this.soundEnabled ? 'Click to Mute Audio' : 'Click to Enable Audio';
    }
  }

  setPlayingState(playing) {
    this.isPlaying = playing;
    const pronounceBtn = document.getElementById('btn-pronounce');
    if (pronounceBtn) {
      pronounceBtn.classList.toggle('playing', playing);
      const icon = pronounceBtn.querySelector('.audio-icon');
      if (icon) icon.innerText = playing ? '🎶' : '🔊';
    }
  }

  playAudio(audioRelPath, force = false) {
    if (!this.soundEnabled && !force) return;
    if (!audioRelPath) return;

    try {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement.src = audioRelPath;
      this.currentAudioSrc = audioRelPath;
      this.setPlayingState(true);

      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Autoplay was prevented by browser policy (e.g., before first user interaction)
          console.debug('Autoplay prevented until user gesture:', err.message);
          this.setPlayingState(false);
        });
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
      this.setPlayingState(false);
    }
  }

  replayCurrent() {
    if (this.currentAudioSrc) {
      this.playAudio(this.currentAudioSrc, true);
    }
  }
}

window.soundManager = new SoundManager();
