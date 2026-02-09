import { AppConfig, PlayMode } from './types';

// Default quotes list
const DEFAULT_QUOTES = [
  "一眼万年",
  "岁月静好",
  "春风十里不如你",
  "众里寻他千百度",
  "此刻风情万种",
  "独属于你的时刻",
  "静谧的午后",
  "心动的感觉",
  "那一低头的温柔",
  "如梦幻泡影",
  "若只如初见",
  "世间美好与你环环相扣",
  "满眼星辰皆是你",
  "风月无边",
  "流年似水",
  "惊鸿一瞥",
  "此情可待成追忆",
  "海内存知己",
  "今晚月色真美",
  "想你在每一个夜晚",
  "具体的爱，无需多言",
  "禁止焦绿",
  "保持热爱，奔赴山海"
];

export const DEFAULT_CONFIG: AppConfig = {
  interval: 5,
  playMode: PlayMode.SHUFFLE,
  showInfo: true,
  enableSound: false,
  soundVolume: 0.2,
  transitionEnabled: true,
  audioSource: 'NOISE',
  enableRandomText: false,
  customQuotes: DEFAULT_QUOTES
};

export const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/avif': ['.avif']
};