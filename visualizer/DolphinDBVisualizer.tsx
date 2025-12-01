// src/visualizer/DolphinDBVisualizer.tsx

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { UIOverlay } from './components/UIOverlay'; // ✨ 引入控制层
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
  // --- 状态管理 (恢复完整的参数控制) ---
  const [mode, setMode] = useState<AppMode>(initialMode);
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // ✨ 默认暂停，等待用户点击
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 参数状态
  const [threshold, setThreshold] = useState(DEFAULTS.threshold);
  const [funcType, setFuncType] = useState<FuncType>(DEFAULTS.funcType);
  const [funcWindow, setFuncWindow] = useState(DEFAULTS.funcWindow);
  
  // Pivot Specific
  const [pivotFunc, setPivotFunc] = useState<'last'|'sum'|'count'>('last');

  // TS Engine Specific
  const [tsWindowSize, setTsWindowSize] = useState(DEFAULTS.tsWindowSize);
  const [tsStep, setTsStep] = useState(DEFAULTS.tsStep);

  // --- Logic Hooks ---
  const condIterResults = useConditionalIterateLogic(threshold, funcType, funcWindow);
  const tmSeriesResults = useTmSeriesLogic(funcWindow);
  const pivotResults = usePivotLogic(pivotFunc);
  const tsEngineResults = useTimeSeriesEngineLogic(tsWindowSize, tsStep);

  // Determine Data Source
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

  // Reset when mode changes
  useEffect(() => {
      setProgress(0);
      setIsPlaying(false);
  }, [mode]);

  // --- Animation Loop ---
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      // 防止 delta 计算异常（例如切换 Tab 后切回来，delta 可能会巨大）
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      
      // 忽略异常的负值或过大的跳跃
      if (delta < 0 || delta > 0.1) {
          animationFrameId = requestAnimationFrame(animate);
          return;
      }

      setProgress((prev) => {
        // 这里的 prev 是最新的 progress，不需要通过依赖项获取
        const newProgress = prev + (delta * 1.5); // 1.5 是播放速度
        
        if (newProgress >= totalSteps) {
            setIsPlaying(false); // 播放结束
            return totalSteps;
        }
        return newProgress;
      });
      
      // 只要还在播放状态（注意：这里闭包里的 isPlaying 是启动时的值，但 react 会在 isPlaying 变 false 时清理这个 effect）
      // 实际上，因为我们把 isPlaying 放在依赖里，当 setIsPlaying(false) 发生时，
      // 这个 Effect 会被 cleanup，从而 cancelAnimationFrame，循环自然停止。
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      // ✨ 关键修复：如果在终点点击播放，先重置为 0
      setProgress((prev) => (prev >= totalSteps ? 0 : prev));
      
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
    
    // ✨✨✨ 关键修复：依赖数组中去掉 'progress' ✨✨✨
    // 这样 Effect 就不会每一帧都重启，lastTime 就能正确记录上一帧的时间了
  }, [isPlaying, totalSteps]);
  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden font-mono">
      {/* 3D 场景层 */}
      <div className="absolute inset-0 z-0">
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
      </div>

      {/* UI 控制层 (Overlay) */}
      <UIOverlay 
        mode={mode}
        setMode={setMode}
        progress={progress} 
        setProgress={setProgress}
        totalSteps={totalSteps}
        hoveredIndex={hoveredIndex}
        results={currentResults}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        params={{
          threshold, setThreshold,
          funcType, setFuncType,
          funcWindow, setFuncWindow,
          pivotFunc, setPivotFunc,
          tsWindowSize, setTsWindowSize,
          tsStep, setTsStep
        }}
      />

      {/* 独立的关闭按钮 (位于最顶层，覆盖 UIOverlay) */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-[60] group flex items-center justify-center w-10 h-10 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 rounded-full transition-all duration-300 backdrop-blur-md"
        title="Close Demo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};