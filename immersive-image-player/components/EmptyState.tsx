import React from 'react';
import { FolderOpen, Image as ImageIcon, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  onSelectFolder: () => void;
  lastFolderName?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectFolder, lastFolderName }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-850 to-black text-white p-6 animate-fade-in">
      <div className="w-24 h-24 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/20 ring-1 ring-blue-500/30">
        <ImageIcon size={48} className="text-blue-400" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
        沉浸式播放器
      </h1>
      
      <p className="text-gray-400 mb-12 text-center max-w-md text-lg">
        从本地文件夹加载图片，享受无缝的随机播放体验。
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button 
          onClick={onSelectFolder}
          className="group relative flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-white/20 active:scale-95"
        >
          <FolderOpen size={24} className="group-hover:scale-110 transition-transform" />
          选择图片文件夹
        </button>

        {lastFolderName && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-white/5 backdrop-blur-sm text-center">
            <p className="text-sm text-gray-400 mb-3">上次播放: <span className="text-white font-medium">{lastFolderName}</span></p>
            <div className="flex items-center gap-2 justify-center text-xs text-gray-500 bg-gray-900/50 p-2 rounded-lg">
              <RotateCcw size={14} />
              <span>重新选择该文件夹以继续播放进度</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};