import React from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, ArrowRight, 
  Dices, EyeOff, Trash2 
} from 'lucide-react';
import { PlayMode } from '../types';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClear: () => void;
  mode: PlayMode;
  setMode: (mode: PlayMode) => void;
  total: number;
  current: number;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  onClear,
  mode,
  setMode,
  total,
  current
}) => {

  const getModeIcon = () => {
    switch (mode) {
      case PlayMode.SEQUENTIAL: return <Repeat size={18} />;
      case PlayMode.RANDOM: return <Dices size={18} />;
      case PlayMode.SHUFFLE: return <Shuffle size={18} />;
      case PlayMode.FAVORITES: return <HeartIconMini />;
      case PlayMode.BLIND_BOX: return <EyeOff size={18} />;
      default: return <Repeat size={18} />;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case PlayMode.SEQUENTIAL: return '顺序播放';
      case PlayMode.RANDOM: return '纯随机';
      case PlayMode.SHUFFLE: return '不重复随机';
      case PlayMode.FAVORITES: return '仅收藏';
      case PlayMode.BLIND_BOX: return '盲盒模式';
      default: return '';
    }
  };

  const cycleMode = () => {
    const modes = Object.values(PlayMode);
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
  };

  return (
    <div className="h-20 bg-zinc-900 border-t border-zinc-800 flex items-center px-6 justify-between shrink-0 select-none">
      
      {/* Left: Mode Switcher & Stats */}
      <div className="flex items-center gap-4 w-1/3">
        <button 
          onClick={cycleMode}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition text-sm"
          title="切换播放模式"
        >
          {getModeIcon()}
          <span className="hidden sm:inline">{getModeLabel()}</span>
        </button>
        <span className="text-zinc-500 text-sm font-mono hidden md:inline-block">
          {total > 0 ? `${current + 1} / ${total}` : '0 / 0'}
        </span>
      </div>

      {/* Center: Playback Controls */}
      <div className="flex items-center justify-center gap-4 w-1/3">
        <button 
          onClick={onPrev}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition"
          title="上一张 (左箭头)"
        >
          <SkipBack size={24} />
        </button>
        
        <button 
          onClick={onPlayPause}
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-all shadow-lg ${isPlaying ? 'bg-amber-500 hover:bg-amber-600 text-black' : 'bg-white hover:bg-zinc-200 text-black'}`}
          title="播放/暂停 (空格)"
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>

        <button 
          onClick={onNext}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition"
          title="下一张 (右箭头)"
        >
          <SkipForward size={24} />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-2 w-1/3">
         <button 
          onClick={onClear}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-full transition"
          title="清空列表"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};

const HeartIconMini = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);