import React, { useRef } from 'react';
import { X, Volume2, Timer, Zap, Music, Upload, MessageSquareQuote } from 'lucide-react';
import { AppConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  currentMusicName: string | null;
  onMusicUpload: (file: File) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  config, 
  setConfig,
  currentMusicName,
  onMusicUpload
}) => {
  const musicInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onMusicUpload(e.target.files[0]);
    }
  };

  const handleQuotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    // Split by newline and filter out empty lines
    const quotes = text.split('\n').filter(line => line.trim() !== '');
    setConfig(prev => ({ ...prev, customQuotes: quotes }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md max-h-[90vh] flex flex-col rounded-xl shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">设置</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Interval Setting */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-300">
              <Timer size={18} />
              <label className="text-sm font-medium">自动播放间隔 ({config.interval}秒)</label>
            </div>
            <input
              type="range"
              min="0.5"
              max="30"
              step="0.5"
              value={config.interval}
              onChange={(e) => setConfig(prev => ({ ...prev, interval: Number(e.target.value) }))}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Sound Setting */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-300">
                <Volume2 size={18} />
                <label className="text-sm font-medium">背景音效</label>
              </div>
              <input
                type="checkbox"
                checked={config.enableSound}
                onChange={(e) => setConfig(prev => ({ ...prev, enableSound: e.target.checked }))}
                className="w-5 h-5 accent-blue-500 rounded focus:ring-blue-500"
              />
            </div>
            
            {config.enableSound && (
              <div className="bg-zinc-800/50 p-4 rounded-lg space-y-4 border border-zinc-700/50">
                {/* Source Selector */}
                <div className="flex gap-2 p-1 bg-zinc-800 rounded-lg">
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, audioSource: 'NOISE' }))}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${config.audioSource === 'NOISE' ? 'bg-blue-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    白噪音
                  </button>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, audioSource: 'FILE' }))}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${config.audioSource === 'FILE' ? 'bg-blue-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    自定义音乐
                  </button>
                </div>

                {/* Controls based on Source */}
                {config.audioSource === 'NOISE' ? (
                  <div className="text-xs text-zinc-500 px-1">
                    生成舒缓的布朗噪声，有助于专注或放松。
                  </div>
                ) : (
                  <div className="space-y-2">
                     <button 
                      onClick={() => musicInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md text-sm transition text-zinc-200 border border-zinc-600 border-dashed"
                    >
                      <Upload size={14} />
                      <span className="truncate max-w-[200px]">{currentMusicName || "上传音频文件 (MP3/WAV)"}</span>
                    </button>
                    <input 
                      type="file" 
                      ref={musicInputRef} 
                      className="hidden" 
                      accept="audio/*"
                      onChange={handleMusicChange}
                    />
                  </div>
                )}

                {/* Volume */}
                <div className="space-y-1 pt-2">
                   <div className="flex justify-between text-xs text-zinc-400">
                     <span>音量</span>
                     <span>{Math.round(config.soundVolume * 100)}%</span>
                   </div>
                   <input
                    type="range"
                    min="0.01"
                    max="1"
                    step="0.01"
                    value={config.soundVolume}
                    onChange={(e) => setConfig(prev => ({ ...prev, soundVolume: Number(e.target.value) }))}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Transitions */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-zinc-300">
              <Zap size={18} />
              <label className="text-sm font-medium">平滑过渡动画</label>
            </div>
            <input
              type="checkbox"
              checked={config.transitionEnabled}
              onChange={(e) => setConfig(prev => ({ ...prev, transitionEnabled: e.target.checked }))}
              className="w-5 h-5 accent-blue-500 rounded focus:ring-blue-500"
            />
          </div>

          {/* Random Text */}
          <div className="space-y-4 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-300">
                <MessageSquareQuote size={18} />
                <label className="text-sm font-medium">氛围语录</label>
              </div>
              <input
                type="checkbox"
                checked={config.enableRandomText}
                onChange={(e) => setConfig(prev => ({ ...prev, enableRandomText: e.target.checked }))}
                className="w-5 h-5 accent-blue-500 rounded focus:ring-blue-500"
              />
            </div>
            
            {config.enableRandomText && (
              <div className="space-y-2">
                <label className="text-xs text-zinc-500">
                  自定义语录 (一行一句)
                </label>
                <textarea
                  value={config.customQuotes?.join('\n') || ''}
                  onChange={handleQuotesChange}
                  placeholder="在此输入语录..."
                  className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-900 rounded-b-xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};