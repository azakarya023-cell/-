import React, { useState } from 'react';
import {
  Zap,
  Play,
  Download,
  Sparkles,
  Sliders,
  RefreshCw,
  Volume2,
  Dice5,
  Wand2,
  Square,
  Activity,
  Layers,
  CircleDot,
  Radio,
  Music,
  Coins,
  ArrowUpCircle,
  Bomb,
  Rocket,
  Shield,
  Wind,
  CheckCircle,
  AlertTriangle,
  Flame,
  Disc,
  AudioLines,
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { SOUND_PRESETS, SoundRecipe } from '../services/soundPresets';

interface Props {
  onSoundTriggered?: () => void;
}

// Icon mapper helper
const renderIcon = (iconName: string) => {
  switch (iconName) {
    case 'Zap': return <Zap className="h-4 w-4" />;
    case 'Coins': return <Coins className="h-4 w-4" />;
    case 'ArrowUpCircle': return <ArrowUpCircle className="h-4 w-4" />;
    case 'Sparkles': return <Sparkles className="h-4 w-4" />;
    case 'Bomb': return <Bomb className="h-4 w-4" />;
    case 'Rocket': return <Rocket className="h-4 w-4" />;
    case 'Shield': return <Shield className="h-4 w-4" />;
    case 'Radio': return <Radio className="h-4 w-4" />;
    case 'CircleDot': return <CircleDot className="h-4 w-4" />;
    case 'Wind': return <Wind className="h-4 w-4" />;
    case 'CheckCircle': return <CheckCircle className="h-4 w-4" />;
    case 'AlertTriangle': return <AlertTriangle className="h-4 w-4" />;
    case 'Flame': return <Flame className="h-4 w-4" />;
    case 'Music': return <Music className="h-4 w-4" />;
    case 'Disc': return <Disc className="h-4 w-4" />;
    default: return <AudioLines className="h-4 w-4" />;
  }
};

export const SoundEffectsLab: React.FC<Props> = ({ onSoundTriggered }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  // Active Synthesizer State
  const [synthConfig, setSynthConfig] = useState<SoundRecipe>({
    id: 'custom_synth',
    name: 'صوت مخصص',
    englishName: 'Custom Synth',
    category: 'game',
    icon: 'Zap',
    description: 'تحكم يدوي كامل بجميع خصائص الموجة والمؤثرات',
    waveform: 'sawtooth',
    frequency: 440,
    pitchSweep: { enabled: true, targetFreq: 110, duration: 0.2 },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.15 },
    filter: { type: 'lowpass', cutoff: 3500, resonance: 4 },
    effects: { distortion: 0, delayTime: 0, delayFeedback: 0 },
  });

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Filter presets by category
  const filteredPresets = activeCategory === 'all'
    ? SOUND_PRESETS
    : SOUND_PRESETS.filter((p) => p.category === activeCategory);

  // Play a preset recipe
  const handlePlayPreset = (recipe: SoundRecipe) => {
    setActivePlayingId(recipe.id);
    audioEngine.getContext();
    if (onSoundTriggered) onSoundTriggered();

    audioEngine.playSynthesizedSound({
      waveform: recipe.waveform,
      frequency: recipe.frequency,
      duration: (recipe.envelope.attack + recipe.envelope.decay + recipe.envelope.release),
      pitchDrop: recipe.pitchSweep?.enabled
        ? { targetFreq: recipe.pitchSweep.targetFreq, duration: recipe.pitchSweep.duration }
        : undefined,
      attack: recipe.envelope.attack,
      decay: recipe.envelope.decay,
      sustain: recipe.envelope.sustain,
      release: recipe.envelope.release,
      filterType: recipe.filter.type,
      filterCutoff: recipe.filter.cutoff,
      distortion: recipe.effects?.distortion,
    });

    setTimeout(() => {
      setActivePlayingId(null);
    }, 400);
  };

  // Download a preset as WAV
  const handleDownloadPreset = async (recipe: SoundRecipe) => {
    try {
      const blob = await audioEngine.renderRecipeToWavBlob(recipe);
      audioEngine.downloadBlob(blob, `SawtLab_${recipe.id}_${Date.now()}.wav`);
    } catch (e) {
      console.error('Failed to export sound:', e);
    }
  };

  // Load a preset into the synth sandbox for editing
  const handleLoadIntoSandbox = (recipe: SoundRecipe) => {
    setSynthConfig({ ...recipe });
  };

  // Play sandbox sound
  const handlePlaySandbox = () => {
    handlePlayPreset(synthConfig);
  };

  // Randomize Sandbox parameters
  const handleRandomize = () => {
    const waveforms: ('sine' | 'square' | 'sawtooth' | 'triangle' | 'noise')[] = [
      'sine', 'square', 'sawtooth', 'triangle', 'noise'
    ];
    const filterTypes: ('lowpass' | 'highpass' | 'bandpass')[] = ['lowpass', 'highpass', 'bandpass'];

    const randomFreq = Math.floor(Math.random() * 1200) + 80;
    const randomTarget = Math.floor(Math.random() * 1000) + 40;
    const sweepEnabled = Math.random() > 0.3;

    const randomRecipe: SoundRecipe = {
      id: `random_${Date.now()}`,
      name: 'صوت عشوائي جديد',
      englishName: 'Random Sound',
      category: 'game',
      icon: 'Dice5',
      description: 'تم توليده عشوائياً بواسطة محرك التوليف الصوتي',
      waveform: waveforms[Math.floor(Math.random() * waveforms.length)],
      frequency: randomFreq,
      pitchSweep: {
        enabled: sweepEnabled,
        targetFreq: randomTarget,
        duration: Number((Math.random() * 0.4 + 0.05).toFixed(2)),
      },
      envelope: {
        attack: Number((Math.random() * 0.08 + 0.005).toFixed(3)),
        decay: Number((Math.random() * 0.35 + 0.05).toFixed(2)),
        sustain: Number((Math.random() * 0.6).toFixed(2)),
        release: Number((Math.random() * 0.4 + 0.05).toFixed(2)),
      },
      filter: {
        type: filterTypes[Math.floor(Math.random() * filterTypes.length)],
        cutoff: Math.floor(Math.random() * 7000) + 500,
        resonance: Math.floor(Math.random() * 10) + 1,
      },
      effects: {
        distortion: Math.random() > 0.6 ? Math.floor(Math.random() * 25) : 0,
      },
    };

    setSynthConfig(randomRecipe);
    handlePlayPreset(randomRecipe);
  };

  // Ask AI to generate sound recipe
  const handleAiGenerateRecipe = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiMessage(null);

    try {
      const res = await fetch('/api/ai/sound-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      const data = await res.json();
      if (data.success && data.recipe) {
        setSynthConfig({
          ...synthConfig,
          ...data.recipe,
          id: `ai_${Date.now()}`,
        });
        setAiMessage(`تم توليد صوت "${data.recipe.name || 'الصوت الجديد'}" بنجاح!`);
        handlePlayPreset(data.recipe);
      } else {
        setAiMessage(data.error || 'تعذر توليد وصفة الصوت من الذكاء الاصطناعي');
      }
    } catch (e: any) {
      setAiMessage('تعذر الاتصال بخدمة الذكاء الاصطناعي');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            صانع ومكتبة المؤثرات الصوتية (Sound FX Lab)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            توليد مؤثرات الألعاب، الخيال العلمي، الواجهات والكوميديا فورياً مع محرك التوليف والتحميل كـ WAV
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'game', label: 'ألعاب و 8-بت' },
            { id: 'scifi', label: 'خيال علمي' },
            { id: 'ui', label: 'واجهات وتطبيقات' },
            { id: 'cartoon', label: 'كرتون وكوميديا' },
            { id: 'musical', label: 'بيز وإيقاع' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Soundboard Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
        {filteredPresets.map((preset) => {
          const isPlaying = activePlayingId === preset.id;
          return (
            <div
              key={preset.id}
              className={`p-3.5 rounded-xl border transition-all text-right group relative flex flex-col justify-between ${
                isPlaying
                  ? 'bg-amber-500/20 border-amber-500 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`p-2 rounded-lg ${
                      isPlaying
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-amber-400 group-hover:bg-amber-500/20'
                    } transition-colors`}
                  >
                    {renderIcon(preset.icon)}
                  </span>

                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    {preset.waveform}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                  {preset.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => handlePlayPreset(preset)}
                  className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                    isPlaying
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200'
                  }`}
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>استماع</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPreset(preset)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded-md transition-colors"
                  title="تحميل ملف WAV"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleLoadIntoSandbox(preset)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded-md transition-colors"
                  title="تعديل هذا الصوت في المختبر"
                >
                  <Sliders className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Sound Prompt Bar */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white">صانع الأصوات بالذكاء الاصطناعي (AI Prompt)</h3>
          </div>
          <span className="text-[11px] text-amber-400/80">اكتب وصف الصوت وسيقوم الذكاء الاصطناعي بتصميمه</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiGenerateRecipe()}
            placeholder="مثال: صوت سيف ليزر مستقبلي، أو ارتطام معدني، أو قطرة ماء صدى..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={handleAiGenerateRecipe}
            disabled={isAiLoading || !aiPrompt.trim()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isAiLoading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>ابتكر الصوت</span>
          </button>
        </div>

        {aiMessage && (
          <p className="text-xs text-amber-300 mt-2 flex items-center gap-1">
            <span>{aiMessage}</span>
          </p>
        )}
      </div>

      {/* Custom Synthesizer Sandbox */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-400" />
              مختبر توليف الأصوات اليدوي (Modular Synthesizer)
            </h3>
            <p className="text-xs text-slate-400">
              التحكم الدقيق في التردد، شكل الموجة، مغلف الصوت (ADSR) والفلتر
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomize}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Dice5 className="h-3.5 w-3.5 text-amber-400" />
              <span>صوت عشوائي</span>
            </button>

            <button
              type="button"
              onClick={handlePlaySandbox}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-slate-950" />
              <span>تشغيل الصوت</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadPreset(synthConfig)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-amber-400" />
              <span>تحميل WAV</span>
            </button>
          </div>
        </div>

        {/* Synth Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Waveform Selector */}
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              شكل الموجة (Waveform)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['sine', 'square', 'sawtooth', 'triangle', 'noise'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSynthConfig({ ...synthConfig, waveform: w })}
                  className={`py-1.5 px-2 rounded text-xs font-mono transition-colors ${
                    synthConfig.waveform === w
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency & Pitch Sweep */}
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">التردد الأساسي</span>
              <span className="font-mono text-amber-400 tabular-nums">{synthConfig.frequency} Hz</span>
            </div>
            <input
              type="range"
              min="40"
              max="1600"
              step="10"
              value={synthConfig.frequency}
              onChange={(e) => setSynthConfig({ ...synthConfig, frequency: parseInt(e.target.value) })}
              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-1.5 text-slate-300">
                <input
                  type="checkbox"
                  checked={synthConfig.pitchSweep?.enabled ?? false}
                  onChange={(e) =>
                    setSynthConfig({
                      ...synthConfig,
                      pitchSweep: {
                        enabled: e.target.checked,
                        targetFreq: synthConfig.pitchSweep?.targetFreq || 80,
                        duration: synthConfig.pitchSweep?.duration || 0.2,
                      },
                    })
                  }
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>انحدار النغمة (Sweep)</span>
              </label>
              <span className="font-mono text-amber-400 text-[11px] tabular-nums">
                {synthConfig.pitchSweep?.targetFreq} Hz
              </span>
            </div>
            {synthConfig.pitchSweep?.enabled && (
              <input
                type="range"
                min="20"
                max="2000"
                step="20"
                value={synthConfig.pitchSweep.targetFreq}
                onChange={(e) =>
                  setSynthConfig({
                    ...synthConfig,
                    pitchSweep: {
                      ...synthConfig.pitchSweep!,
                      targetFreq: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            )}
          </div>

          {/* ADSR Envelope */}
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1.5">
            <span className="text-xs font-semibold text-slate-300 block mb-1">
              مغلف الصوت (ADSR Envelope)
            </span>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>الهجوم (Attack)</span>
              <span className="font-mono text-amber-400 tabular-nums">{synthConfig.envelope.attack}s</span>
            </div>
            <input
              type="range"
              min="0.005"
              max="0.5"
              step="0.01"
              value={synthConfig.envelope.attack}
              onChange={(e) =>
                setSynthConfig({
                  ...synthConfig,
                  envelope: { ...synthConfig.envelope, attack: parseFloat(e.target.value) },
                })
              }
              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>الاضمحلال (Decay)</span>
              <span className="font-mono text-amber-400 tabular-nums">{synthConfig.envelope.decay}s</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="1.5"
              step="0.05"
              value={synthConfig.envelope.decay}
              onChange={(e) =>
                setSynthConfig({
                  ...synthConfig,
                  envelope: { ...synthConfig.envelope, decay: parseFloat(e.target.value) },
                })
              }
              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Filter & Distortion */}
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1.5">
            <span className="text-xs font-semibold text-slate-300 block mb-1">
              الفلتر والتشويش (Filter & Drive)
            </span>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>القطع (Cutoff)</span>
              <span className="font-mono text-amber-400 tabular-nums">{synthConfig.filter.cutoff} Hz</span>
            </div>
            <input
              type="range"
              min="200"
              max="10000"
              step="100"
              value={synthConfig.filter.cutoff}
              onChange={(e) =>
                setSynthConfig({
                  ...synthConfig,
                  filter: { ...synthConfig.filter, cutoff: parseInt(e.target.value) },
                })
              }
              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>التشويش (Distortion)</span>
              <span className="font-mono text-amber-400 tabular-nums">
                {synthConfig.effects?.distortion || 0}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={synthConfig.effects?.distortion || 0}
              onChange={(e) =>
                setSynthConfig({
                  ...synthConfig,
                  effects: { ...synthConfig.effects, distortion: parseInt(e.target.value) },
                })
              }
              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
