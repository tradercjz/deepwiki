import React, { useRef, useMemo } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { IceTerrainMaterial } from '../effects/IceTerrainShader';
import helvetiker from 'three/examples/fonts/helvetiker_regular.typeface.json'; 
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
// 引入 Environment 增强反光
import { Environment, Float } from '@react-three/drei';

extend({ IceTerrainMaterial });

export const IceIntroScene: React.FC = () => {
  const { camera } = useThree();
  const terrainRef = useRef<any>(null);
  const textRef = useRef<THREE.Mesh>(null);
  
  // 记录累积滚动量
  const scrollRef = useRef(0);

  // 文字几何体
  const textGeometry = useMemo(() => {
    const loader = new FontLoader();
    const font = loader.parse(helvetiker);
    const geo = new TextGeometry('DolphinDB', {
      font: font,
      size: 10,
      height: 3, // 厚一点
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.6,
      bevelSize: 0.2,
      bevelSegments: 4,
    });
    geo.center();
    return geo;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // --- 1. 地形滚动控制 ---
    // 逻辑：文字升起前(0-4s)全速，升起后(4s+)迅速减速停止
    let speed = 1.0;
    if (t > 3.5) {
        // 1秒内减速到0
        speed = Math.max(0, 1.0 - (t - 3.5) / 1.0);
    }
    // 累加 scroll
    scrollRef.current += speed * delta * 2.0; // *2.0 是基础速度

    if (terrainRef.current) {
        terrainRef.current.uScroll = scrollRef.current;
    }

    // --- 2. 运镜逻辑 (Camera Rig) ---
    // 目标：创造"仰视巨物"的感觉
    if (t < 3.5) {
        // Phase 1: 贴地滑行
        // Z: 90 -> 40
        // Y: 4 (稍微有点高度，看路)
        const p = t / 3.5;
        camera.position.set(0, 4, 90 - p * 50);
        camera.lookAt(0, 2, 0); // 平视前方
    } else {
        // Phase 2: 文字升起，视角下沉
        const p = Math.min(1.0, (t - 3.5) / 2.5); // 2.5秒完成
        const smoothP = p * (2 - p); // Ease Out

        // 相机位置：从 Z=40 推进到 Z=25
        // 关键：高度 Y 从 4 降到 0.5 (贴地仰视)
        const curZ = THREE.MathUtils.lerp(40, 25, smoothP);
        const curY = THREE.MathUtils.lerp(4, 0.5, smoothP);
        
        camera.position.set(0, curY, curZ);

        // 视点：从看 Y=2 变成看 Y=12 (文字中心)
        const lookY = THREE.MathUtils.lerp(2, 12, smoothP);
        camera.lookAt(0, lookY, 0);
    }

    // --- 3. 文字动画 ---
    if (textRef.current) {
        // 3.5秒开始升起
        if (t > 3.5) {
            const p = Math.min(1.0, (t - 3.5) / 2.0);
            // 弹性升起
            // const elastic = 1.0 - Math.pow(1.0 - p, 4); 
            // 缓慢巨物升起感 (Slow start, slow end)
            const smoothRise = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
            
            // 从地下 -15 升到 +8
            textRef.current.position.y = -15 + smoothRise * 23;
            
            // 微微旋转，展示折射
            textRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
            textRef.current.rotation.x = Math.sin(t * 0.3) * 0.05;
        } else {
            textRef.current.position.y = -15;
        }
    }
  });

  return (
    <>
      {/* 
        环境贴图：这是让冰看起来像冰的关键！ 
        preset="snow" 或 "city" 都能提供冷色调反光
      */}
      <Environment preset="city" />

      {/* 地形 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
        {/* Segments 必须高，不然地形是平的 */}
        <planeGeometry args={[200, 200, 200, 200]} />
        {/* @ts-ignore */}
        <iceTerrainMaterial 
            ref={terrainRef} 
            side={THREE.DoubleSide}
            // 确保和背景色一致
            uFogColor={new THREE.Color('#cdebf9')}
        />
      </mesh>

      {/* 文字 (冰雕) */}
      <mesh ref={textRef} geometry={textGeometry}>
        {/* 
           MeshPhysicalMaterial 是最真实的玻璃/冰材质
           Transmission: 透光
           Thickness: 厚度折射
           Roughness: 冰面的粗糙度
        */}
        <meshPhysicalMaterial 
            color="#ffffff"
            transmission={1.0}  // 全透
            opacity={1.0}
            metalness={0.0}
            roughness={0.1}     // 比较光滑
            ior={1.5}           // 冰的折射率
            thickness={5.0}     // 厚度，产生体积感
            specularIntensity={1.0}
            envMapIntensity={1.5} // 环境反光强度
            attenuationColor="#aeeeff" // 内部吸收色(青色)
            attenuationDistance={5.0}
        />
      </mesh>

      {/* 灯光系统 (模拟晴朗雪天) */}
      {/* 主光 (太阳) */}
      <directionalLight 
        position={[50, 50, 50]} 
        intensity={2.0} 
        color="#ffffff" 
        castShadow 
      />
      {/* 补光 (雪地反光) */}
      <directionalLight position={[-50, 0, 20]} intensity={1.0} color="#aeeeff" />
      {/* 环境光 */}
      <ambientLight intensity={0.6} color="#ffffff" />
      
      {/* 
         增加一些悬浮的"雪尘"，增加空间感 
         使用 Float 让它们微微浮动
      */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
         <SnowDust />
      </Float>
    </>
  );
};

// 简单的雪尘组件
const SnowDust = () => {
    const count = 1000;
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for(let i=0; i<count; i++) {
            pos[i*3] = (Math.random()-0.5) * 150;
            pos[i*3+1] = Math.random() * 50; // 空中
            pos[i*3+2] = (Math.random()-0.5) * 100;
        }
        return pos;
    }, []);
    
    return (
        <points>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial 
                color="#ffffff" 
                size={0.4} 
                transparent 
                opacity={0.6} 
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    )
}