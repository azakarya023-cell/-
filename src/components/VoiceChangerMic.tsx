import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Download,
  Sliders,
  Volume2,
  RefreshCw,
  Radio,
  Sparkles,
  AlertCircle,
  CircleDot,
  Check,
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface Props {
  onSoundTriggered?: () => void;
}

export const VoiceChangerMic: React.FC<Props> = ({ onSoundTriggered }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedEffect, setSelectedEffect] = useState<string>('robot');
  const [liveMonitor, setLiveMonitor] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Start recording
  const handleStartRecording = async () => {
    setPermissionError(null);
    try {
      audioEngine.getContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        setRecordedUrl(URL.createObjectURL(audioBlob));

        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      if (onSoundTriggered) onSoundTriggered();
    } catch (err: any) {
      console.error('Mic access error:', err);
      setPermissionError('يرجى السماح بالوصول إلى الميكروفون لتسجيل وتغيير الصوت.');
    }
  };

  // Play recorded audio with effects
  const handlePlayWithEffect = async () => {
    if (!recordedBlob) return;
    setIsPlaying(true);
    audioEngine.getContext();

    try {
      const arrayBuffer = await recordedBlob.arrayBuffer();
      const ctx = audioEngine.getContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      audioEngine.playBufferWithEffects(audioBuffer, selectedEffect, () => {
        setIsPlaying(false);
      });
    } catch (e) {
      console.error('Error decoding audio:', e);
      setIsPlaying(false);
    }
  };

  // Download recorded voice as WAV
  const handleDownload = async () => {
    if (!recordedBlob) return;
    try {
      const arrayBuffer = await recordedBlob.arrayBuffer();
      const ctx = audioEngine.getContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const wavBlob = audioEngine.audioBufferToWavBlob(audioBuffer);
      audioEngine.downloadBlob(wavBlob, `SawtLab_Voice_${selectedEffect}_${Date.now()}.wav`);
    } catch (e) {
      console.error('Failed to export voice:', e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-800">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Mic className="h-5 w-5 text-amber-400" />
          مسجل ومغير الأصوات بالميكروفون (Voice Changer)
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          سجل صوتك من الميكروفون وحوله إلى روبوت، وحش عميق، صدى فضائي، أو صوت سريع ومرح مع التصدير
        </p>
      </div>

      {permissionError && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Recording Control Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
        <div className="relative">
          <button
            type="button"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-xl ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-500/30'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {isRecording ? (
              <Square className="h-8 w-8 fill-current" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </button>
        </div>

        <div>
          <span className="font-bold text-sm text-white block">
            {isRecording ? 'جاري التسجيل... انقر للإيقاف' : 'انقر على الميكروفون لبدء التسجيل'}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            تحدث بحرية لعدة ثوانٍ ثم جرب تأثيرات الصوت المختلفة
          </span>
        </div>

        {/* Playback & Effects Controls for recorded audio */}
        {recordedBlob && (
          <div className="w-full pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePlayWithEffect}
              disabled={isPlaying}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-2 transition-colors shadow-md disabled:opacity-50"
            >
              {isPlaying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>جاري التشغيل بالتأثير...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-slate-950" />
                  <span>تشغيل الصوت بالمؤثر</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Download className="h-4 w-4 text-amber-400" />
              <span>تحميل التسجيل كـ WAV</span>
            </button>
          </div>
        )}
      </div>

      {/* Effect Selector Grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
          <Sliders className="h-4 w-4 text-amber-400" />
          اختر تأثير الصوت المطلوب تطبيقه:
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {[
            { id: 'robot', name: 'روبوت آلي', desc: 'Ring Modulator' },
            { id: 'monster', name: 'وحش عميق', desc: 'Deep Pitch' },
            { id: 'chipmunk', name: 'سنجاب مرح', desc: 'High Pitch' },
            { id: 'echo', name: 'صدى فضائي', desc: 'Stereo Delay' },
            { id: 'reverb', name: 'قاعة كبرى', desc: 'Cathedral' },
            { id: 'megaphone', name: 'لاسلكي', desc: 'Bandpass' },
          ].map((fx) => (
            <button
              key={fx.id}
              type="button"
              onClick={() => setSelectedEffect(fx.id)}
              className={`p-3 rounded-xl border text-center transition-all ${
                selectedEffect === fx.id
                  ? 'bg-amber-500/20 border-amber-500 text-white shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="font-bold text-xs text-amber-300">{fx.name}</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">{fx.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
