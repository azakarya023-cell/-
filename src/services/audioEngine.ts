// Audio Engine with Web Audio API, Effects Chain, Visualizer, and WAV Export

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private currentSource: AudioNode | null = null;
  private isMuted: boolean = false;
  private currentAudioElement: HTMLAudioElement | null = null;

  // Initialize or resume AudioContext safely on user interaction
  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;

      // Dynamics Compressor to prevent clipping
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      // Analyser for real-time visualization
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(compressor);
      compressor.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  public getAnalyser(): AnalyserNode | null {
    if (!this.analyser) {
      this.getContext();
    }
    return this.analyser;
  }

  public setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
  }

  public stopCurrentPlayback() {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
    if (this.currentSource) {
      try {
        (this.currentSource as any).stop?.();
      } catch (e) {
        // Ignored
      }
      this.currentSource = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Play base64 encoded audio (WAV / MP3) with optional Web Audio routing for visualization and FX
  public async playBase64Audio(
    base64Data: string,
    mimeType: string = 'audio/wav',
    effectType: string = 'none',
    onEnded?: () => void
  ): Promise<HTMLAudioElement | null> {
    this.stopCurrentPlayback();
    const ctx = this.getContext();

    try {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // If user selected an audio effect other than 'none', route through Web Audio nodes
      if (effectType !== 'none') {
        const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
        return this.playBufferWithEffects(audioBuffer, effectType, onEnded);
      }

      // Otherwise standard HTML5 Audio connected to Web Audio Analyser
      const blob = new Blob([bytes], { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      this.currentAudioElement = audio;

      const sourceNode = ctx.createMediaElementSource(audio);
      if (this.masterGain) {
        sourceNode.connect(this.masterGain);
      }

      audio.onended = () => {
        if (onEnded) onEnded();
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      return audio;
    } catch (err) {
      console.error('Error playing base64 audio:', err);
      // Fallback direct Audio tag
      const fallbackAudio = new Audio(`data:${mimeType};base64,${base64Data}`);
      this.currentAudioElement = fallbackAudio;
      fallbackAudio.onended = () => onEnded?.();
      await fallbackAudio.play();
      return fallbackAudio;
    }
  }

  // Play an AudioBuffer with real-time effects (Robot, Megaphone, Echo, Reverb, Monster, Chipmunk)
  public playBufferWithEffects(
    buffer: AudioBuffer,
    effect: string,
    onEnded?: () => void
  ): any {
    const ctx = this.getContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    this.currentSource = source;

    let finalNode: AudioNode = source;

    if (effect === 'robot') {
      // Ring modulation robot effect
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(50, ctx.currentTime);

      const ringGain = ctx.createGain();
      ringGain.gain.setValueAtTime(0.5, ctx.currentTime);

      const modGain = ctx.createGain();
      modGain.gain.setValueAtTime(0.5, ctx.currentTime);

      osc.connect(ringGain.gain);
      source.connect(ringGain);
      osc.start();
      finalNode = ringGain;

      source.onended = () => {
        try {
          osc.stop();
        } catch (_) {}
        onEnded?.();
      };
    } else if (effect === 'megaphone') {
      // Bandpass radio/walkie-talkie
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, ctx.currentTime);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);

      // Waveshaper distortion
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(25);
      shaper.oversample = '4x';

      source.connect(filter);
      filter.connect(shaper);
      finalNode = shaper;

      source.onended = () => onEnded?.();
    } else if (effect === 'echo') {
      // Stereo Delay
      const delay = ctx.createDelay();
      delay.delayTime.setValueAtTime(0.25, ctx.currentTime);

      const feedback = ctx.createGain();
      feedback.gain.setValueAtTime(0.45, ctx.currentTime);

      const delayFilter = ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.setValueAtTime(3000, ctx.currentTime);

      delay.connect(feedback);
      feedback.connect(delayFilter);
      delayFilter.connect(delay);

      const mixGain = ctx.createGain();
      source.connect(mixGain);
      source.connect(delay);
      delay.connect(mixGain);

      finalNode = mixGain;
      source.onended = () => onEnded?.();
    } else if (effect === 'reverb') {
      // Lush synthetic room reverb
      const convolver = ctx.createConvolver();
      convolver.buffer = this.buildImpulseResponse(ctx, 2.2, 2.0);

      const dry = ctx.createGain();
      dry.gain.setValueAtTime(0.7, ctx.currentTime);

      const wet = ctx.createGain();
      wet.gain.setValueAtTime(0.55, ctx.currentTime);

      const mix = ctx.createGain();
      source.connect(dry);
      source.connect(convolver);
      convolver.connect(wet);

      dry.connect(mix);
      wet.connect(mix);

      finalNode = mix;
      source.onended = () => onEnded?.();
    } else if (effect === 'monster') {
      // Deep pitch down + bass boost
      source.playbackRate.setValueAtTime(0.75, ctx.currentTime);
      const lowFilter = ctx.createBiquadFilter();
      lowFilter.type = 'lowshelf';
      lowFilter.frequency.setValueAtTime(250, ctx.currentTime);
      lowFilter.gain.setValueAtTime(10, ctx.currentTime);

      source.connect(lowFilter);
      finalNode = lowFilter;
      source.onended = () => onEnded?.();
    } else if (effect === 'chipmunk') {
      // Fast high pitch
      source.playbackRate.setValueAtTime(1.4, ctx.currentTime);
      finalNode = source;
      source.onended = () => onEnded?.();
    } else {
      source.onended = () => onEnded?.();
    }

    if (this.masterGain) {
      finalNode.connect(this.masterGain);
    }
    source.start();
    return source;
  }

  // Synthesize sound effect using oscillator / noise / filter / envelope
  public playSynthesizedSound(params: {
    waveform?: OscillatorType | 'noise';
    frequency?: number;
    duration?: number;
    pitchDrop?: { targetFreq: number; duration: number };
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    filterType?: BiquadFilterType;
    filterCutoff?: number;
    distortion?: number;
  }) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const dur = params.duration || 0.4;
    const attack = params.attack || 0.01;
    const decay = params.decay || 0.15;
    const sustain = params.sustain ?? 0.3;
    const release = params.release || 0.2;
    const baseFreq = params.frequency || 440;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.9, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, sustain * 0.9), now + attack + decay);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + dur + release);

    let soundNode: AudioNode;

    if (params.waveform === 'noise') {
      // White noise buffer
      const bufferSize = ctx.sampleRate * (dur + release);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.start(now);
      noise.stop(now + dur + release);
      soundNode = noise;
    } else {
      const osc = ctx.createOscillator();
      osc.type = (params.waveform as OscillatorType) || 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);

      if (params.pitchDrop) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(10, params.pitchDrop.targetFreq),
          now + params.pitchDrop.duration
        );
      }

      osc.start(now);
      osc.stop(now + dur + release);
      soundNode = osc;
    }

    let chain: AudioNode = soundNode;

    // Filter
    if (params.filterType && params.filterCutoff) {
      const filter = ctx.createBiquadFilter();
      filter.type = params.filterType;
      filter.frequency.setValueAtTime(params.filterCutoff, now);
      chain.connect(filter);
      chain = filter;
    }

    // Distortion
    if (params.distortion && params.distortion > 0) {
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(params.distortion);
      chain.connect(shaper);
      chain = shaper;
    }

    chain.connect(gainNode);
    if (this.masterGain) {
      gainNode.connect(this.masterGain);
    }
  }

  // Create an impulse response buffer for realistic room reverb
  private buildImpulseResponse(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const mult = Math.pow(1 - n, decay);
      left[i] = (Math.random() * 2 - 1) * mult;
      right[i] = (Math.random() * 2 - 1) * mult;
    }
    return impulse;
  }

  // Distortion curve generator
  private makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
    const k = amount;
    const nSamples = 44100;
    const buffer = new ArrayBuffer(nSamples * 4);
    const curve = new Float32Array(buffer);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // Render a sound recipe offline into a downloadable WAV Blob
  public async renderRecipeToWavBlob(recipe: any): Promise<Blob> {
    const sampleRate = 44100;
    const dur = Math.min(5, (recipe.envelope?.attack || 0.05) + (recipe.envelope?.decay || 0.2) + (recipe.envelope?.release || 0.3) + 0.2);
    const offlineCtx = new OfflineAudioContext(1, sampleRate * dur, sampleRate);

    const now = 0;
    const gainNode = offlineCtx.createGain();
    const attack = recipe.envelope?.attack || 0.01;
    const decay = recipe.envelope?.decay || 0.2;
    const sustain = recipe.envelope?.sustain ?? 0.3;
    const release = recipe.envelope?.release || 0.2;
    const baseFreq = recipe.frequency || 440;

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.9, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, sustain * 0.9), now + attack + decay);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    let soundNode: AudioNode;
    if (recipe.waveform === 'noise') {
      const buffer = offlineCtx.createBuffer(1, sampleRate * dur, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = offlineCtx.createBufferSource();
      noise.buffer = buffer;
      noise.start(now);
      soundNode = noise;
    } else {
      const osc = offlineCtx.createOscillator();
      osc.type = recipe.waveform || 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);

      if (recipe.pitchSweep?.enabled) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, recipe.pitchSweep.targetFreq || 100),
          now + (recipe.pitchSweep.duration || 0.2)
        );
      }
      osc.start(now);
      soundNode = osc;
    }

    let chain: AudioNode = soundNode;

    if (recipe.filter?.cutoff) {
      const filter = offlineCtx.createBiquadFilter();
      filter.type = recipe.filter.type || 'lowpass';
      filter.frequency.setValueAtTime(recipe.filter.cutoff, now);
      filter.Q.setValueAtTime(recipe.filter.resonance || 1, now);
      chain.connect(filter);
      chain = filter;
    }

    chain.connect(gainNode);
    gainNode.connect(offlineCtx.destination);

    const renderedBuffer = await offlineCtx.startRendering();
    return this.audioBufferToWavBlob(renderedBuffer);
  }

  // Convert an AudioBuffer to standard 16-bit PCM RIFF WAV
  public audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');

    // FMT sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // Data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Interleave channels
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        // Clip sample between -1 and 1
        const clamped = Math.max(-1, Math.min(1, sample));
        // Convert to 16-bit signed integer
        const intSample = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // Helper to trigger browser file download for a blob
  public downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }
}

export const audioEngine = new AudioEngine();
