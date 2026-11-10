import React, { useState } from 'react';
import {
  MessageSquare,
  Play,
  Square,
  Plus,
  Trash2,
  Download,
  Sparkles,
  RefreshCw,
  Users,
  AlertCircle,
  BookmarkPlus,
  Check,
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface DialogueLine {
  id: string;
  speaker: string;
  text: string;
  style: string;
}

interface Props {
  onSaveClip?: (clip: any) => void;
}

const PRESET_SCRIPTS = [
  {
    title: 'محادثة بودكاست ذكاء اصطناعي',
    speaker1: { name: 'طارق', voice: 'Puck' },
    speaker2: { name: 'ليلى', voice: 'Kore' },
    lines: [
      { id: '1', speaker: 'طارق', text: 'أهلاً ليلى! هل اطلعتِ على التحديث الجديد لنماذج توليد الصوت؟', style: 'Enthusiastic podcast host' },
      { id: '2', speaker: 'ليلى', text: 'نعم بكل تأكيد! النقاء ونبرة المشاعر أصبحت واقعية بشكل مذهل.', style: 'Curious and expressive co-host' },
      { id: '3', speaker: 'طارق', text: 'والأجمل أنه يمكن للمستخدمين كتابة أي نص وسماعه فوراً مع الحفظ بصيغة WAV!', style: 'Excited and clear' },
    ],
  },
  {
    title: 'خدمة العملاء الذكية',
    speaker1: { name: 'العميل', voice: 'Fenrir' },
    speaker2: { name: 'المساعد', voice: 'Kore' },
    lines: [
      { id: '1', speaker: 'العميل', text: 'مرحباً، أود الاستفسار عن كيفية تفعيل المؤثرات الصوتية في تطبيقي.', style: 'Polite inquiry' },
      { id: '2', speaker: 'المساعد', text: 'أهلاً بك! يمكنك تفعيل مؤثرات الروبوت والصدى بنقرة واحدة من لوحة التحكم.', style: 'Professional and helpful customer support' },
    ],
  },
];

export const DialogueStudio: React.FC<Props> = ({ onSaveClip }) => {
  const [speaker1, setSpeaker1] = useState({ name: 'أحمد', voice: 'Puck' });
  const [speaker2, setSpeaker2] = useState({ name: 'سارة', voice: 'Kore' });

  const [lines, setLines] = useState<DialogueLine[]>([
    { id: '1', speaker: 'أحمد', text: 'مرحباً سارة، كيف تسير تجربة استوديو الأصوات معك اليوم؟', style: 'Friendly greeting' },
    { id: '2', speaker: 'سارة', text: 'أهلاً أحمد! الصوت نقي جداً وممتع للغاية في توليد النصوص.', style: 'Warm and cheerful response' },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const addLine = (speakerName: string) => {
    setLines([
      ...lines,
      {
        id: `line_${Date.now()}`,
        speaker: speakerName,
        text: '',
        style: 'Natural conversational tone',
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  const updateLineText = (id: string, text: string) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, text } : l)));
  };

  const updateLineSpeaker = (id: string, speaker: string) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, speaker } : l)));
  };

  const loadPreset = (preset: typeof PRESET_SCRIPTS[0]) => {
    setSpeaker1(preset.speaker1);
    setSpeaker2(preset.speaker2);
    setLines(preset.lines);
    setGeneratedAudioBase64(null);
  };

  const handleGenerateDialogue = async () => {
    const validLines = lines.filter((l) => l.text.trim().length > 0);
    if (validLines.length === 0) {
      setErrorMessage('الرجاء كتابة سطور الحوار أولاً');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    audioEngine.stopCurrentPlayback();

    try {
      const res = await fetch('/api/tts/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker1,
          speaker2,
          lines: validLines,
        }),
      });

      const data = await res.json();
      if (data.success && data.audioBase64) {
        setGeneratedAudioBase64(data.audioBase64);
        setIsLoading(false);
        setIsPlaying(true);
        await audioEngine.playBase64Audio(data.audioBase64, 'audio/wav', 'none', () => {
          setIsPlaying(false);
        });
      } else {
        setErrorMessage(data.error || 'تعذر توليد الحوار الصوتي');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Error generating dialogue:', err);
      setErrorMessage('فشل الاتصال بخدمة الحوار الصوتي');
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedAudioBase64) return;
    const binary = atob(generatedAudioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/wav' });
    audioEngine.downloadBlob(blob, `SawtLab_Dialogue_${Date.now()}.wav`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-400" />
            استوديو الحوار الثنائي (Multi-Speaker Dialogue)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            قم بإنشاء محادثات وبودكاست بين شخصيتين بصوتين مختلفين عبر الذكاء الاصطناعي (Gemini 3.8 TTS)
          </p>
        </div>

        {/* Preset Scripts */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-medium whitespace-nowrap">سيناريوهات جاهزة:</span>
          {PRESET_SCRIPTS.map((ps, i) => (
            <button
              key={i}
              type="button"
              onClick={() => loadPreset(ps)}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-slate-300 hover:text-white transition-colors whitespace-nowrap"
            >
              {ps.title}
            </button>
          ))}
        </div>
      </div>

      {/* Speaker Configuration Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Speaker 1 */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-400">الشخصية الأولى (Speaker 1)</span>
            <span className="text-[11px] text-slate-500 font-mono">ID: S1</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">اسم المتحدث:</label>
              <input
                type="text"
                value={speaker1.name}
                onChange={(e) => setSpeaker1({ ...speaker1, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">نبرة الصوت:</label>
              <select
                value={speaker1.voice}
                onChange={(e) => setSpeaker1({ ...speaker1, voice: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              >
                <option value="Puck">باك (Puck) - شبابي وحيوي</option>
                <option value="Charon">شارون (Charon) - عميق ورسمي</option>
                <option value="Fenrir">فينرير (Fenrir) - دافئ وسينمائي</option>
                <option value="Kore">كوري (Kore) - أنثوي نقي</option>
                <option value="Zephyr">زفير (Zephyr) - هادئ وناعم</option>
              </select>
            </div>
          </div>
        </div>

        {/* Speaker 2 */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-sky-400">الشخصية الثانية (Speaker 2)</span>
            <span className="text-[11px] text-slate-500 font-mono">ID: S2</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">اسم المتحدث:</label>
              <input
                type="text"
                value={speaker2.name}
                onChange={(e) => setSpeaker2({ ...speaker2, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">نبرة الصوت:</label>
              <select
                value={speaker2.voice}
                onChange={(e) => setSpeaker2({ ...speaker2, voice: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              >
                <option value="Kore">كوري (Kore) - أنثوي نقي</option>
                <option value="Zephyr">زفير (Zephyr) - هادئ وناعم</option>
                <option value="Puck">باك (Puck) - شبابي وحيوي</option>
                <option value="Charon">شارون (Charon) - عميق ورسمي</option>
                <option value="Fenrir">فينرير (Fenrir) - دافئ وسينمائي</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Script Lines */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300">نص الحوار والسيناريو:</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addLine(speaker1.name)}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-xs font-medium transition-colors"
            >
              <Plus className="h-3 w-3" />
              سطر لـ {speaker1.name}
            </button>
            <button
              type="button"
              onClick={() => addLine(speaker2.name)}
              className="flex items-center gap-1 px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-md text-xs font-medium transition-colors"
            >
              <Plus className="h-3 w-3" />
              سطر لـ {speaker2.name}
            </button>
          </div>
        </div>

        {lines.map((line, index) => {
          const isS1 = line.speaker === speaker1.name;
          return (
            <div
              key={line.id}
              className={`p-3 rounded-xl border transition-all ${
                isS1
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-sky-950/20 border-sky-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <select
                    value={line.speaker}
                    onChange={(e) => updateLineSpeaker(line.id, e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-semibold text-white focus:outline-none"
                  >
                    <option value={speaker1.name}>{speaker1.name}</option>
                    <option value={speaker2.name}>{speaker2.name}</option>
                  </select>
                  <span className="text-[11px] text-slate-500 font-mono">#{index + 1}</span>
                </div>

                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    title="حذف هذا السطر"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <input
                type="text"
                value={line.text}
                onChange={(e) => updateLineText(line.id, e.target.value)}
                placeholder={`اكتب ما سيقوله ${line.speaker}...`}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
              />
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateDialogue}
            disabled={isLoading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap shadow-md ${
              isLoading
                ? 'bg-amber-600/50 text-slate-300 cursor-wait'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>جاري إنتاج المشهد الصوتي...</span>
              </>
            ) : isPlaying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>تشغيل الحوار...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-slate-950" />
                <span>إنتاج وتشغيل الحوار الكامل</span>
              </>
            )}
          </button>

          {isPlaying && (
            <button
              type="button"
              onClick={() => {
                audioEngine.stopCurrentPlayback();
                setIsPlaying(false);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold"
            >
              <Square className="h-3.5 w-3.5 fill-red-300" />
              <span>إيقاف</span>
            </button>
          )}
        </div>

        {generatedAudioBase64 && (
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span>تحميل الحوار كـ WAV</span>
          </button>
        )}
      </div>
    </div>
  );
};
