import React, { useState, useEffect } from 'react';
import { ImageItem, PlayMode } from '../types';
import { Heart, Maximize2, Sparkles, Loader2 } from 'lucide-react';

interface StageProps {
  currentImage: ImageItem | null;
  isTransitionEnabled: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  showInfo: boolean;
  mode: PlayMode;
  onBlindBoxReveal: () => void;
  showRandomText: boolean;
  customQuotes?: string[];
  onAnalyze: () => Promise<void>;
}

export const Stage: React.FC<StageProps> = ({
  currentImage,
  isTransitionEnabled,
  isFavorite,
  onToggleFavorite,
  showInfo,
  mode,
  onBlindBoxReveal,
  showRandomText,
  customQuotes,
  onAnalyze
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [currentQuote, setCurrentQuote] = useState('');
  const [textStyle, setTextStyle] = useState<React.CSSProperties>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Reset blind box state and pick new quote on image change
  useEffect(() => {
    if (mode === PlayMode.BLIND_BOX) {
      setIsRevealed(false);
    } else {
      setIsRevealed(true);
    }

    // Reset analysis loading state
    setIsAnalyzing(false);

    // Pick a random quote
    if (customQuotes && customQuotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * customQuotes.length);
      setCurrentQuote(customQuotes[randomIndex]);
    } else {
      setCurrentQuote('');
    }

    // Define Layout Variants
    const variants = [
      // 1. Vertical Right (Classic Poetry Style)
      {
        writingMode: 'vertical-rl' as const,
        textOrientation: 'upright' as const,
        top: `${15 + Math.random() * 30}%`, // Random vertical position 15-45%
        right: '10%',
        left: 'auto',
        bottom: 'auto',
        transform: 'none',
        textAlign: 'left' as const,
      },
      // 2. Vertical Left (Alternative Vertical)
      {
        writingMode: 'vertical-rl' as const,
        textOrientation: 'upright' as const,
        top: `${15 + Math.random() * 30}%`,
        left: '10%',
        right: 'auto',
        bottom: 'auto',
        transform: 'none',
        textAlign: 'left' as const,
      },
      // 3. Horizontal Bottom (Subtitle Style)
      {
        writingMode: 'horizontal-tb' as const,
        textOrientation: 'mixed' as const,
        bottom: '12%',
        left: '50%',
        transform: 'translateX(-50%)',
        top: 'auto',
        right: 'auto',
        textAlign: 'center' as const,
        width: '80%', // Ensure centering works well
      }
    ];

    // Pick a random variant (Weighted slightly towards vertical styles for aesthetics)
    const randomVariantIndex = Math.random() < 0.7 
      ? (Math.random() > 0.5 ? 0 : 1) // 70% chance for vertical (Left or Right)
      : 2; // 30% chance for horizontal

    setTextStyle(variants[randomVariantIndex]);

  }, [currentImage?.id, mode, customQuotes]);

  const handleReveal = () => {
    if (mode === PlayMode.BLIND_BOX && !isRevealed) {
      setIsRevealed(true);
      onBlindBoxReveal();
    }
  };

  const handleAnalyzeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      await onAnalyze();
    } catch (error) {
      // Error handled in parent mostly, but we reset loading here
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!currentImage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 select-none">
        <div className="w-20 h-20 mb-4 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center">
          <Maximize2 className="opacity-50" />
        </div>
        <p className="text-lg">暂无图片</p>
        <p className="text-sm opacity-60">拖拽文件夹或点击导入开始</p>
      </div>
    );
  }

  return (
    <div 
      className="relative flex-1 w-full h-full overflow-hidden bg-black group"
      onClick={handleReveal}
    >
      {/* Blurred Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-50 blur-3xl scale-110 transition-all duration-700 ease-in-out"
        style={{ backgroundImage: `url(${currentImage.url})` }}
      />

      {/* Main Image Container */}
      <div className={`relative w-full h-full flex items-center justify-center p-4 transition-opacity duration-500 ${isTransitionEnabled ? 'opacity-100' : 'opacity-100'}`}>
        {/* Blind Box Overlay */}
        {mode === PlayMode.BLIND_BOX && !isRevealed && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-900 cursor-pointer">
            <div className="text-center animate-pulse">
              <span className="text-4xl">?</span>
              <p className="text-zinc-400 mt-2">点击揭晓</p>
            </div>
          </div>
        )}

        <img
          src={currentImage.url}
          alt={currentImage.name}
          className={`max-w-full max-h-full object-contain shadow-2xl transition-all duration-500 
            ${mode === PlayMode.BLIND_BOX && !isRevealed ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
          `}
        />
        
        {/* Random Text Overlay */}
        {showRandomText && currentQuote && (mode !== PlayMode.BLIND_BOX || isRevealed) && (
          <div 
            className="absolute z-10 pointer-events-none mix-blend-overlay opacity-90 transition-all duration-700"
            style={textStyle}
          >
             <p className="text-3xl md:text-4xl font-serif font-bold text-white tracking-widest drop-shadow-lg select-none whitespace-pre-wrap">
               {currentQuote}
             </p>
          </div>
        )}
      </div>

      {/* Info Overlay - Shows on Hover */}
      <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none`}>
        <div className="flex justify-between items-start pointer-events-auto">
          {showInfo && (
            <div className="text-white text-shadow max-w-[80%]">
              <h3 className="font-semibold text-lg truncate">{currentImage.name}</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-300 mt-1">
                <span className="uppercase bg-zinc-800 px-1.5 py-0.5 rounded">{currentImage.type.split('/')[1]}</span>
                <span>{(currentImage.file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>

              {/* AI Analysis Result */}
              {currentImage.analysis && (
                <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2">
                   <p className="text-sm text-zinc-200 leading-relaxed opacity-90">{currentImage.analysis.description}</p>
                   <div className="flex flex-wrap gap-1.5">
                     {currentImage.analysis.tags.map((tag, idx) => (
                       <span key={idx} className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-200 text-xs rounded-full">
                         #{tag}
                       </span>
                     ))}
                   </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`p-2 rounded-full backdrop-blur-md transition-all ${isFavorite ? 'bg-red-500/20 text-red-500 hover:bg-red-500/40' : 'bg-black/30 text-white hover:bg-white/20'}`}
              title="收藏"
            >
              <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
            </button>

            {/* AI Analyze Button - Only show if not analyzed yet */}
            {!currentImage.analysis && (
              <button 
                onClick={handleAnalyzeClick}
                disabled={isAnalyzing}
                className={`p-2 rounded-full backdrop-blur-md transition-all bg-black/30 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200`}
                title="AI 识图"
              >
                {isAnalyzing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Sparkles size={20} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};