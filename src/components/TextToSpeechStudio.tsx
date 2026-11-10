import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Play,
  Square,
  Download,
  Sparkles,
  Sliders,
  Settings2,
  BookmarkPlus,
  RefreshCw,
  Mic,
  Languages,
  Check,
  AlertCircle,
  Wand2,
  Radio,
  Share2,
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface SavedClip {
  id: string;
  text: string;
  voice: string;
  model: 'gemini' | 'browser';
  date: string;
  audioBase64?: string;
  effect: string;
}

interface Props {
  onSaveClip: (clip: SavedClip) => void;
  onSoundTriggered?: () => void;
}

const SAMPLE_TEXTS = [
  {
    label: 'ترحيب استوديو',
    text: 'أهلاً بكم في مختبر الأصوات الذكي، هنا يمكنك تحويل أي نص إلى صوت واقعي وبناء مؤثراتك الصوتية بسهولة!',
    style: 'Clear, welcoming and friendly host',
  },
  {
    label: 'نشرة إخبارية',
    text: 'عاجل: أعلنت مراكز الأبحاث العلمية اليوم عن نجاح إطلاق أسرع نظام لمعالجة وتصميم الصوتيات الرقمية.',
    style: 'Professional, articulate news broadcast anchor',
  },
  {
    label: 'قصة سينمائية',
    text: 'في أعماق الليل الساكن، انفتحت بوابة الزمكان لتكشف عن أسرار حضارة كانت مفقودة منذ آلاف السنين.',
    style: 'Deep, dramatic cinematic narration with suspense',
  },
  {
    label: 'إعلان تسويقي',
    text: 'هل أنت مستعد لتجربة المستقبل؟ اكتشف الآن أفضل الأدوات الإبداعية وانطلق بمشاريعك نحو القمة!',
    style: 'Energetic, passionate and persuasive commercial',
  },
  {
    label: 'English Intro',
    text: 'Welcome to SawtLab! Create ultra-realistic speech and cinematic sound effects in seconds.',
    style: 'Confident, natural and polished studio voice',
  },
];

const GEMINI_VOICES = [
  { id: 'Kore', name: 'كوري (Kore)', desc: 'صوت أنثوي متوازن ونقي، مثالي للمقالات والشروحات', gender: 'female' },
  { id: 'Puck', name: 'باك (Puck)', desc: 'صوت شبابي ديناميكي وحيوي، رائع للإعلانات والبودكاست', gender: 'male' },
  { id: 'Charon', name: 'شارون (Charon)', desc: 'صوت عميق ورخيم، مناسب للوثائقيات والنشرات الرسمية', gender: 'male' },
  { id: 'Fenrir', name: 'فينرير (Fenrir)', desc: 'صوت دافئ وسينمائي ذو حضور قوي', gender: 'male' },
  { id: 'Zephyr', name: 'زفير (Zephyr)', desc: 'صوت هادئ وناعم للتأمل والقصص المريحة', gender: 'female' },
];

const SPEECH_STYLES = [
  { id: 'natural', name: 'طبيعي معتدل', prompt: 'Natural conversational tone' },
  { id: 'news', name: 'مذيع أخبار رسمي', prompt: 'Professional news anchor, authoritative and clear' },
  { id: 'story', name: 'راوي قصص مشوق', prompt: 'Expressive and engaging storyteller, warm and dramatic' },
  { id: 'commercial', name: 'حماسي وإعلاني', prompt: 'Energetic, enthusiastic commercial voiceover' },
  { id: 'calm', name: 'هادئ ومريح', prompt: 'Soothing, gentle, calm and relaxing pacing' },
  { id: 'whisper', name: 'همس هادئ', prompt: 'Soft whisper, intimate and gentle' },
];

const VOICE_EFFECTS = [
  { id: 'none', name: 'استوديو نقي', desc: 'صوت طبيعي بدون تعديل' },
  { id: 'echo', name: 'صدى فضائي (Echo)', desc: 'تأخير متكرر مع ترشيح خفيف' },
  { id: 'reverb', name: 'قاعة واسعة (Reverb)', desc: 'صدى غرفة واستوديو كبير' },
  { id: 'robot', name: 'صوت روبوت آلي', desc: 'تعديل حلقي بنغمة معدنية' },
  { id: 'megaphone', name: 'لاسلكي / مذياع', desc: 'فلتر تردد متوسط مع نغمة كلاسيكية' },
  { id: 'monster', name: 'صوت عميق وضخم', desc: 'خفض التردد مع تعزيز البيز' },
  { id: 'chipmunk', name: 'صوت مرح وسريع', desc: 'رفع التردد والسرعة' },
];

