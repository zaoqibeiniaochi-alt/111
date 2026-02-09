import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSlideshow } from './hooks/useSlideshow';
import { ControlBar } from './components/ControlBar';
import { EmptyState } from './components/EmptyState';
import { ImageFile, PlayMode, DEFAULT_SETTINGS, PlayerSettings } from './types';
import { AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'slideshow_settings_v1';

const App: React.FC = () => {
  // --- State ---
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings state (Persisted)
  const [settings, setSettings] = useState<PlayerSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Logic Hooks ---
  const { currentIndex, next, prev, setCurrentIndex } = useSlideshow({
    totalImages: files.length,
    initialIndex: 0, // Will be overridden by logic after load
    speed: settings.speed,
    mode: settings.mode,
    isPlaying,
    onIndexChange: (index) => {
      // Update settings state immediately for UI consistency
      setSettings(prev => ({ ...prev, lastIndex: index }));
    }
  });

  // --- Persistence Effect ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // --- File Handling ---
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    setLoading(true);
    setIsPlaying(false);
    setError(null);

    // Give UI a moment to show loading state
    await new Promise(resolve => setTimeout(resolve, 100));

    const imageFiles: ImageFile[] = [];
    const validExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif']);
    
    // Revoke old URLs to prevent memory leaks
    files.forEach(f => URL.revokeObjectURL(f.url));

    // Determine folder name from first file
    let detectedFolderName = '';
    if (fileList.length > 0) {
      const path = fileList[0].webkitRelativePath;
      if (path) {
        detectedFolderName = path.split('/')[0];
      }
    }

    // Process files
    Array.from(fileList).forEach((file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext && validExtensions.has(ext)) {
        imageFiles.push({
          file,
          url: URL.createObjectURL(file),
          name: file.name
        });
      }
    });

    if (imageFiles.length === 0) {
      setError("未在所选文件夹中找到图片。");
      setLoading(false);
      return;
    }

    // Sort files naturally
    imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    setFiles(imageFiles);

    // Smart Resume Logic
    let newIndex = 0;
    // If the folder name matches the last saved session, try to restore index
    if (settings.lastFolderName === detectedFolderName) {
      // Clamp index in case folder content changed
      newIndex = Math.min(settings.lastIndex, imageFiles.length - 1);
      if (newIndex < 0) newIndex = 0;
    }

    setSettings(prev => ({
      ...prev,
      lastFolderName: detectedFolderName,
      lastIndex: newIndex
    }));
    
    setCurrentIndex(newIndex);
    setLoading(false);
    setIsPlaying(true); // Auto start
  };

  const triggerFolderSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // --- Keyboard Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (files.length === 0) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          next();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          prev();
          break;
        case ' ': // Space
          e.preventDefault();
          setIsPlaying(p => !p);
          break;
        case 'f':
        case 'F':
          toggleFullScreen();
          break;
        case 'Escape':
           if (document.fullscreenElement) document.exitFullscreen();
           break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files.length, next, prev]);

  // --- Fullscreen Handling ---
  const toggleFullScreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullScreen(true);
      } catch (err) {
        console.error("Error attempting to enable full-screen mode:", err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // --- Handlers for ControlBar ---
  const handleSpeedChange = (newSpeed: number) => {
    const validSpeed = Math.max(0.5, newSpeed);
    setSettings(prev => ({ ...prev, speed: validSpeed }));
  };

  const handleModeChange = () => {
    setSettings(prev => ({ 
      ...prev, 
      mode: prev.mode === 'sequential' ? 'random' : 'sequential' 
    }));
  };

  // --- Cleanup ---
  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.url));
    };
  }, []);

  // --- Render ---
  if (files.length === 0 && !loading) {
    return (
      <>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          // @ts-ignore - webkitdirectory is standard in modern browsers but missing in generic React definitions sometimes
          webkitdirectory="" 
          directory="" 
          multiple
        />
        <EmptyState 
          onSelectFolder={triggerFolderSelect} 
          lastFolderName={settings.lastFolderName}
        />
        {error && (
          <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-bounce">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
      </>
    );
  }

  const currentFile = files[currentIndex];

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden select-none"
    >
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        // @ts-ignore
        webkitdirectory="" 
        directory="" 
        multiple
      />

      {/* Main Image Display */}
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-white text-xl">正在加载资源...</p>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
           {/* Background Blurred Image for Fill */}
           {currentFile && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110"
              style={{ backgroundImage: `url(${currentFile.url})` }}
            />
           )}
           
           {/* Actual Image */}
           {currentFile && (
             <img 
               src={currentFile.url} 
               alt={currentFile.name}
               className="relative max-w-full max-h-full object-contain shadow-2xl transition-opacity duration-500"
               style={{ opacity: 1 }} // Could implement fade transition state here
             />
           )}
        </div>
      )}

      {/* Controls */}
      {!loading && (
        <ControlBar 
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onNext={next}
          onPrev={prev}
          onSelectFolder={triggerFolderSelect}
          onToggleFullscreen={toggleFullScreen}
          isFullscreen={isFullScreen}
          speed={settings.speed}
          onSpeedChange={handleSpeedChange}
          mode={settings.mode}
          onModeChange={handleModeChange}
          current={currentIndex}
          total={files.length}
          fileName={currentFile?.name}
        />
      )}
    </div>
  );
};

export default App;