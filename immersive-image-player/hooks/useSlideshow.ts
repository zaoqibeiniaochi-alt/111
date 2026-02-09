import { useState, useEffect, useCallback, useRef } from 'react';
import { PlayMode } from '../types';

interface UseSlideshowProps {
  totalImages: number;
  initialIndex: number;
  speed: number;
  mode: PlayMode;
  isPlaying: boolean;
  onIndexChange: (index: number) => void;
}

export const useSlideshow = ({
  totalImages,
  initialIndex,
  speed,
  mode,
  isPlaying,
  onIndexChange,
}: UseSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const historyRef = useRef<number[]>([]);
  const timerRef = useRef<number | null>(null);

  // Sync internal state if initialIndex changes externally (e.g. restore from storage)
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Notify parent of changes for persistence
  useEffect(() => {
    onIndexChange(currentIndex);
  }, [currentIndex, onIndexChange]);

  const getNextRandomIndex = useCallback(() => {
    if (totalImages <= 1) return 0;
    let nextIndex = Math.floor(Math.random() * totalImages);
    // Try to avoid repeating the same image immediately
    if (nextIndex === currentIndex) {
      nextIndex = (currentIndex + 1) % totalImages;
    }
    return nextIndex;
  }, [totalImages, currentIndex]);

  const next = useCallback(() => {
    if (totalImages === 0) return;

    setCurrentIndex((prev) => {
      historyRef.current.push(prev); // Save to history
      // Limit history size to prevent memory issues (though numbers are tiny)
      if (historyRef.current.length > 50) historyRef.current.shift();

      if (mode === 'random') {
        return getNextRandomIndex();
      } else {
        return (prev + 1) % totalImages;
      }
    });
  }, [totalImages, mode, getNextRandomIndex]);

  const prev = useCallback(() => {
    if (totalImages === 0) return;

    setCurrentIndex((prevIndex) => {
      if (mode === 'random') {
        // Pop from history
        const lastIndex = historyRef.current.pop();
        return lastIndex !== undefined ? lastIndex : (prevIndex - 1 + totalImages) % totalImages;
      } else {
        return (prevIndex - 1 + totalImages) % totalImages;
      }
    });
  }, [totalImages, mode]);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying && totalImages > 0) {
      // Clear existing timer to reset the countdown if speed changes or manual nav happens
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = window.setInterval(() => {
        next();
      }, speed * 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, speed, totalImages, next]);

  // Reset logic when images change drastically
  useEffect(() => {
    if (currentIndex >= totalImages && totalImages > 0) {
      setCurrentIndex(0);
    }
  }, [totalImages, currentIndex]);

  return {
    currentIndex,
    next,
    prev,
    setCurrentIndex,
  };
};