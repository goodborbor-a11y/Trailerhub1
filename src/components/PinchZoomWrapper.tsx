import { ReactNode, useState, useEffect } from 'react';
import { usePinchZoom } from '@/hooks/usePinchZoom';

interface PinchZoomWrapperProps {
  children: ReactNode;
}

export const PinchZoomWrapper = ({ children }: PinchZoomWrapperProps) => {
  const { zoomLevel } = usePinchZoom();
  const [showIndicator, setShowIndicator] = useState(false);
  const [lastZoom, setLastZoom] = useState(zoomLevel);

  useEffect(() => {
    if (zoomLevel !== lastZoom) {
      setShowIndicator(true);
      setLastZoom(zoomLevel);
      
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [zoomLevel, lastZoom]);

  return (
    <>
      {children}
      
      {/* Zoom indicator overlay */}
      {showIndicator && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium animate-fade-in pointer-events-none">
          Zoom: {zoomLevel}%
        </div>
      )}
    </>
  );
};
