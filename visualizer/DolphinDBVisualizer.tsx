import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { DATA_INPUTS, TM_INPUTS, PIVOT_DATA, TS_ENGINE_DATA, DEFAULTS, FuncType, AppMode } from './constants';
import { useConditionalIterateLogic } from './hooks/useConditionalIterate';
import { useTmSeriesLogic } from './hooks/useTmSeriesLogic';
import { usePivotLogic } from './hooks/usePivotLogic';
import { useTimeSeriesEngineLogic } from './hooks/useTimeSeriesEngineLogic';

interface VisualizerProps {
  initialMode: AppMode;
  onClose: () => void;
}

export const DolphinDBVisualizer: React.FC<VisualizerProps> = ({ initialMode, onClose }) => {
  const [mode] = useState<AppMode>(initialMode); // 模式由外部传入，这里暂不切换
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true); // 默认自动播放
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 参数状态
  const [threshold] = useState(DEFAULTS.threshold);
  const [funcType] = useState<FuncType>(DEFAULTS.funcType);
  const [funcWindow] = useState(DEFAULTS.funcWindow);
  const [tsWindowSize] = useState(DEFAULTS.tsWindowSize);
  const [tsStep] = useState(DEFAULTS.tsStep);

  // --- Logic Hooks ---
  const condIterResults = useConditionalIterateLogic(threshold, funcType, funcWindow);
  const tmSeriesResults = useTmSeriesLogic(funcWindow);
  const pivotResults = usePivotLogic('last');
  const tsEngineResults = useTimeSeriesEngineLogic(tsWindowSize, tsStep);

  let currentResults: any[] = [];
  let totalSteps = DATA_INPUTS.length;

  if (mode === 'conditionalIterate') {
      currentResults = condIterResults;
      totalSteps = DATA_INPUTS.length;
  } else if (mode === 'tmFunction') {
      currentResults = tmSeriesResults;
      totalSteps = TM_INPUTS.length;
  } else if (mode === 'pivot') {
      currentResults = pivotResults.steps;
      totalSteps = PIVOT_DATA.length;
  } else if (mode === 'createTimeSeriesEngine') {
      currentResults = tsEngineResults;
      totalSteps = TS_ENGINE_DATA.length;
  }

  // Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      setProgress((prev) => {
        const newProgress = prev + (delta * 1.5);
        if (newProgress >= totalSteps) {
            return 0; // Loop
        }
        return newProgress;
      });
      
      if (isPlaying) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, totalSteps]);

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden font-mono">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [5, 5, 14], fov: 45 }}
        gl={{ antialias: false, toneMappingExposure: 1.5 }}
      >
        <Scene 
          mode={mode}
          progress={progress} 
          results={currentResults}
          pivotLogic={pivotResults}
          tsEngineLogic={tsEngineResults}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
          funcWindow={funcWindow}
          funcType={funcType}
          tsWindowSize={tsWindowSize}
        />
      </Canvas>

      {/* 简单的控制层 */}
      <div className="absolute top-4 right-4 z-50 flex gap-4">
         <div className="bg-black/50 backdrop-blur text-white px-4 py-2 rounded border border-gray-700">
            <span className="text-cyan-400 font-bold">{mode}</span> Demo
         </div>
         <button 
            onClick={onClose}
            className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
         >
            Close
         </button>
      </div>
      
      {/* 底部进度条 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-1/2 bg-gray-800/50 h-1 rounded overflow-hidden">
          <div 
            className="h-full bg-cyan-400" 
            style={{ width: `${(progress / totalSteps) * 100}%` }}
          />
      </div>
    </div>
  );
};