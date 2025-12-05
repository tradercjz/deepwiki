import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { getPlugin } from './pluginRegistry';

interface VisualizerProps {
  pluginId: string;
  initialParams?: any; // ✨ 关键：允许外部传入初始参数（例如 func: 'mavg'）
  onClose: () => void;
}

export const DolphinDBVisualizer: React.FC<VisualizerProps> = ({ pluginId, initialParams, onClose }) => {
  const plugin = getPlugin(pluginId);
  
  // 合并默认参数和传入的初始参数
  const [params, setParams] = useState(plugin ? { ...plugin.defaultParams, ...initialParams } : {});
  
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [maxSteps, setMaxSteps] = useState(10);

  // 当插件ID变化时重置
  useEffect(() => {
    if (plugin) {
      console.log("Loading Plugin:", pluginId, "Params:", initialParams);
      setParams({ ...plugin.defaultParams, ...initialParams });
      setProgress(0);
      setIsPlaying(false);
    }
  }, [pluginId, initialParams]); // initialParams 变化也应重置

  // 动画循环 (同 3d 项目逻辑)
  useEffect(() => {
    let handle: number;
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      if (isPlaying) {
        setProgress(p => {
          const next = p + delta * 1.5;
          if (next >= maxSteps) { setIsPlaying(false); return maxSteps; }
          return next;
        });
        handle = requestAnimationFrame(animate);
      }
    };
    if (isPlaying) {
        lastTime = performance.now();
        handle = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(handle);
  }, [isPlaying, maxSteps]);

  if (!plugin) return <div className="text-white">Plugin not found: {pluginId}</div>;

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden font-mono">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 14], fov: 45 }} gl={{ antialias: false, toneMappingExposure: 1.5 }}>
          <color attach="background" args={['#050505']} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <spotLight position={[0, 15, 0]} angle={0.6} penumbra={1} intensity={2} castShadow />
          <Stars radius={100} depth={50} count={5000} factor={4} fade />
          <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000000" />
          
          {/* ✨ 动态渲染插件场景 ✨ */}
          <plugin.SceneComponent 
            isPlaying={isPlaying} 
            progress={progress} 
            params={params} 
            onStepsReady={setMaxSteps} 
          />
          
          <OrbitControls makeDefault />
          <EffectComposer enableNormalPass={false}>
            <Bloom luminanceThreshold={1} intensity={1.5} radius={0.6} />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* UI Overlay: Title & Controls */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
         <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400">
            {plugin.name}
         </h1>
         <p className="text-gray-400 text-xs mt-1">{plugin.description}</p>
      </div>

      {/* Parameter Panel (Top Right) */}
      {plugin.ParameterPanelComponent && (
        <div className="absolute top-4 right-16 z-10 pointer-events-auto">
            <div className="bg-gray-900/90 backdrop-blur-md p-4 border border-gray-700 rounded-lg shadow-xl w-72 max-h-[80vh] overflow-y-auto">
                <div className="text-xs font-bold text-gray-500 uppercase border-b border-gray-700 pb-1 mb-2">Parameters</div>
                <plugin.ParameterPanelComponent params={params} setParams={setParams} />
            </div>
        </div>
      )}

      {/* Playback Controls (Bottom) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 pointer-events-auto w-full max-w-2xl px-4">
         <div className="bg-gray-900/80 backdrop-blur border border-gray-700 rounded-full p-2 flex items-center gap-4">
            <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center hover:bg-cyan-500 transition">
                {isPlaying ? "⏸" : "▶"}
            </button>
            <input 
                type="range" min="0" max={maxSteps} step="0.01" 
                value={progress} 
                onChange={(e) => { setIsPlaying(false); setProgress(parseFloat(e.target.value)); }}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-xs text-cyan-400 font-mono w-16 text-right">
                {progress.toFixed(1)} / {maxSteps}
            </span>
         </div>
      </div>

      {/* Close Button */}
      <button onClick={onClose} className="absolute top-4 right-4 z-20 text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-full p-2 transition">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};