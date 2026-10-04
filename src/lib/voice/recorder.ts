/**
 * Cross-platform microphone audio recorder with live visualizer decibel tracking.
 * Works seamlessly in iOS Safari, iOS Home Screen PWA, Android, and Desktop.
 */

export class AudioVoiceRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  async start(onWaveLevels?: (levels: number[]) => void): Promise<void> {
    this.audioChunks = [];

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    // 1. Real-time microphone audio visualizer
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.5;
        source.connect(this.analyser);

        if (onWaveLevels) {
          const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
          const updateWave = () => {
            if (!this.analyser || !this.mediaStream) return;
            this.analyser.getByteFrequencyData(dataArray);

            const bars: number[] = [];
            for (let i = 0; i < 24; i++) {
              const val = dataArray[i % dataArray.length] || 0;
              bars.push(Math.max(5, Math.round((val / 255) * 24)));
            }
            onWaveLevels(bars);
            this.animFrameId = requestAnimationFrame(updateWave);
          };
          this.animFrameId = requestAnimationFrame(updateWave);
        }
      }
    } catch (e) {
      console.warn('Live waveform analyser not available:', e);
    }

    // 2. Determine best supported MIME type
    let mimeType = '';
    if (typeof MediaRecorder !== 'undefined') {
      const types = [
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/aac',
        'audio/ogg;codecs=opus',
        'audio/webm',
        'audio/wav'
      ];
      for (const t of types) {
        if (MediaRecorder.isTypeSupported(t)) {
          mimeType = t;
          break;
        }
      }
    }

    try {
      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.mediaStream, { mimeType })
        : new MediaRecorder(this.mediaStream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100);
    } catch (err) {
      console.warn('MediaRecorder init error:', err);
    }
  }

  async stop(): Promise<Blob | null> {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        const fallbackBlob = this.audioChunks.length > 0 ? new Blob(this.audioChunks, { type: 'audio/mp4' }) : null;
        this.cleanup();
        resolve(fallbackBlob);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mime = this.mediaRecorder?.mimeType || 'audio/mp4';
        const audioBlob = new Blob(this.audioChunks, { type: mime });
        this.cleanup();
        resolve(audioBlob);
      };

      try {
        this.mediaRecorder.stop();
      } catch {
        this.cleanup();
        resolve(null);
      }
    });
  }

  cleanup() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }
}
