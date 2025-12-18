
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SnowflakesProps {
  count?: number;
}

const Snowflakes: React.FC<SnowflakesProps> = ({ count = 3500 }) => {
  const mesh = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 140;
      positions[i * 3 + 1] = Math.random() * 45;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 140;
      
      velocities[i * 3] = 0.15 + Math.random() * 0.25;
      velocities[i * 3 + 1] = 0.08 + Math.random() * 0.15; 
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    }
    return { positions, velocities };
  }, [count]);

  useFrame(() => {
    if (!mesh.current) return;
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] += particles.velocities[i3];
      pos[i3 + 1] -= particles.velocities[i3 + 1];
      pos[i3 + 2] += particles.velocities[i3 + 2];

      if (pos[i3 + 1] < -5) {
        pos[i3 + 1] = 40;
        pos[i3] = (Math.random() - 0.5) * 140 - 20;
      }
      
      if (pos[i3] > 70) {
        pos[i3] = -70;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#ffffff"
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Snowflakes;
