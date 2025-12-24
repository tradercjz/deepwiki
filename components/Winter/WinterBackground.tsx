import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, PerspectiveCamera, PerformanceMonitor } from '@react-three/drei';
import IceGround from './IceGround';
import Sleigh from './Sleigh';
import Snowflakes from './Snowflakes';
import Trees from './Trees';
import IceText from './IceText';

interface Props {
  isChatting?: boolean;
}

export const WinterBackground: React.FC<Props> = ({ isChatting }) => {
  // 动态调整分辨率因子，如果帧率下降，dpr 会自动降低
  const [dpr, setDpr] = useState(1.5); 
  return (
    <div className="fixed inset-0 w-full h-full -z-10 bg-slate-900 transition-opacity duration-1000">
      <Canvas 
        // ✨ 优化1: 关闭阴影贴图的自动更新，或者完全关闭阴影 (这里保留阴影但限制 dpr)
        shadows 
        // ✨ 优化2: 限制最高 DPR 为 1.5 (即使在 4K 屏上也只渲染 1.5倍，大幅降低 GPU 压力)
        // 绝大多数 GPU 跑不动 4K 分辨率的实时反射
        dpr={[1, dpr]} 
        // ✨ 优化3: 性能模式
        gl={{ 
          antialias: false, // 关闭原生抗锯齿 (后处理或高 DPR 下通常不需要)
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
      >
        {/* ✨ 优化4: 性能监控，如果 FPS 低于阈值，自动降级分辨率 */}
        <PerformanceMonitor onIncline={() => setDpr(1.5)} onDecline={() => setDpr(1)} />

        <PerspectiveCamera 
            makeDefault 
            position={[0, 15, 65]} 
            fov={35} 
        />
        
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#f0f9ff', 40, 120]} />

        <Suspense fallback={null}>
          <Sky 
            distance={450000} 
            sunPosition={[10, 20, 10]} 
            inclination={0} 
            azimuth={0.25} 
            turbidity={0.05} 
            rayleigh={0.2} 
          />
          <Stars radius={100} depth={50} count={200} factor={4} saturation={0} fade speed={0.5} />
          
          <ambientLight intensity={1.2} /> 
          <directionalLight 
            position={[30, 50, 20]} 
            intensity={3.0} 
            castShadow 
            // ✨ 优化5: 减小阴影贴图分辨率 (默认 512 其实就够了，之前可能是 1024 或 2048)
            shadow-mapSize={[1024, 1024]} 
            shadow-bias={-0.0001}
          />
          
          <IceGround />
          <IceText />
          <Sleigh />
          <Trees />
          <Snowflakes count={2000} /> {/* 减少雪花数量 */}
        </Suspense>

        <OrbitControls 
          enablePan={false} 
          enableZoom={false}
          minPolarAngle={Math.PI / 6} 
          maxPolarAngle={Math.PI / 2.1} 
          minDistance={40}
          maxDistance={120}
          target={[0, 1, 0]}
          autoRotate={false}
        />
      </Canvas>
      
      <div 
        className={`absolute inset-0 bg-slate-900 transition-opacity duration-700 pointer-events-none ${
            isChatting ? 'opacity-80' : 'opacity-0'
        }`} 
      />
    </div>
  );
};