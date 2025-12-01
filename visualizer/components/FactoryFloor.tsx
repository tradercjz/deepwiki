
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Grid, Plane } from '@react-three/drei';
import * as THREE from 'three';

export const FactoryFloor = () => {
  const gridRef = useRef<any>(null);

  useFrame((state, delta) => {
    // Scroll the floor to simulate flow direction
    if (gridRef.current) {
      gridRef.current.position.x = (state.clock.elapsedTime * 0.5) % 2;
    }
  });

  return (
    <group position={[0, -8, 0]}>
       {/* Scrolling Grid */}
      <group ref={gridRef}>
        <Grid 
          position={[0, 0.01, 0]} 
          args={[100, 20]} 
          cellColor="#1a1a1a" 
          sectionColor="#00f0ff" 
          fadeDistance={30}
          sectionSize={2.5}
          cellSize={0.5}
          infiniteGrid
        />
      </group>
      
      {/* Reflective Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 40]} />
        <meshStandardMaterial 
            color="#050505" 
            roughness={0.1} 
            metalness={0.8} 
        />
      </mesh>
    </group>
  );
};
