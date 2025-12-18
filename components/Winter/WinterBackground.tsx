import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, PerspectiveCamera } from '@react-three/drei';
import IceGround from './IceGround';
import Sleigh from './Sleigh';
import Snowflakes from './Snowflakes';
import Trees from './Trees';
import IceText from './IceText';

interface Props {
  isChatting?: boolean;
}

export const WinterBackground: React.FC<Props> = ({ isChatting }) => {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 bg-slate-900 transition-opacity duration-1000">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera 
            makeDefault 
            // 聊天时相机可以稍微拉远或上移，这里先用统一视角
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
            shadow-mapSize={[2048, 2048]}
          />
          
          <IceGround />
          <IceText />
          <Sleigh />
          <Trees />
          <Snowflakes count={3000} />
        </Suspense>

        <OrbitControls 
          enablePan={false} 
          enableZoom={false} // 禁止缩放以免破坏背景感
          minPolarAngle={Math.PI / 6} 
          maxPolarAngle={Math.PI / 2.1} 
          minDistance={40}
          maxDistance={120}
          target={[0, 1, 0]}
          // 增加一点自动旋转，更有活力
          autoRotate={false}
        />
      </Canvas>
      
      {/* 叠加层：当进入聊天模式时，加深背景遮罩，提高可读性 */}
      <div 
        className={`absolute inset-0 bg-slate-900 transition-opacity duration-700 pointer-events-none ${
            isChatting ? 'opacity-80' : 'opacity-0'
        }`} 
      />
    </div>
  );
};