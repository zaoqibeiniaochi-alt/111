import React from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Repeat, 
  Maximize, 
  Minimize,
  FolderOpen
} from 'lucide-react';
import { PlayMode } from '../types';

interface ControlBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectFolder: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  speed: number;
  onSpeedChange: (s: number) => void;
  mode: PlayMode;
  onModeChange: () => void;
  current: number;
  total: number;
  fileName: string;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  onSelectFolder,
  onToggleFullscreen,
  isFullscreen,
  speed,
  onSpeedChange,
  mode,
  onModeChange,
  current,
  total,
  fileName
}) => {
  return (
    <div className={`
      fixed bottom-0 left-0 right-0 p-4 transition-all duration-300
      bg-gray-900/80 backdrop-blur-md border-t border-white/10
      flex flex-col md:flex-row items-center justify-between gap-4 z-50
      hover:opacity-100 ${isPlaying && isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-100'}
    `}>
      {/* Left: File Info */}
      <div className="flex flex-col items-start min-w-[200px] truncate">
        <span className="text-sm font-medium text-white truncate max-w-[200px] md:max-w-xs">
          {fileName || '无文件'}
        </span>
        <span className="text-xs text-gray-400">
          {total > 0 ? `${current + 1} / ${total}` : '0 / 0'}
        </span>
      </div>

      {/* Center: Main Controls */}
      <div className="flex items-center gap-6">
        <button 
          onClick={onPrev}
          className="p-2 text-gray-300 hover:text-white transition-colors hover:bg-white/10 rounded-full"
          title="上一张 (←)"
        >
          <SkipBack size={24} />
        </button>

        <button 
          onClick={onTogglePlay}
          className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105 active:scale-95"
          title="播放/暂停 (Space)"
        >
          {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
        </button>

        <button 
          onClick={onNext}
          className="p-2 text-gray-300 hover:text-white transition-colors hover:bg-white/10 rounded-full"
          title="下一张 (→)"
        >
          <SkipForward size={24} />
        </button>
      </div>

      {/* Right: Settings */}
      <div className="flex items-center gap-4">
        
        {/* Mode Toggle */}
        <button 
          onClick={onModeChange}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${mode === 'random' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' : 'bg-gray-800 text-gray-400 border border-transparent hover:bg-gray-700'}
          `}
          title="切换播放模式"
        >
          {mode === 'random' ? <Shuffle size={16} /> : <Repeat size={16} />}
          <span>{mode === 'random' ? '随机' : '顺序'}</span>
        </button>

        {/* Speed Input */}
        <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-white/5">
          <span className="text-xs text-gray-400">间隔(秒)</span>
          <input 
            type="number" 
            min="1" 
            max="60" 
            value={speed} 
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-12 bg-transparent text-white text-center text-sm focus:outline-none font-mono"
          />
        </div>

        <div className="h-6 w-px bg-white/10 mx-2"></div>

        {/* Folder Select */}
        <button 
          onClick={onSelectFolder}
          className="p-2 text-gray-300 hover:text-blue-400 transition-colors"
          title="选择文件夹"
        >
          <FolderOpen size={20} />
        </button>

        {/* Fullscreen */}
        <button 
          onClick={onToggleFullscreen}
          className="p-2 text-gray-300 hover:text-white transition-colors"
          title="全屏模式"
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>
    </div>
  );
};