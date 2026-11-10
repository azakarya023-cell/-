// Sound Presets Library for Gaming, Sci-Fi, UI, Cartoon, and Bass sounds

export interface SoundRecipe {
  id: string;
  name: string;
  englishName: string;
  category: 'game' | 'scifi' | 'ui' | 'cartoon' | 'musical';
  icon: string;
  description: string;
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise';
  frequency: number;
  pitchSweep?: {
    enabled: boolean;
    targetFreq: number;
    duration: number;
  };
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  filter: {
    type: 'lowpass' | 'highpass' | 'bandpass';
    cutoff: number;
    resonance: number;
  };
  effects?: {
    distortion?: number;
    delayTime?: number;
    delayFeedback?: number;
    reverbDecay?: number;
  };
}

export const SOUND_PRESETS: SoundRecipe[] = [
  // Game & 8-bit
  {
    id: 'laser_gun',
    name: 'سلاح الليزر 8-بت',
    englishName: '8-Bit Laser',
    category: 'game',
    icon: 'Zap',
    description: 'صوت إطلاق ليزر كلاسيكي سريع مع هبوط ترددي حاد',
    waveform: 'sawtooth',
    frequency: 950,
    pitchSweep: { enabled: true, targetFreq: 80, duration: 0.16 },
    envelope: { attack: 0.005, decay: 0.12, sustain: 0.01, release: 0.05 },
    filter: { type: 'lowpass', cutoff: 5000, resonance: 4 },
  },
  {
    id: 'coin_pickup',
    name: 'التقاط العملة',
    englishName: 'Coin Collect',
    category: 'game',
    icon: 'Coins',
    description: 'نغمة مبهجة مزدوجة تشبه ألعاب ماريو والأركيد',
    waveform: 'square',
    frequency: 987, // B5
    pitchSweep: { enabled: true, targetFreq: 1318, duration: 0.08 }, // E6
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.4, release: 0.18 },
    filter: { type: 'lowpass', cutoff: 8000, resonance: 2 },
  },
  {
    id: 'retro_jump',
    name: 'قفزة بلاتفورم',
    englishName: 'Retro Jump',
    category: 'game',
    icon: 'ArrowUpCircle',
    description: 'صوت قفز كلاسيكي يتصاعد تردده بسرعة للأعلى',
    waveform: 'square',
    frequency: 160,
    pitchSweep: { enabled: true, targetFreq: 580, duration: 0.22 },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.08 },
    filter: { type: 'lowpass', cutoff: 6500, resonance: 3 },
  },
  {
    id: 'power_up',
    name: 'ترقية الطاقة',
    englishName: 'Power Up Chime',
    category: 'game',
    icon: 'Sparkles',
    description: 'صوت تصاعدي سريع يوحي بزيادة الطاقة أو المستوى',
    waveform: 'triangle',
    frequency: 330,
    pitchSweep: { enabled: true, targetFreq: 880, duration: 0.28 },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.25 },
    filter: { type: 'lowpass', cutoff: 7000, resonance: 1.5 },
  },
  {
    id: 'heavy_explosion',
    name: 'انفجار عميق',
    englishName: 'Heavy Explosion',
    category: 'game',
    icon: 'Bomb',
    description: 'ضوضاء بيضاء مفلترة بترددات منخفضة مع تشويش واقعي',
    waveform: 'noise',
    frequency: 180,
    pitchSweep: { enabled: true, targetFreq: 40, duration: 0.4 },
    envelope: { attack: 0.01, decay: 0.45, sustain: 0.2, release: 0.6 },
    filter: { type: 'lowpass', cutoff: 1200, resonance: 5 },
    effects: { distortion: 18 },
  },

  // Sci-Fi
  {
    id: 'warp_drive',
    name: 'قفزة الزمكان (Warp)',
    englishName: 'Warp Drive',
    category: 'scifi',
    icon: 'Rocket',
    description: 'نغمة محرك سفينة فضائية تتدفق عبر موجة جيبية متغيرة',
    waveform: 'sine',
    frequency: 220,
    pitchSweep: { enabled: true, targetFreq: 1400, duration: 0.4 },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.4 },
    filter: { type: 'bandpass', cutoff: 1800, resonance: 6 },
    effects: { delayTime: 0.2, delayFeedback: 0.4 },
  },
  {
    id: 'forcefield',
    name: 'درع الطاقة',
    englishName: 'Forcefield Hum',
    category: 'scifi',
    icon: 'Shield',
    description: 'طنين مغناطيسي كهرومغناطيسي عالي التردد',
    waveform: 'sawtooth',
    frequency: 440,
    pitchSweep: { enabled: true, targetFreq: 420, duration: 0.5 },
    envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 0.5 },
    filter: { type: 'bandpass', cutoff: 1400, resonance: 9 },
  },
  {
    id: 'alien_ping',
    name: 'رادار فضائي (Sonar)',
    englishName: 'Alien Sonar Ping',
    category: 'scifi',
    icon: 'Radio',
    description: 'نبضة رادار نقية مع صدى فضائي واسع',
    waveform: 'sine',
    frequency: 1200,
    pitchSweep: { enabled: true, targetFreq: 900, duration: 0.2 },
    envelope: { attack: 0.005, decay: 0.25, sustain: 0.1, release: 0.5 },
    filter: { type: 'lowpass', cutoff: 4000, resonance: 8 },
    effects: { delayTime: 0.35, delayFeedback: 0.6 },
  },

  // UI & Apps
  {
    id: 'bubble_pop',
    name: 'فقاعة ماء (Pop)',
    englishName: 'Bubble Pop',
    category: 'ui',
    icon: 'CircleDot',
    description: 'نقرة فقاعة لطيفة وناعمة لواجهات المستخدم العصرية',
    waveform: 'sine',
    frequency: 380,
    pitchSweep: { enabled: true, targetFreq: 750, duration: 0.06 },
    envelope: { attack: 0.002, decay: 0.08, sustain: 0.02, release: 0.04 },
    filter: { type: 'lowpass', cutoff: 3500, resonance: 1.2 },
  },
  {
    id: 'modern_swoosh',
    name: 'حركة سريعة (Swoosh)',
    englishName: 'Modern Swoosh',
    category: 'ui',
    icon: 'Wind',
    description: 'صوت هواء ناعم للانتقال بين القوائم وصفحات التطبيقات',
    waveform: 'noise',
    frequency: 400,
    pitchSweep: { enabled: true, targetFreq: 150, duration: 0.2 },
    envelope: { attack: 0.04, decay: 0.15, sustain: 0.1, release: 0.1 },
    filter: { type: 'bandpass', cutoff: 2200, resonance: 3 },
  },
  {
    id: 'success_ting',
    name: 'رنين النجاح والإنجاز',
    englishName: 'Success Ting',
    category: 'ui',
    icon: 'CheckCircle',
    description: 'جرس معدني نقي يرمز لإكمال المهام وحفظ التغييرات',
    waveform: 'sine',
    frequency: 1046, // C6
    pitchSweep: { enabled: true, targetFreq: 2093, duration: 0.08 }, // C7
    envelope: { attack: 0.005, decay: 0.15, sustain: 0.3, release: 0.4 },
    filter: { type: 'lowpass', cutoff: 8000, resonance: 1 },
  },
  {
    id: 'error_buzzer',
    name: 'تنبيه الخطأ (Buzz)',
    englishName: 'Error Buzzer',
    category: 'ui',
    icon: 'AlertTriangle',
    description: 'صوت تنبيه منخفض حاد لتنبيه المستخدم بالخطأ',
    waveform: 'sawtooth',
    frequency: 130,
    pitchSweep: { enabled: true, targetFreq: 110, duration: 0.18 },
    envelope: { attack: 0.01, decay: 0.18, sustain: 0.4, release: 0.1 },
    filter: { type: 'lowpass', cutoff: 1800, resonance: 4 },
  },

  // Cartoon & Comedy
  {
    id: 'cartoon_boing',
    name: 'زنبرك كرتوني (Boing)',
    englishName: 'Cartoon Boing',
    category: 'cartoon',
    icon: 'Flame',
    description: 'اهتزاز زنبركي كرتوني مرح للقفزات الكوميدية',
    waveform: 'triangle',
    frequency: 240,
    pitchSweep: { enabled: true, targetFreq: 520, duration: 0.35 },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.3 },
    filter: { type: 'bandpass', cutoff: 1200, resonance: 7 },
  },
  {
    id: 'slide_whistle',
    name: 'صافرة متزلجة',
    englishName: 'Slide Whistle',
    category: 'cartoon',
    icon: 'Music',
    description: 'صوت صافرة كوميدي يصعد أو يهبط بمرونة',
    waveform: 'sine',
    frequency: 700,
    pitchSweep: { enabled: true, targetFreq: 220, duration: 0.45 },
    envelope: { attack: 0.02, decay: 0.35, sustain: 0.5, release: 0.2 },
    filter: { type: 'lowpass', cutoff: 3500, resonance: 1 },
  },

  // Musical & Bass
  {
    id: 'sub_808_boom',
    name: 'بيز 808 عميق (Sub Bass)',
    englishName: '808 Sub Boom',
    category: 'musical',
    icon: 'Disc',
    description: 'بيز هيب هوب وتراب قوي يهز الترددات السفلية بوضوح',
    waveform: 'sine',
    frequency: 140,
    pitchSweep: { enabled: true, targetFreq: 42, duration: 0.15 },
    envelope: { attack: 0.005, decay: 0.45, sustain: 0.5, release: 0.5 },
    filter: { type: 'lowpass', cutoff: 450, resonance: 2 },
    effects: { distortion: 6 },
  },
  {
    id: 'retro_synth_lead',
    name: 'لحن سينث الثمانينات',
    englishName: '80s Synth Pluck',
    category: 'musical',
    icon: 'AudioLines',
    description: 'نغمة سينث كلاسيكية بنكهة موسيقى Synthwave والبوب',
    waveform: 'sawtooth',
    frequency: 440,
    pitchSweep: { enabled: false, targetFreq: 440, duration: 0.1 },
    envelope: { attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.35 },
    filter: { type: 'lowpass', cutoff: 2400, resonance: 5 },
    effects: { delayTime: 0.2, delayFeedback: 0.3 },
  },
];
