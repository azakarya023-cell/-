import React from 'react';
import {
  Bookmark,
  Play,
  Square,
  Download,
  Trash2,
  Copy,
  Check,
  Volume2,
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

export interface SavedClip {
  id: string;
  text: string;
  voice: string;
  model: 'gemini' | 'browser';
  date: string;
  audioBase64?: string;
  effect: string;
}

interface Props {
  clips: SavedClip[];
  onDeleteClip: (id: string) => void;
  onClearAll: () => void;
}

export const SavedClipsDrawer: React.FC<Props> = ({ clips, onDeleteClip, onClearAll }) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handlePlayClip = (clip: SavedClip) => {
    if (clip.audioBase64) {
      audioEngine.playBase64Audio(clip.audioBase64, 'audio/wav', clip.effect);
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clip.text);
      window.speechSynthesis.speak(u);
    }
  };

  const handleDownload = (clip: SavedClip) => {
    if (clip.audioBase64) {
      const binaryString = atob(clip.audioBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/wav' });
      audioEngine.downloadBlob(blob, `SawtLab_${clip.voice}_${clip.id}.wav`);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (clips.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
        <Bookmark className="h-8 w-8 mx-auto mb-2 text-slate-600" />
        <p className="text-xs">لم يتم حفظ أي أصوات في السجل بعد.</p>
        <p className="text-[11px] text-slate-600 mt-1">
          انقر على "حفظ في السجل" بعد توليد أي مقطع صوتي للاحتفاظ به هنا.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white">المقاطع المحفوظة ({clips.length})</h3>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="text-[11px] text-slate-500 hover:text-red-400 transition-colors"
        >
          مسح السجل
        </button>
      </div>

      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {clips.map((clip) => (
          <div
            key={clip.id}
            className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors text-right flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-amber-300">{clip.voice}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">{clip.date}</span>
                {clip.effect !== 'none' && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-amber-400 font-mono text-[10px]">{clip.effect}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCopyText(clip.id, clip.text)}
                  className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                  title="نسخ النص"
                >
                  {copiedId === clip.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteClip(clip.id)}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  title="حذف من السجل"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed font-sans mb-3">
              "{clip.text}"
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => handlePlayClip(clip)}
                className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-xs font-semibold transition-colors"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>استماع</span>
              </button>

              {clip.audioBase64 && (
                <button
                  type="button"
                  onClick={() => handleDownload(clip)}
                  className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  <span>WAV</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
