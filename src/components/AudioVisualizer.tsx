import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../services/audioEngine';
import { Activity, Radio, Volume2 } from 'lucide-react';

interface Props {
  isPlaying?: boolean;
  className?: string;
  mode?: 'oscilloscope' | 'bars' | 'dual';
}

export const AudioVisualizer: React.FC<Props> = ({
  isPlaying = false,
  className = '',
  mode = 'dual',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [activeMode, setActiveMode] = useState<'oscilloscope' | 'bars' | 'dual'>(mode);
  const [rmsLevel, setRmsLevel] = useState<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localIsPlaying = isPlaying;

    const render = () => {
      const analyser = audioEngine.getAnalyser();
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background subtle grid
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);

      // Subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (!analyser) {
        // Idle ambient line
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const timeData = new Uint8Array(bufferLength);

      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(timeData);

      // Compute RMS
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = (timeData[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / bufferLength);
      setRmsLevel(Math.min(100, Math.round(rms * 150)));

      // Render Frequency Bars
      if (activeMode === 'bars' || activeMode === 'dual') {
        const barCount = 48;
        const barWidth = (width / barCount) - 2;
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * step] || 0;
          const percent = value / 255;
          const barHeight = Math.max(3, percent * (height * 0.75));
          const x = i * (barWidth + 2);
          const y = height - barHeight;

          // Gradient color: Amber to Orange to Red
          const gradient = ctx.createLinearGradient(0, y, 0, height);
          if (percent > 0.7) {
            gradient.addColorStop(0, '#ef4444');
            gradient.addColorStop(0.5, '#f59e0b');
            gradient.addColorStop(1, 'rgba(245, 158, 11, 0.2)');
          } else {
            gradient.addColorStop(0, '#f59e0b');
            gradient.addColorStop(1, 'rgba(245, 158, 11, 0.15)');
          }

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();

          // Peak cap
          if (percent > 0.05) {
            ctx.fillStyle = '#fde68a';
            ctx.fillRect(x, Math.max(0, y - 2), barWidth, 2);
          }
        }
      }

      // Render Oscilloscope Waveform
      if (activeMode === 'oscilloscope' || activeMode === 'dual') {
        ctx.lineWidth = activeMode === 'dual' ? 2 : 2.5;
        ctx.strokeStyle = activeMode === 'dual' ? '#38bdf8' : '#f59e0b';
        ctx.shadowColor = activeMode === 'dual' ? 'rgba(56, 189, 248, 0.5)' : 'rgba(245, 158, 11, 0.5)';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [activeMode]);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a]/90 backdrop-blur ${className}`}>
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          <span className="font-mono text-slate-300">محلل الصوت الحي (Visualizer)</span>
          <span className="text-slate-600">·</span>
          <span className="font-mono text-xs tabular-nums text-amber-400">{rmsLevel}% Peak</span>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveMode('dual')}
            className={`px-2 py-0.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeMode === 'dual'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            مزدوج (Dual)
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('oscilloscope')}
            className={`px-2 py-0.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeMode === 'oscilloscope'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الموجة (Wave)
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('bars')}
            className={`px-2 py-0.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeMode === 'bars'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الترددات (Spectrum)
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full h-28 sm:h-36">
        <canvas
          ref={canvasRef}
          width={800}
          height={180}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};
