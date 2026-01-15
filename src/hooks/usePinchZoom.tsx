import { useEffect, useRef, useCallback, useState } from 'react';

export const usePinchZoom = () => {
  const [zoomLevel, setZoomLevel] = useState(() => {
    const saved = localStorage.getItem('websiteZoom');
    return saved ? parseInt(saved) : 100;
  });
  const lastPinchDistance = useRef<number | null>(null);

  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      lastPinchDistance.current = getDistance(e.touches[0], e.touches[1]);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance.current !== null) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const delta = currentDistance - lastPinchDistance.current;
      
      // Adjust sensitivity
      if (Math.abs(delta) > 10) {
        setZoomLevel(prev => {
          const newZoom = prev + (delta > 0 ? 5 : -5);
          const clampedZoom = Math.min(Math.max(newZoom, 20), 150);
          document.documentElement.style.fontSize = `${clampedZoom}%`;
          localStorage.setItem('websiteZoom', clampedZoom.toString());
          return clampedZoom;
        });
        lastPinchDistance.current = currentDistance;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistance.current = null;
  }, []);

  useEffect(() => {
    // Apply saved zoom on mount
    document.documentElement.style.fontSize = `${zoomLevel}%`;
    
    // Add touch event listeners to the document
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, zoomLevel]);

  const resetZoom = useCallback(() => {
    setZoomLevel(100);
    document.documentElement.style.fontSize = '100%';
    localStorage.setItem('websiteZoom', '100');
  }, []);

  return { zoomLevel, resetZoom };
};
