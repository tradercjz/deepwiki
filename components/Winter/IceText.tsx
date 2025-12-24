
import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const WORD = "DOLPHINMIND";

const IceText: React.FC = () => {
  const spacing = 7.0; 
  const startX = -(WORD.length * spacing) / 2 + spacing / 2;

  return (
    <group position={[0, 4, -18]}>
       {/* 减少光源数量或范围，或者干脆去掉这里的点光源，依靠环境光 */}
      <pointLight position={[0, -5, 5]} intensity={3.0} distance={50} color="#60a5fa" />
      

      {WORD.split('').map((char, i) => (
        <group key={`ice-text-${i}`} position={[startX + i * spacing, 0, 0]}>
          <Text
            fontSize={11.0} 
            font="/fonts/Montserrat-Black.ttf"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.08}
            outlineColor="#f0f9ff"
          >
            {char}
            {/* 
               ✨ 优化重点：
               MeshPhysicalMaterial 依然保留，但移除复杂的 clearcoat，
               并降低 transmission 采样质量（通过粗糙度控制）
            */}
            <meshPhysicalMaterial 
              color="#3b82f6" 
              transmission={0.2} // 降低透射度，这就减少了背景折射的计算需求
              thickness={2.0}    // 减小厚度计算
              roughness={0.2}    // 增加粗糙度，让反射计算更容易收敛
              metalness={0.1}
              ior={1.2} 
              transparent
              opacity={0.9}      // 稍微不透明一点，减少混合开销
              emissive="#1e40af" 
              emissiveIntensity={0.4}
            />
          </Text>

          {/* 装饰性冰尘 */}
          <group position={[0, 5.5, 0.2]}>
             <mesh position={[0, 0, 0]} scale={[3.5, 0.1, 0.5]}>
               <boxGeometry args={[1, 1, 1]} />
               <meshStandardMaterial color="#ffffff" emissive="#ffffff" />
             </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};

export default IceText;
