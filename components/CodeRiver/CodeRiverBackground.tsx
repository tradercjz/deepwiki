import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Stars, Environment, Stats } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import CodeRiver from './CodeRiver';

const T = {
  color: 'color' as any,
  fog: 'fog' as any,
  ambientLight: 'ambientLight' as any,
  pointLight: 'pointLight' as any,
  hemisphereLight: 'hemisphereLight' as any
};

const SystemHUD = ({ statusText, isFound }: { statusText: string, isFound: boolean }) => {
  const [displayFilter, setDisplayFilter] = useState('');
  
  // 当传入的 statusText 变化时，重置打字机
  useEffect(() => {
    let i = 0;
    setDisplayFilter(''); // 先清空
    
    const timer = setInterval(() => {
      // 每次截取 +1 个字符
      setDisplayFilter(statusText.slice(0, i + 1));
      i++;
      if (i >= statusText.length) clearInterval(timer);
    }, 50); // 打字速度 50ms

    return () => clearInterval(timer);
  }, [statusText]);

  return (
    <div className="absolute top-24 left-6 z-10 pointer-events-none font-mono select-none">
      <div className="flex flex-col gap-1">
        
        <div className="flex items-center gap-3">
          {/* 状态灯：没找到时呼吸(ping)，找到时常亮或变色 */}
          <div className="relative flex h-2 w-2">
            {!isFound && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isFound ? 'bg-yellow-400 shadow-[0_0_10px_#facc15]' : 'bg-cyan-500'}`}></span>
          </div>
          
          {/* 文字内容 */}
          <span className={`text-xs sm:text-sm tracking-widest font-bold transition-colors duration-300 ${
            isFound 
              ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' // 找到时变金黄色
              : 'text-cyan-400/80 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' // 寻找时青色
          }`}>
            {`> ${displayFilter}`}
            <span className="animate-pulse">_</span>
          </span>
        </div>

        {/* 只有在寻找时才显示下面的伪数据，找到时隐藏以突出重点 */}
        {!isFound && (
          <div className="pl-5 text-[10px] text-cyan-600/50 flex flex-col gap-0.5">
             <span className="opacity-0 animate-fade-in-up" style={{animationDelay: '0.5s'}}>SCANNING_STREAM...</span>
          </div>
        )}

      </div>
    </div>
  );
};

// 场景灯光组件
const Lighting: React.FC<{ colorTemp: number; isChatting: boolean }> = ({ colorTemp, isChatting }) => {
    const warmColor = new THREE.Color('#ffcc33');
    const redColor = new THREE.Color('#ff3300');
    
    const currentColor = useMemo(() => {
      return warmColor.clone().lerp(redColor, colorTemp);
    }, [colorTemp]);
  
    // 定义不同状态下的强度
    const mainIntensity = isChatting ? 0.2 : 2.0; // 主光：从 2.0 降到 0.2
    const fillIntensity = isChatting ? 0.1 : 1.0; // 补光：从 1.0 降到 0.1
    const ambientIntensity = isChatting ? 0.05 : 0.2; // 环境光：变得极暗

    return (
      <>
        <T.color attach="background" args={['#020205']} />
        <T.fog attach="fog" args={['#020205', 500, 5000]} />
        
        <T.ambientLight intensity={ambientIntensity} />
        
        <T.pointLight 
            position={[0, 200, -300]} 
            intensity={mainIntensity} 
            distance={1500} 
            color={currentColor} 
        />
        <T.pointLight 
            position={[-200, -100, -200]} 
            intensity={fillIntensity} 
            distance={1000} 
            color="#4433ff" 
        />
        <T.hemisphereLight intensity={isChatting ? 0.02 : 0.1} color="#ffffff" groundColor="#000000" />
      </>
    );
};

interface Props {
  isChatting?: boolean; // 可以根据是否在聊天调整相机位置或模糊度
}

export const CodeRiverBackground: React.FC<Props> = ({ isChatting }) => {
  
  // ✨ 状态管理
  const [hudState, setHudState] = useState({
    text: "Finding dolphin...",
    isFound: false
  });

  // 处理 3D 背景传来的“找到目标”事件
  const handleMatchFound = (word: string) => {
    if (isChatting) return;
    // 1. 改变状态为“找到”
    setHudState({
      text: `TARGET DETECTED: "${word}"`,
      isFound: true
    });
  };

  const handleMatchComplete = () => {
    if (!isChatting) {
      setHudState({
        text: "Finding dolphin...",
        isFound: false
      });
    }
  };

  useEffect(() => {
    if (isChatting) {
      // 进入聊天模式：停止寻找，显示待机状态
      setHudState({
        text: "SYSTEM: ONLINE", // 或者 "DATA STREAM: ACTIVE"
        isFound: false
      });
    } else {
      // 回到首页：恢复寻找状态
      setHudState({
        text: "Finding dolphin...",
        isFound: false
      });
    }
  }, [isChatting]);

  return (
    <div className="fixed inset-0 -z-10 bg-black">
      
      {/* 将状态传入 HUD */}
      <SystemHUD statusText={hudState.text} isFound={hudState.isFound} />

      <Canvas
        dpr={[1, 2]} 
        gl={{
          antialias: true,
          stencil: false,
          depth: true,
          powerPreference: "high-performance"
        }}
      >
         {/* 聊天时相机稍微推远一点点，增加空间感 */}
        <PerspectiveCamera 
          makeDefault 
          position={[0, 0, isChatting ? 1600 : 1400]} 
          fov={60} 
          far={10000} 
        />
        <Suspense fallback={null}>
          <Lighting colorTemp={isChatting ? 0.1 : 0.3} isChatting={isChatting} />


          {/* ✨ 传入回调函数 */}
        <CodeRiver 
            onMatchFound={handleMatchFound} 
            onMatchComplete={handleMatchComplete}
            isChatting={isChatting} 
          />

          <Stars radius={1500} depth={500} count={5000} factor={4} saturation={0.5} fade speed={1} />
          <Environment preset="night" />
          <EffectComposer multisampling={4}>
             {/* 聊天时稍微降低泛光强度，减少刺眼感 */}
            <Bloom 
                luminanceThreshold={1.0} 
                mipmapBlur 
                intensity={isChatting ? 0.5 : 5.0} // 从 5.0 降到 0.5，几乎不发光
                radius={0.5} 
            />

            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};
