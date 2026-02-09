/**
 * Simple generator for Brown Noise (softer than white noise) 
 * to serve as ambient background without external assets.
 */
class AudioService {
  private audioCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  private init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
  }

  public toggle(shouldPlay: boolean, volume: number) {
    if (shouldPlay) {
      this.play(volume);
    } else {
      this.stop();
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), this.audioCtx.currentTime + 0.1);
    }
  }

  private play(volume: number) {
    if (this.isPlaying) return;
    this.init();
    if (!this.audioCtx) return;

    // Resume context if suspended (browser policy)
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const bufferSize = 4096;
    const brownNoise = (function() {
      let lastOut = 0;
      const node = this.audioCtx.createScriptProcessor(bufferSize, 1, 1);
      node.onaudioprocess = function(e) {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // (roughly) compensate for gain
        }
      };
      return node;
    }).call(this);

    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = volume;

    brownNoise.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
    
    this.isPlaying = true;
  }

  private stop() {
    if (!this.isPlaying || !this.audioCtx) return;
    this.audioCtx.close().then(() => {
      this.audioCtx = null;
      this.gainNode = null;
      this.isPlaying = false;
    });
  }
}

export const audioService = new AudioService();