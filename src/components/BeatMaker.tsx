import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  RefreshCw,
  Sliders,
  Volume2,
  Trash2,
  Disc,
  Music,
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface Props {
  onSoundTriggered?: () => void;
}

const TRACKS = [
  { id: 'kick', name: 'طبلة / Kick', color: 'bg-amber-500' },
  { id: 'snare', name: 'صاج / Snare', color: 'bg-rose-500' },
  { id: 'hihat', name: 'هاي هات / Hi-Hat', color: 'bg-sky-400' },
  { id: 'clap', name: 'تصفيق / Clap', color: 'bg-emerald-400' },
];

const PRESETS = [
  {
    name: 'مقسوم شرقي (Maqsum)',
    bpm: 110,
    grid: [
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0], // Kick (Dum)
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // Snare (Tak)
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], // Hihat
      [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0], // Clap/Es
    ],
  },
  {
    name: 'هيب هوب (Boom Bap)',
    bpm: 92,
    grid: [
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: 'هاوس (House 4x4)',
    bpm: 124,
    grid: [
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    ],
  },
];

export const BeatMaker: React.FC<Props> = ({ onSoundTriggered }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(110);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [grid, setGrid] = useState<number[][]>(PRESETS[0].grid);

  const timerRef = useRef<number | null>(null);
  const currentStepRef = useRef<number>(0);

  // Play synthesized drum hits
  const playDrumSound = (trackId: string) => {
    audioEngine.getContext();
    if (onSoundTriggered) onSoundTriggered();

    if (trackId === 'kick') {
      audioEngine.playSynthesizedSound({
        waveform: 'sine',
        frequency: 150,
        pitchDrop: { targetFreq: 38, duration: 0.12 },
        attack: 0.005,
        decay: 0.25,
        sustain: 0.05,
        release: 0.1,
      });
    } else if (trackId === 'snare') {
      audioEngine.playSynthesizedSound({
        waveform: 'noise',
        frequency: 300,
        filterType: 'bandpass',
        filterCutoff: 1800,
        attack: 0.005,
        decay: 0.15,
        sustain: 0.02,
        release: 0.08,
      });
    } else if (trackId === 'hihat') {
      audioEngine.playSynthesizedSound({
        waveform: 'noise',
        frequency: 8000,
        filterType: 'highpass',
        filterCutoff: 7000,
        attack: 0.002,
        decay: 0.05,
        sustain: 0.01,
        release: 0.03,
      });
    } else if (trackId === 'clap') {
      audioEngine.playSynthesizedSound({
        waveform: 'noise',
        frequency: 1200,
        filterType: 'bandpass',
        filterCutoff: 1400,
        attack: 0.01,
        decay: 0.2,
        sustain: 0.05,
        release: 0.1,
        distortion: 8,
      });
    }
  };

  // Step trigger
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = (60 / bpm / 4) * 1000;

    timerRef.current = window.setInterval(() => {
      const step = currentStepRef.current;
      setCurrentStep(step);

      // Check hits on this step
      TRACKS.forEach((track, trackIdx) => {
        if (grid[trackIdx] && grid[trackIdx][step]) {
          playDrumSound(track.id);
        }
      });

      currentStepRef.current = (step + 1) % 16;
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, bpm, grid]);

  const toggleStep = (trackIdx: number, stepIdx: number) => {
    const newGrid = grid.map((row, rIdx) => {
      if (rIdx === trackIdx) {
        const newRow = [...row];
        newRow[stepIdx] = newRow[stepIdx] ? 0 : 1;
        return newRow;
      }
      return row;
    });
    setGrid(newGrid);

    // If turned on, preview the drum sound
    if (!grid[trackIdx][stepIdx]) {
      playDrumSound(TRACKS[trackIdx].id);
    }
  };

  const handleClear = () => {
    setGrid([
      new Array(16).fill(0),
      new Array(16).fill(0),
      new Array(16).fill(0),
      new Array(16).fill(0),
    ]);
  };

  const loadPreset = (preset: typeof PRESETS[0]) => {
    setGrid(preset.grid);
    setBpm(preset.bpm);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Disc className="h-5 w-5 text-amber-400" />
            صانع الإيقاعات التفاعلي (16-Step Beat Maker)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            برمج إيقاعات المقسوم الشرقي، الهيب هوب والموسيقى الإلكترونية بنقرات على الشبكة
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-500 font-medium">إيقاعات جاهزة:</span>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => loadPreset(p)}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-slate-300 hover:text-white transition-colors whitespace-nowrap"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 overflow-x-auto">
        <div className="min-w-[620px] space-y-3">
          {TRACKS.map((track, trackIdx) => (
            <div key={track.id} className="flex items-center gap-3">
              {/* Track Name */}
              <button
                type="button"
                onClick={() => playDrumSound(track.id)}
                className="w-28 text-right py-2 px-3 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 transition-colors shrink-0"
              >
                {track.name}
              </button>

              {/* 16 Steps */}
              <div className="flex-1 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5">
                {Array.from({ length: 16 }).map((_, stepIdx) => {
                  const isActive = Boolean(grid[trackIdx]?.[stepIdx]);
                  const isCurrent = isPlaying && currentStep === stepIdx;
                  const isBarStart = stepIdx % 4 === 0;

                  return (
                    <button
                      key={stepIdx}
                      type="button"
                      onClick={() => toggleStep(trackIdx, stepIdx)}
                      className={`h-11 rounded-md transition-all flex items-center justify-center relative ${
                        isActive
                          ? `${track.color} shadow-sm text-slate-950`
                          : isBarStart
                          ? 'bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60'
                          : 'bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/60'
                      } ${isCurrent ? 'ring-2 ring-white scale-105 z-10' : ''}`}
                    >
                      {isActive && <span className="h-2 w-2 rounded-full bg-slate-950/60"></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Transport Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (isPlaying) {
                setIsPlaying(false);
              } else {
                audioEngine.getContext();
                setIsPlaying(true);
              }
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap shadow-md ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="h-4 w-4 fill-white" />
                <span>إيقاف الإيقاع</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-slate-950" />
                <span>تشغيل الإيقاع</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>مسح الكل</span>
          </button>
        </div>

        {/* BPM Slider */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold">السرعة (Tempo):</span>
          <input
            type="range"
            min="70"
            max="160"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="w-32 accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <span className="font-mono text-amber-400 text-xs font-bold tabular-nums">
            {bpm} BPM
          </span>
        </div>
      </div>
    </div>
  );
};
