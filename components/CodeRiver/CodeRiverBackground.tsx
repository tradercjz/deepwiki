import React, { Suspense, useMemo } from 'react';
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

// 场景灯光组件 (源自原项目的 Scene.tsx)
const Lighting: React.FC<{ colorTemp: number }> = ({ colorTemp }) => {
  const warmColor = new THREE.Color('#ffcc33');
  const redColor = new THREE.Color('#ff3300');
  
  const currentColor = useMemo(() => {
    return warmColor.clone().lerp(redColor, colorTemp);
  }, [colorTemp]);

  return (
    <>
      <T.color attach="background" args={['#020205']} />
      <T.fog attach="fog" args={['#020205', 500, 5000]} />
      <T.ambientLight intensity={0.2} />
      <T.pointLight 
        position={[0, 200, -300]} 
        intensity={2} 
        distance={1500} 
        color={currentColor} 
      />
      <T.pointLight 
        position={[-200, -100, -200]} 
        intensity={1} 
        distance={1000} 
        color="#4433ff" 
      />
      <T.hemisphereLight intensity={0.1} color="#ffffff" groundColor="#000000" />
    </>
  );
};

interface Props {
  isChatting?: boolean; // 可以根据是否在聊天调整相机位置或模糊度
}

export const CodeRiverBackground: React.FC<Props> = ({ isChatting }) => {
  return (
    <div className="fixed inset-0 -z-10 bg-black">
      <Canvas
        dpr={[1, 2]} // 保持高性能设置
        gl={{
          antialias: true,
          stencil: false,
          depth: true,
          powerPreference: "high-performance"
        }}
      >
        {/* 开发模式下可以开启 Stats */}
        {/* <Stats /> */}
        
        <PerspectiveCamera
          makeDefault
          // 如果在聊天界面，相机稍微拉远或平移，避免文字干扰 UI？
          // 这里保持原设定的 1400
          position={[0, 0, 1400]} 
          fov={60}
          far={10000}
        />

        <Suspense fallback={null}>
          <Lighting colorTemp={0.3} />

          <CodeRiver />

          <Stars radius={1500} depth={500} count={5000} factor={4} saturation={0.5} fade speed={1} />
          <Environment preset="night" />

          <EffectComposer multisampling={4}>
            <Bloom
              luminanceThreshold={1.0}
              mipmapBlur
              intensity={5.0} // 保持原有的强发光风格
              radius={0.5}
            />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};