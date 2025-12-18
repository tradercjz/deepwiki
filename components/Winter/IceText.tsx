
import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const WORD = "DOLPHINMIND";

const IceText: React.FC = () => {
  const spacing = 7.0; 
  const startX = -(WORD.length * spacing) / 2 + spacing / 2;

  return (
    <group position={[0, 4, -18]}>
      {/* Central lighting for the whole word instead of per-letter lights */}
      <pointLight position={[0, -5, 5]} intensity={5.0} distance={100} color="#60a5fa" />
      <pointLight position={[startX, 5, 2]} intensity={2.0} distance={40} color="#ffffff" />
      <pointLight position={[-startX, 5, 2]} intensity={2.0} distance={40} color="#ffffff" />

      {WORD.split('').map((char, i) => (
        <group key={`ice-text-${i}`} position={[startX + i * spacing, 0, 0]}>
          <Text
            fontSize={11.0} 
            font="https://cdn.jsdelivr.net/gh/googlefonts/montserrat@master/fonts/ttf/Montserrat-Black.ttf"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.08}
            outlineColor="#f0f9ff"
          >
            {char}
            <meshPhysicalMaterial 
              color="#3b82f6" 
              transmission={0.4} 
              thickness={4.0}
              roughness={0.05}
              metalness={0.1}
              ior={1.4} 
              reflectivity={1.0}
              transparent
              opacity={0.85}
              envMapIntensity={2}
              clearcoat={0.8}
              clearcoatRoughness={0}
              emissive="#1e40af" 
              emissiveIntensity={0.5}
            />
          </Text>

          {/* Simplified Frost Dusting */}
          <group position={[0, 5.5, 0.2]}>
             <mesh position={[0, 0, 0]} scale={[3.5, 0.1, 0.5]} castShadow>
               <boxGeometry args={[1, 1, 1]} />
               <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.0} />
             </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};

export default IceText;
