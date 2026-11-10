import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Check status endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Single-speaker TTS endpoint using gemini-3.8-flash-lite-tts
app.post('/api/tts/generate', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore', style } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'النص مطلوب للتحويل إلى صوت (Text is required)' });
    }

    if (!ai) {
      return res.status(503).json({
        success: false,
        error: 'مفتاح Gemini API غير مهيأ، سيتم استخدام محرك النطق الداخلي للمتصفح.',
        useClientFallback: true,
      });
    }

    // Supported prebuilt voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    const allowedVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
    const selectedVoice = allowedVoices.includes(voice) ? voice : 'Kore';

    const partObj: { text: string; speechMetadata?: { style?: string } } = {
      text: text.trim(),
    };

    if (style && typeof style === 'string' && style.trim().length > 0) {
      partObj.speechMetadata = {
        style: style.trim(),
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [partObj],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(502).json({
        success: false,
        error: 'لم يتم استلام بيانات صوتية من النموذج',
        useClientFallback: true,
      });
    }

    return res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voice: selectedVoice,
      text: text.trim(),
    });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'حدث خطأ أثناء توليد الصوت',
      useClientFallback: true,
    });
  }
});

// Dual-speaker dialogue TTS endpoint using gemini-3.8-flash-tts
app.post('/api/tts/dialogue', async (req: Request, res: Response) => {
  try {
    const { speaker1, speaker2, lines } = req.body;

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ success: false, error: 'قائمة الحوار مطلوبة (Lines are required)' });
    }

    if (!ai) {
      return res.status(503).json({
        success: false,
        error: 'مفتاح Gemini API غير مهيأ للحوار الثنائي',
        useClientFallback: true,
      });
    }

    const s1Name = speaker1?.name || 'Speaker 1';
    const s1Voice = speaker1?.voice || 'Puck';
    const s2Name = speaker2?.name || 'Speaker 2';
    const s2Voice = speaker2?.voice || 'Kore';

    const parts = lines.map((line: { speaker: string; text: string; style?: string }) => ({
      text: `${line.speaker}: ${line.text}`,
      speechMetadata: {
        speaker: line.speaker,
        style: line.style || 'Natural, conversational tone',
      },
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: s1Name,
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: s1Voice },
                },
              },
              {
                speaker: s2Name,
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: s2Voice },
                },
              },
            ],
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(502).json({
        success: false,
        error: 'تعذر توليد الحوار الصوتي من النموذج',
        useClientFallback: true,
      });
    }

    return res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('Error in dialogue TTS:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'حدث خطأ أثناء توليد الحوار الصوتي',
      useClientFallback: true,
    });
  }
});

// AI Sound Recipe Designer (Generate custom synth sound parameters from natural language)
app.post('/api/ai/sound-recipe', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'الرجاء كتابة وصف الصوت المطلوب' });
  }

  // Algorithmic fallback recipe in case of API spike or offline
  const fallbackRecipe = generateFallbackRecipe(String(prompt));

  if (!ai) {
    return res.json({ success: true, recipe: fallbackRecipe, isFallback: true });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an expert audio synthesizer sound designer.
Design sound parameters for this prompt: "${prompt}".
Return pure valid JSON matching this schema:
{
  "name": "اسم الصوت بالعربية",
  "englishName": "English name",
  "category": "game",
  "description": "شرح لطيف لطريقة تصميم الصوت بالعربية",
  "waveform": "sine" | "square" | "sawtooth" | "triangle" | "noise",
  "frequency": number between 40 and 1500,
  "pitchSweep": {
    "enabled": boolean,
    "targetFreq": number between 20 and 2000,
    "duration": number between 0.05 and 1.0
  },
  "envelope": {
    "attack": number between 0.005 and 0.3,
    "decay": number between 0.05 and 1.0,
    "sustain": number between 0.0 and 0.8,
    "release": number between 0.05 and 1.0
  },
  "filter": {
    "type": "lowpass" | "highpass" | "bandpass",
    "cutoff": number between 300 and 8000,
    "resonance": number between 1 and 10
  },
  "effects": {
    "distortion": number between 0 and 30
  }
}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);
    return res.json({ success: true, recipe: parsed });
  } catch (error: any) {
    console.warn('AI recipe generation error, using algorithmic fallback:', error?.message);
    return res.json({ success: true, recipe: fallbackRecipe, isFallback: true });
  }
});

function generateFallbackRecipe(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes('ليزر') || lower.includes('laser')) {
    return {
      name: 'سلاح ليزر فضائي',
      englishName: 'Laser Blaster',
      category: 'game',
      description: 'صوت ليزر حاد مع هبوط ترددي سريع',
      waveform: 'sawtooth',
      frequency: 1100,
      pitchSweep: { enabled: true, targetFreq: 90, duration: 0.15 },
      envelope: { attack: 0.005, decay: 0.12, sustain: 0.1, release: 0.05 },
      filter: { type: 'lowpass', cutoff: 5500, resonance: 5 },
      effects: { distortion: 5 },
    };
  }
  if (lower.includes('انفجار') || lower.includes('explosion') || lower.includes('boom')) {
    return {
      name: 'انفجار نيزكي عميق',
      englishName: 'Deep Explosion',
      category: 'game',
      description: 'ضوضاء بيضاء مع ترددات منخفضة وتشتت واقعي',
      waveform: 'noise',
      frequency: 160,
      pitchSweep: { enabled: true, targetFreq: 35, duration: 0.5 },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.6 },
      filter: { type: 'lowpass', cutoff: 1100, resonance: 4 },
      effects: { distortion: 15 },
    };
  }
  if (lower.includes('عملة') || lower.includes('coin') || lower.includes('ذهب')) {
    return {
      name: 'عملة ذهبية رنانة',
      englishName: 'Golden Coin',
      category: 'game',
      description: 'نغمة تصاعدية مبهجة مستوحاة من ألعاب الأركيد',
      waveform: 'square',
      frequency: 987,
      pitchSweep: { enabled: true, targetFreq: 1318, duration: 0.08 },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.2 },
      filter: { type: 'lowpass', cutoff: 7500, resonance: 2 },
    };
  }
  return {
    name: prompt.slice(0, 20),
    englishName: 'Custom Designed Sound',
    category: 'sfx',
    description: 'تم تصميم مواصفات الصوت خصيصاً لتناسب طلبك',
    waveform: 'sine',
    frequency: 520,
    pitchSweep: { enabled: true, targetFreq: 260, duration: 0.25 },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.25, release: 0.3 },
    filter: { type: 'lowpass', cutoff: 4000, resonance: 3 },
  };
}

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
