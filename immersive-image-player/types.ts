export interface ImageFile {
  file: File;
  url: string;
  name: string;
}

export type PlayMode = 'sequential' | 'random';

export interface PlayerSettings {
  speed: number; // in seconds
  mode: PlayMode;
  lastIndex: number;
  lastFolderName: string;
}

export const DEFAULT_SETTINGS: PlayerSettings = {
  speed: 3,
  mode: 'sequential',
  lastIndex: 0,
  lastFolderName: '',
};