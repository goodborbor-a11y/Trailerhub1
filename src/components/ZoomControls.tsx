import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface ZoomControlsProps {
  variant?: 'default' | 'trailer';
  className?: string;
}

export const ZoomControls = ({ variant = 'default', className = '' }: ZoomControlsProps) => {
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    // Get saved zoom level from localStorage
    const savedZoom = localStorage.getItem('websiteZoom');
    if (savedZoom) {
      const zoom = parseInt(savedZoom);
      setZoomLevel(zoom);
      document.documentElement.style.fontSize = `${zoom}%`;
    }
  }, []);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 10, 150);
    setZoomLevel(newZoom);
    document.documentElement.style.fontSize = `${newZoom}%`;
    localStorage.setItem('websiteZoom', newZoom.toString());
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 10, 70);
    setZoomLevel(newZoom);
    document.documentElement.style.fontSize = `${newZoom}%`;
    localStorage.setItem('websiteZoom', newZoom.toString());
  };

  const handleReset = () => {
    setZoomLevel(100);
    document.documentElement.style.fontSize = '100%';
    localStorage.setItem('websiteZoom', '100');
  };

  const isTrailer = variant === 'trailer';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleZoomOut}
        className={isTrailer 
          ? "h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white" 
          : "h-8 w-8"
        }
        title="Zoom out"
        disabled={zoomLevel <= 70}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <span className={`text-xs font-medium min-w-[3rem] text-center ${isTrailer ? 'text-white' : ''}`}>
        {zoomLevel}%
      </span>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={handleZoomIn}
        className={isTrailer 
          ? "h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white" 
          : "h-8 w-8"
        }
        title="Zoom in"
        disabled={zoomLevel >= 150}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      {zoomLevel !== 100 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          className={isTrailer 
            ? "h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white" 
            : "h-8 w-8"
          }
          title="Reset zoom"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
