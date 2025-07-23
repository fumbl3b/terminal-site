// Terminal sound effects using Web Audio API
class TerminalSounds {
  private audioContext: AudioContext | null = null;
  private enabled = false;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      console.warn('Web Audio API not supported');
    }
  }

  private async resumeAudioContext() {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  enable() {
    this.enabled = true;
    this.resumeAudioContext();
  }

  disable() {
    this.enabled = false;
  }

  isEnabled() {
    return this.enabled;
  }

  private playTone(frequency: number, duration: number, volume = 0.1) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Typing sound - more realistic keyboard sounds with variation
  playKeyPress() {
    if (!this.enabled || !this.audioContext) return;

    // Add slight randomization to make it sound more natural
    const baseFreq = 800 + (Math.random() - 0.5) * 200; // Random between 700-900Hz
    const duration = 0.08 + Math.random() * 0.04; // Random between 0.08-0.12s
    const volume = 0.12 + Math.random() * 0.08; // Random between 0.12-0.20

    // Create a more complex sound with multiple tones for realism
    this.playTone(baseFreq, duration * 0.6, volume * 0.7); // Main click
    setTimeout(() => {
      this.playTone(baseFreq * 0.5, duration * 0.4, volume * 0.3); // Lower harmonic
    }, 5);
  }

  // Alternative typing sounds for variety
  playKeyPressAlt() {
    if (!this.enabled || !this.audioContext) return;
    
    const baseFreq = 600 + (Math.random() - 0.5) * 150;
    const duration = 0.07 + Math.random() * 0.03;
    const volume = 0.10 + Math.random() * 0.06;
    
    this.playTone(baseFreq, duration, volume);
  }

  // Special key sounds
  playEnterKey() {
    if (!this.enabled || !this.audioContext) return;
    this.playTone(1200, 0.15, 0.15); // Higher, longer tone for Enter
  }

  playBackspace() {
    if (!this.enabled || !this.audioContext) return;
    this.playTone(400, 0.08, 0.10); // Lower tone for backspace
  }

  playTabKey() {
    if (!this.enabled || !this.audioContext) return;
    this.playTone(900, 0.12, 0.12); // Distinctive tone for tab
  }

  playSpacebar() {
    if (!this.enabled || !this.audioContext) return;
    this.playTone(500, 0.10, 0.08); // Deeper, softer tone for space
  }

  // Command execution sound - slightly different tone
  playCommand() {
    this.playTone(600, 0.1, 0.08);
  }

  // Error sound - lower, longer tone
  playError() {
    this.playTone(300, 0.2, 0.1);
  }

  // Success sound - higher, pleasant tone
  playSuccess() {
    this.playTone(1000, 0.15, 0.08);
  }

  // Boot-up sequence
  playBootup() {
    if (!this.enabled || !this.audioContext) return;
    
    const notes = [400, 500, 600, 800];
    notes.forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 0.15, 0.06), index * 100);
    });
  }
}

export const terminalSounds = new TerminalSounds();