export const TextToSpeechStudio: React.FC<Props> = ({ onSaveClip, onSoundTriggered }) => {
  const [text, setText] = useState<string>(
    'أهلاً بكم في مختبر الأصوات، اكتب أي نص هنا وسأقوم بنطقه وتصميمه فوراً بأعلى جودة!'
  );
  const [engineMode, setEngineMode] = useState<'gemini' | 'browser'>('gemini');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [selectedStyle, setSelectedStyle] = useState<string>('natural');
  const [customStyleText, setCustomStyleText] = useState<string>('');
  const [selectedEffect, setSelectedEffect] = useState<string>('none');

  // Browser speech settings
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoiceURI, setSelectedBrowserVoiceURI] = useState<string>('');
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);

  // Playback state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [lastGeneratedAudio, setLastGeneratedAudio] = useState<{
    base64: string;
    mimeType: string;
    text: string;
    voice: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Load browser speech synthesis voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setBrowserVoices(voices);

        // Prefer Arabic voices if available
        const arabicVoice = voices.find((v) => v.lang.startsWith('ar'));
        if (arabicVoice && !selectedBrowserVoiceURI) {
          setSelectedBrowserVoiceURI(arabicVoice.voiceURI);
        } else if (voices.length > 0 && !selectedBrowserVoiceURI) {
          setSelectedBrowserVoiceURI(voices[0].voiceURI);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedBrowserVoiceURI]);

  // Handle Stop
  const handleStop = () => {
    audioEngine.stopCurrentPlayback();
    setIsPlaying(false);
  };

  // Generate and Play Speech
  const handleGenerateAndSpeak = async () => {
    if (!text.trim()) {
      setErrorMessage('الرجاء كتابة نص لتحويله إلى صوت');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    audioEngine.stopCurrentPlayback();

    // Trigger user interaction to resume audio context
    audioEngine.getContext();
    if (onSoundTriggered) onSoundTriggered();

    if (engineMode === 'gemini') {
      try {
        const styleObj = SPEECH_STYLES.find((s) => s.id === selectedStyle);
        const effectiveStyle = customStyleText.trim() || styleObj?.prompt || '';

        const res = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.trim(),
            voice: selectedVoice,
            style: effectiveStyle,
          }),
        });

        const data = await res.json();

        if (data.success && data.audioBase64) {
          setLastGeneratedAudio({
            base64: data.audioBase64,
            mimeType: data.mimeType || 'audio/wav',
            text: text.trim(),
            voice: selectedVoice,
          });

          setIsLoading(false);
          setIsPlaying(true);

          await audioEngine.playBase64Audio(
            data.audioBase64,
            data.mimeType || 'audio/wav',
            selectedEffect,
            () => setIsPlaying(false)
          );
        } else {
          // If server reported fallback needed, automatically fall back to browser voices gracefully
          if (data.useClientFallback) {
            setErrorMessage('جاري النطق باستخدام محرك المتصفح المحلي...');
            speakWithBrowserEngine();
          } else {
            setErrorMessage(data.error || 'تعذر توليد الصوت بالذكاء الاصطناعي');
          }
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('TTS request failed, falling back to browser engine:', err);
        setErrorMessage('تعذر الاتصال بالخادم، تم التحويل لمحرك المتصفح المحلي');
        setIsLoading(false);
        speakWithBrowserEngine();
      }
    } else {
      // Browser speech mode
      setIsLoading(false);
      speakWithBrowserEngine();
    }
  };

  // Browser speech synthesis fallback
  const speakWithBrowserEngine = () => {
    if (!('speechSynthesis' in window)) {
      setErrorMessage('المتصفح الحالي لا يدعم قراءة النصوص المباشرة');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());

    if (selectedBrowserVoiceURI) {
      const v = browserVoices.find((item) => item.voiceURI === selectedBrowserVoiceURI);
      if (v) utterance.voice = v;
    }

    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      setErrorMessage('حدث خطأ أثناء نطق النص عبر المتصفح');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Download WAV file
  const handleDownloadWav = () => {
    if (lastGeneratedAudio?.base64) {
      // Convert base64 to Blob
      const binaryString = atob(lastGeneratedAudio.base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const filename = `SawtLab_${selectedVoice}_${Date.now()}.wav`;
      audioEngine.downloadBlob(blob, filename);
    } else {
      // If we don't have a Gemini WAV yet, generate one now
      handleGenerateAndSpeak();
    }
  };

  // Save to library
  const handleSaveToLibrary = () => {
    if (!text.trim()) return;

    const newClip: SavedClip = {
      id: `clip_${Date.now()}`,
      text: text.trim(),
      voice: engineMode === 'gemini' ? selectedVoice : (selectedBrowserVoiceURI || 'Browser'),
      model: engineMode,
      date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      audioBase64: lastGeneratedAudio?.base64,
      effect: selectedEffect,
    };

    onSaveClip(newClip);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Engine & Mode Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-amber-400" />
            تحويل النص إلى صوت (Text-to-Speech)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            حوّل أي نص عربي أو إنجليزي إلى صوت واقعي عالي الجودة مع تحكم بالطبقات والمؤثرات
          </p>
        </div>

        {/* Engine switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setEngineMode('gemini')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              engineMode === 'gemini'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            ذكاء اصطناعي (Gemini TTS)
          </button>
          <button
            type="button"
            onClick={() => setEngineMode('browser')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              engineMode === 'browser'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Languages className="h-3.5 w-3.5" />
            أصوات المتصفح الفورية
          </button>
        </div>
      </div>

      {/* Main Text Input Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 relative focus-within:border-amber-500/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span>النص المراد نطقه</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono text-[11px] tabular-nums">
              {text.length} حرف
            </span>
          </label>

          {/* Quick Clear */}
          {text.length > 0 && (
            <button
              type="button"
              onClick={() => setText('')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              مسح النص
            </button>
          )}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب هنا النص المراد تحويله إلى صوت..."
          rows={4}
          className="w-full bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 text-base leading-relaxed resize-y font-sans"
        />

        {/* Quick Sample Text Chips */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 shrink-0 font-medium">نصوص جاهزة:</span>
          {SAMPLE_TEXTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setText(sample.text);
                setCustomStyleText(sample.style);
              }}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-md border border-slate-700/60 whitespace-nowrap transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Voice Selection Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Mic className="h-4 w-4 text-amber-400" />
              اختيار نبرة الصوت (Voice)
            </h3>
            <span className="text-[11px] text-slate-400">
              {engineMode === 'gemini' ? '5 أصوات متقدمة' : `${browserVoices.length} صوت`}
            </span>
          </div>

          {engineMode === 'gemini' ? (
            <div className="space-y-2">
              {GEMINI_VOICES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVoice(v.id)}
                  className={`w-full text-right p-2.5 rounded-lg border text-xs transition-all flex items-start justify-between gap-2 ${
                    selectedVoice === v.id
                      ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-amber-300">{v.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{v.desc}</div>
                  </div>
                  {selectedVoice === v.id && (
                    <span className="h-4 w-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">قائمة أصوات المتصفح:</label>
                <select
                  value={selectedBrowserVoiceURI}
                  onChange={(e) => setSelectedBrowserVoiceURI(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {browserVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pitch & Rate sliders */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">السرعة (Speed)</span>
                  <span className="font-mono text-amber-400 tabular-nums">{rate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-slate-400">طبقة الصوت (Pitch)</span>
                  <span className="font-mono text-amber-400 tabular-nums">{pitch.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Style & Emotion (For Gemini) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-amber-400" />
              الأسلوب والمشاعر (Speech Style)
            </h3>
            <span className="text-[11px] text-slate-500">Gemini Metadata</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {SPEECH_STYLES.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setSelectedStyle(st.id);
                  setCustomStyleText(st.prompt);
                }}
                className={`p-2 rounded-lg border text-right text-xs transition-all ${
                  selectedStyle === st.id
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-medium'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.name}
              </button>
            ))}
          </div>

          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">
              توجيه المشاعر ونبرة الصوت المخصصة:
            </label>
            <input
              type="text"
              value={customStyleText}
              onChange={(e) => setCustomStyleText(e.target.value)}
              placeholder="مثال: صوت دافئ، هادئ ومريح، أو مذيع وثائقي"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Audio Effects Processor Rack */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-400" />
              مؤثرات الصوت المباشرة (FX)
            </h3>
            <span className="text-[11px] text-slate-500">Web Audio Filters</span>
          </div>

          <div className="space-y-1.5">
            {VOICE_EFFECTS.map((fx) => (
              <button
                key={fx.id}
                type="button"
                onClick={() => setSelectedEffect(fx.id)}
                className={`w-full text-right p-2 rounded-lg border text-xs transition-all flex items-center justify-between ${
                  selectedEffect === fx.id
                    ? 'bg-amber-500/15 border-amber-500/50 text-white font-medium shadow-sm'
                    : 'bg-slate-950/30 border-slate-800/70 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-200">{fx.name}</div>
                  <div className="text-[10px] text-slate-500">{fx.desc}</div>
                </div>
                {selectedEffect === fx.id && (
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error or Notice Alert */}
      {errorMessage && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          {/* Main Speak Button */}
          <button
            type="button"
            onClick={handleGenerateAndSpeak}
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
                <span>جاري معالجة ونطق الصوت...</span>
              </>
            ) : isPlaying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>جاري تشغيل الصوت...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-slate-950" />
                <span>نطق الصوت الآن</span>
              </>
            )}
          </button>

          {/* Stop Button */}
          {isPlaying && (
            <button
              type="button"
              onClick={handleStop}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold transition-colors"
            >
              <Square className="h-3.5 w-3.5 fill-red-300" />
              <span>إيقاف</span>
            </button>
          )}
        </div>

        {/* Secondary Export & Save Actions */}
        <div className="flex items-center gap-2">
          {/* Download WAV button */}
          <button
            type="button"
            onClick={handleDownloadWav}
            disabled={!lastGeneratedAudio?.base64 && !text.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="تحميل ملف صوتي WAV عالي النقاء"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span>تحميل ملف WAV</span>
          </button>

          {/* Save to clips */}
          <button
            type="button"
            onClick={handleSaveToLibrary}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              savedSuccess
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>تم الحفظ!</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="h-3.5 w-3.5 text-slate-400" />
                <span>حفظ في السجل</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
