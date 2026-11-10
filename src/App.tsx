import React, { useState } from 'react';
import {
  Volume2,
  Sparkles,
  Zap,
  Users,
  Mic,
  Disc,
  Bookmark,
  Radio,
  Sliders,
  AudioLines,
  Download,
  Info,
} from 'lucide-react';
import { AudioVisualizer } from './components/AudioVisualizer';
import { TextToSpeechStudio } from './components/TextToSpeechStudio';
import { DialogueStudio } from './components/DialogueStudio';
import { SoundEffectsLab } from './components/SoundEffectsLab';
import { VoiceChangerMic } from './components/VoiceChangerMic';
import { BeatMaker } from './components/BeatMaker';
import { SavedClipsDrawer, SavedClip } from './components/SavedClipsDrawer';
import { audioEngine } from './services/audioEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tts' | 'dialogue' | 'sfx' | 'voice' | 'beat'>('tts');
  const [savedClips, setSavedClips] = useState<SavedClip[]>([
    {
      id: 'demo_1',
      text: 'أهلاً بكم في مختبر الأصوات الذكي، صمم مؤثراتك الصوتية وانطق نصوصك بدقة عالية.',
      voice: 'Kore (أنثوي نقي)',
      model: 'gemini',
      date: 'اليوم',
      effect: 'none',
    },
  ]);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState<boolean>(false);
  const [masterVolume, setMasterVolume] = useState<number>(0.85);

  const handleSaveClip = (clip: SavedClip) => {
    setSavedClips((prev) => [clip, ...prev]);
  };

  const handleDeleteClip = (id: string) => {
    setSavedClips((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearAllClips = () => {
    setSavedClips([]);
  };

  const handleVolumeChange = (val: number) => {
    setMasterVolume(val);
    audioEngine.setMasterVolume(val);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar Contract: Zone 1 (Wordmark) - Zone 2 (4-5 single-line links) - Zone 3 (1 primary action) */}
      <header className="border-b border-slate-800/80 bg-[#0f172a]/95 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('tts');
            }}
            className="text-lg font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap shrink-0 group"
          >
            <span className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              ص
            </span>
            <span className="font-extrabold text-amber-400">SawtLab</span>
            <span className="text-slate-400 text-xs font-normal hidden sm:inline">· استوديو الأصوات</span>
          </a>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              type="button"
              onClick={() => setActiveTab('tts')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'tts'
                  ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5'
                  : 'hover:text-white text-slate-400'
              }`}
            >
              تحويل النص (TTS)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dialogue')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'dialogue'
                  ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5'
                  : 'hover:text-white text-slate-400'
              }`}
            >
              حوار ثنائي
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sfx')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'sfx'
                  ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5'
                  : 'hover:text-white text-slate-400'
              }`}
            >
              صانع المؤثرات
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('voice')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'voice'
                  ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5'
                  : 'hover:text-white text-slate-400'
              }`}
            >
              مغير الصوت
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('beat')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'beat'
                  ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5'
                  : 'hover:text-white text-slate-400'
              }`}
            >
              صانع الإيقاع
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsSavedDrawerOpen(!isSavedDrawerOpen)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <Bookmark className="h-3.5 w-3.5 text-amber-400" />
              <span>المحفوظات ({savedClips.length})</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav strip */}
        <div className="md:hidden flex items-center gap-2 px-4 py-2 bg-slate-900 border-t border-slate-800 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('tts')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'tts' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            نطق النص (TTS)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dialogue')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'dialogue' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            حوار ثنائي
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sfx')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'sfx' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            المؤثرات
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'voice' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            مغير الصوت
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('beat')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'beat' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            الإيقاعات
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Real-time Audio Visualizer Strip */}
        <AudioVisualizer mode="dual" />

        {/* Studio Workspace Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Main Work Area */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'tts' && (
              <TextToSpeechStudio onSaveClip={handleSaveClip} />
            )}

            {activeTab === 'dialogue' && (
              <DialogueStudio onSaveClip={handleSaveClip} />
            )}

            {activeTab === 'sfx' && (
              <SoundEffectsLab />
            )}

            {activeTab === 'voice' && (
              <VoiceChangerMic />
            )}

            {activeTab === 'beat' && (
              <BeatMaker />
            )}
          </div>

          {/* Side Panel: Master Console & Saved Library */}
          <div className="space-y-6">
            {/* Master Console Card */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-amber-400" />
                  وحدة التحكم الرئيسية (Master)
                </span>
                <span className="text-[10px] text-amber-400 font-mono">Web Audio API</span>
              </div>

              {/* Volume Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Volume2 className="h-3.5 w-3.5 text-slate-400" />
                    مستوى الصوت العام:
                  </span>
                  <span className="font-mono text-amber-400 font-semibold tabular-nums">
                    {Math.round(masterVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={masterVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Studio Specs */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span>جودة الإخراج:</span>
                  <span className="font-mono text-slate-300">WAV PCM 24/44.1kHz</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>محرك الذكاء الاصطناعي:</span>
                  <span className="font-mono text-amber-400">Gemini 3.8 Flash TTS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>الأصوات المدعومة:</span>
                  <span className="font-mono text-slate-300">العربية والإنجليزية والعالمية</span>
                </div>
              </div>
            </div>

            {/* Saved Clips Drawer / Quick List */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <SavedClipsDrawer
                clips={savedClips}
                onDeleteClip={handleDeleteClip}
                onClearAll={handleClearAllClips}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-800/80 py-6 mt-12 bg-[#090d16] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">SawtLab</span>
            <span aria-hidden="true">·</span>
            <span>استوديو توليد وتصميم الصوتيات الرقمية وقراءة النصوص</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>تصدير فوري بصيغة WAV</span>
            <span aria-hidden="true">·</span>
            <span>مدعوم بـ Google Gemini TTS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
