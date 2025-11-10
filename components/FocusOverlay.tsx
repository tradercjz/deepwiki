import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActiveHighlight } from '../types';

interface FocusOverlayProps {
  citationElement: HTMLElement;
  highlight: ActiveHighlight | null;
  onExit: () => void;
}

export const FocusOverlay: React.FC<FocusOverlayProps> = ({ citationElement, highlight, onExit }) => {
  const [linePath, setLinePath] = useState<string | null>(null);
  const lineRef = useRef<SVGPathElement>(null);

  const getSourceElement = useCallback(() => {
    if (!highlight || highlight.length === 0) return null;
    const { filePath, startLine } = highlight[0];
    const fileContainer = document.querySelector(`[data-filepath="${CSS.escape(filePath)}"][data-focus-target="true"]`);
    if (!fileContainer) return null;
    const lineElement = fileContainer.querySelector(`[data-line-number="${startLine}"]`);
    return lineElement || fileContainer;
  }, [highlight]);

  const updateLine = useCallback(() => {
    const sourceElement = getSourceElement();
    if (!citationElement || !sourceElement) {
      setLinePath(null);
      return;
    }

    const citationRect = citationElement.getBoundingClientRect();
    const sourceRect = sourceElement.getBoundingClientRect();

    const startX = citationRect.left + citationRect.width / 2;
    const startY = citationRect.top + citationRect.height / 2;
    const endX = sourceRect.left;
    const endY = sourceRect.top + sourceRect.height / 2;
    
    const controlX1 = startX + (endX - startX) * 0.25;
    const controlY1 = startY;
    const controlX2 = startX + (endX - startX) * 0.75;
    const controlY2 = endY;

    setLinePath(`M ${startX},${startY} C ${controlX1},${controlY1} ${controlX2},${controlY2} ${endX},${endY}`);
  }, [citationElement, getSourceElement]);


  useEffect(() => {
    const sourceContainer = getSourceElement()?.closest('.overflow-y-auto');
    
    updateLine();

    window.addEventListener('resize', updateLine);
    window.addEventListener('scroll', updateLine, true); // Use capture to get all scroll events
    
    if(sourceContainer) {
      sourceContainer.addEventListener('scroll', updateLine, true);
    }
    
    return () => {
      window.removeEventListener('resize', updateLine);
      window.removeEventListener('scroll', updateLine, true);
      if(sourceContainer) {
        sourceContainer.removeEventListener('scroll', updateLine, true);
      }
    };
  }, [updateLine, getSourceElement]);

  return (
    <div 
      className="fixed inset-0 z-20"
      onClick={onExit}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {linePath && (
          <path
            ref={lineRef}
            d={linePath}
            stroke="rgba(59, 130, 246, 0.6)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="4 4"
          >
            <animate
                attributeName="stroke-dashoffset"
                from="16"
                to="0"
                dur="1s"
                repeatCount="indefinite"
              />
          </path>
        )}
      </svg>
    </div>
  );
};