export interface ImageItem {
  id: string;
  file: File;
  url: string;
  name: string;
  type: string;
  analysis?: {
    description: string;
    tags: string[];
  };
}

export enum PlayMode {
  SEQUENTIAL = 'SEQUENTIAL',
  RANDOM = 'RANDOM',     // Pure random
  FORCE_RANDOM = 'FORCE_RANDOM', // Random but try not to repeat current
  SHUFFLE = 'SHUFFLE',   // No-repeat random (deck of cards style)
  FAVORITES = 'FAVORITES',
  BLIND_BOX = 'BLIND_BOX' // Click to reveal
}

export interface AppConfig {
  interval: number; // in seconds
  playMode: PlayMode;
  showInfo: boolean;
  enableSound: boolean;
  soundVolume: number; // 0 to 1
  transitionEnabled: boolean;
  audioSource: 'NOISE' | 'FILE';
  enableRandomText: boolean;
  customQuotes: string[];
}

export interface AppState {
  images: ImageItem[];
  favorites: Set<string>;
  currentIndex: number;
  isPlaying: boolean;
  shuffledQueue: number[]; // For SHUFFLE mode
  history: number[];
  isFullScreen: boolean;
  musicUrl: string | null;
  musicName: string | null;
}