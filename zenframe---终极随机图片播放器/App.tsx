import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Settings, Maximize, Minimize, Image as ImageIcon } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { Stage } from './components/Stage';
import { Controls } from './components/Controls';
import { SettingsModal } from './components/SettingsModal';
import { audioService } from './services/audioService';
import { AppConfig, AppState, ImageItem, PlayMode } from './types';
import { DEFAULT_CONFIG, ACCEPTED_IMAGE_TYPES } from './constants';

const App: React.FC = () => {
  // --- State ---
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('zenframe_config');
    // Ensure new fields are merged in if local storage has old config
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  });
  
  const [state, setState] = useState<AppState>({
    images: [],
    favorites: new Set(),
    currentIndex: -1,
    isPlaying: false,
    shuffledQueue: [],
    history: [],
    isFullScreen: false,
    musicUrl: null,
    musicName: null
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Effects ---

  // Persist Config
  useEffect(() => {
    localStorage.setItem('zenframe_config', JSON.stringify(config));
  }, [config]);

  // Audio Handler (Brown Noise & Custom Music)
  useEffect(() => {
    // Sync Volume
    if (audioRef.current) {
      audioRef.current.volume = config.soundVolume;
    }
    audioService.setVolume(config.soundVolume);

    // Determine if we should play
    // Condition: Enable Sound ON, Images Loaded, Is Playing (or force play if designed that way, but spec says sync)
    // Requirement: "图片播放与音乐同步启停" (Sync music start/stop with image playback)
    const shouldPlay = config.enableSound && state.images.length > 0 && state.isPlaying;

    if (config.audioSource === 'NOISE') {
      // 1. Play Noise
      audioService.toggle(shouldPlay, config.soundVolume);
      // Ensure file music is paused
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    } else {
      // 2. Play File
      audioService.toggle(false, 0); // Stop noise
      
      if (audioRef.current) {
        if (shouldPlay && state.musicUrl) {
           // Only call play if paused to avoid promise errors or interruptions
           if (audioRef.current.paused) {
             audioRef.current.play().catch(e => console.warn("Audio autoplay blocked", e));
           }
        } else {
           if (!audioRef.current.paused) {
             audioRef.current.pause();
           }
        }
      }
    }

    return () => {
      // Cleanup is handled by next run or component unmount (audioService has internal state, audioRef is DOM)
      if (config.audioSource === 'NOISE' && !shouldPlay) audioService.toggle(false, 0);
    };
  }, [config.enableSound, config.soundVolume, config.audioSource, state.isPlaying, state.images.length, state.musicUrl]);

  // Fullscreen Handler
  useEffect(() => {
    const handleFsChange = () => {
      setState(s => ({ ...s, isFullScreen: !!document.fullscreenElement }));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isSettingsOpen) return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          goNext();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
        case 'KeyF':
          toggleFullScreen();
          break;
        case 'KeyR':
          setConfig(c => ({...c, playMode: PlayMode.FORCE_RANDOM}));
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.isPlaying, state.currentIndex, isSettingsOpen]);

  // Playback Timer
  useEffect(() => {
    if (state.isPlaying && state.images.length > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        // In Blind Box mode, we don't auto-advance unless revealed? 
        // For simplicity, we auto-advance in all modes, 
        // but blind box hides the image initially.
        goNext();
      }, config.interval * 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isPlaying, config.interval, state.images.length, config.playMode, state.currentIndex]);

  // --- Logic Helpers ---

  const getActivePool = useCallback(() => {
    if (config.playMode === PlayMode.FAVORITES) {
      return state.images.map((img, idx) => ({ idx, id: img.id })).filter(i => state.favorites.has(i.id));
    }
    return state.images.map((_, idx) => ({ idx }));
  }, [state.images, state.favorites, config.playMode]);

  const shuffleArray = (array: number[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const getNextIndex = useCallback(() => {
    const pool = getActivePool();
    if (pool.length === 0) return -1;

    // 1. Sequential / BlindBox
    if (config.playMode === PlayMode.SEQUENTIAL || config.playMode === PlayMode.BLIND_BOX) {
      // Find current index in the pool
      const currentPoolIndex = pool.findIndex(p => p.idx === state.currentIndex);
      const nextPoolIndex = (currentPoolIndex + 1) % pool.length;
      return pool[nextPoolIndex].idx;
    }

    // 2. Pure Random
    if (config.playMode === PlayMode.RANDOM) {
      const rand = Math.floor(Math.random() * pool.length);
      return pool[rand].idx;
    }

    // 3. Force Random
    if (config.playMode === PlayMode.FORCE_RANDOM) {
      if (pool.length <= 1) return pool[0].idx;
      let rand;
      do {
        rand = Math.floor(Math.random() * pool.length);
      } while (pool[rand].idx === state.currentIndex);
      return pool[rand].idx;
    }

    // 4. Shuffle (No Repeat)
    if (config.playMode === PlayMode.SHUFFLE) {
      let queue = [...state.shuffledQueue];
      
      // Filter queue to ensure it only contains valid items from current pool
      const poolIndices = new Set(pool.map(p => p.idx));
      queue = queue.filter(idx => poolIndices.has(idx));

      if (queue.length === 0) {
        // Refill
        queue = shuffleArray(pool.map(p => p.idx));
      }

      const nextIdx = queue.pop();
      setState(prev => ({ ...prev, shuffledQueue: queue }));
      return nextIdx !== undefined ? nextIdx : -1;
    }

    // 5. Favorites
    if (config.playMode === PlayMode.FAVORITES) {
       const currentPoolIndex = pool.findIndex(p => p.idx === state.currentIndex);
       const nextPoolIndex = (currentPoolIndex + 1) % pool.length;
       return pool[nextPoolIndex].idx;
    }

    return 0;
  }, [config.playMode, state.currentIndex, state.images, state.shuffledQueue, getActivePool]);

  // --- Actions ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newImages: ImageItem[] = [];
    Array.from(e.target.files).forEach(file => {
      if (Object.keys(ACCEPTED_IMAGE_TYPES).includes(file.type)) {
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          url: URL.createObjectURL(file),
          name: file.name,
          type: file.type
        });
      }
    });

    setState(prev => {
      // If first upload, start playing
      const startIdx = prev.images.length === 0 && newImages.length > 0 ? 0 : prev.currentIndex;
      return {
        ...prev,
        images: [...prev.images, ...newImages],
        currentIndex: startIdx
      };
    });
  };

  const handleMusicUpload = (file: File) => {
    if (state.musicUrl) {
      URL.revokeObjectURL(state.musicUrl);
    }
    const url = URL.createObjectURL(file);
    setState(prev => ({ ...prev, musicUrl: url, musicName: file.name }));
    setConfig(prev => ({ ...prev, audioSource: 'FILE', enableSound: true }));
  };

  const clearPlaylist = () => {
    state.images.forEach(img => URL.revokeObjectURL(img.url));
    setState({
      ...state,
      images: [],
      currentIndex: -1,
      isPlaying: false,
      history: [],
      shuffledQueue: []
    });
  };

  const togglePlay = () => setState(s => ({ ...s, isPlaying: !s.isPlaying }));

  const goNext = () => {
    const nextIdx = getNextIndex();
    if (nextIdx !== -1) {
      setState(prev => ({
        ...prev,
        currentIndex: nextIdx,
        history: [...prev.history, prev.currentIndex] // Save current to history before moving
      }));
    }
  };

  const goPrev = () => {
    setState(prev => {
      if (prev.history.length === 0) return prev;
      const newHistory = [...prev.history];
      const lastIdx = newHistory.pop();
      return {
        ...prev,
        history: newHistory,
        currentIndex: lastIdx !== undefined ? lastIdx : prev.currentIndex
      };
    });
  };

  const toggleFavorite = () => {
    if (state.currentIndex === -1) return;
    const currentId = state.images[state.currentIndex].id;
    setState(prev => {
      const newFavs = new Set(prev.favorites);
      if (newFavs.has(currentId)) newFavs.delete(currentId);
      else newFavs.add(currentId);
      return { ...prev, favorites: newFavs };
    });
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleAnalyzeImage = async () => {
    if (state.currentIndex === -1) return;
    const imgIndex = state.currentIndex;
    const imgItem = state.images[imgIndex];

    if (imgItem.analysis) return; // Already analyzed

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.readAsDataURL(imgItem.file);
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: imgItem.type, data: base64Data } },
            { text: "Analyze this image. Provide a concise description (max 20 words) in Simplified Chinese and 3-5 short keywords/tags in Simplified Chinese." }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              tags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      if (result.description) {
        setState(prev => {
          const newImages = [...prev.images];
          newImages[imgIndex] = { ...newImages[imgIndex], analysis: result };
          return { ...prev, images: newImages };
        });
      }

    } catch (error) {
      console.error("Analysis failed:", error);
      throw error; // Let the caller handle the UI state
    }
  };

  // --- Render ---

  const currentImage = state.currentIndex !== -1 ? state.images[state.currentIndex] : null;
  const isFavorite = currentImage ? state.favorites.has(currentImage.id) : false;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Hidden Audio Element for Custom Music */}
      <audio ref={audioRef} src={state.musicUrl || undefined} loop />

      {/* Top Bar (Hidden in Fullscreen) */}
      {!state.isFullScreen && (
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50 backdrop-blur-md shrink-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ImageIcon size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight hidden sm:block">ZenFrame</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-sm transition"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">导入</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              accept="image/*"
              {...{webkitdirectory: "", directory: ""} as any}
              onChange={handleFileUpload} 
            />

            <div className="w-px h-6 bg-zinc-700 mx-1" />

            <button 
              onClick={toggleFullScreen}
              className="p-2 hover:bg-zinc-800 rounded-md transition text-zinc-400 hover:text-white"
              title="切换全屏 (F)"
            >
              <Maximize size={18} />
            </button>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-zinc-800 rounded-md transition text-zinc-400 hover:text-white"
              title="设置"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main Stage */}
      <Stage 
        currentImage={currentImage} 
        isTransitionEnabled={config.transitionEnabled}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        showInfo={config.showInfo}
        mode={config.playMode}
        onBlindBoxReveal={() => { /* Optional logic when clicking blind box */ }}
        showRandomText={config.enableRandomText}
        customQuotes={config.customQuotes || []} 
        onAnalyze={handleAnalyzeImage}
      />

      {/* Controls */}
      {!state.isFullScreen && (
        <Controls 
          isPlaying={state.isPlaying}
          onPlayPause={togglePlay}
          onNext={goNext}
          onPrev={goPrev}
          onClear={clearPlaylist}
          mode={config.playMode}
          setMode={(m) => setConfig(prev => ({ ...prev, playMode: m }))}
          total={state.images.length}
          current={state.currentIndex}
        />
      )}

      {/* Floating Fullscreen Exit Button */}
      {state.isFullScreen && (
        <button 
          onClick={toggleFullScreen}
          className="fixed top-4 right-4 p-3 bg-black/50 hover:bg-black/80 backdrop-blur rounded-full text-white/50 hover:text-white transition z-50 group"
        >
          <Minimize size={24} />
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap">
            退出全屏 (F)
          </span>
        </button>
      )}

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={config} 
        setConfig={setConfig}
        currentMusicName={state.musicName}
        onMusicUpload={handleMusicUpload}
      />
    </div>
  );
};

export default App;