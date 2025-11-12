import React, { useRef } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

import vertexShader from '../shaders/vertexShader.glsl?raw';
import fragmentShader from '../shaders/fragmentShader.glsl?raw';

// ✨ Renamed for clarity and updated uniforms
const GlassCurveMaterial = shaderMaterial(
  {
    u_time: 0,
    // ✨ Only one color is needed now, for the curves themselves
    u_color: new THREE.Color('#81D4FA'), // A nice light blue
  },
  vertexShader,
  fragmentShader
);

extend({ GlassCurveMaterial });

const ShaderPlane = () => {
  const material = useRef<any>();

  useFrame((state) => {
    if (material.current) {
      material.current.uniforms.u_time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh>
      {/* PlaneGeometry args: width, height, widthSegments, heightSegments */}
      {/* We don't need many segments for a shader plane */}
      <planeGeometry args={[10, 5, 1, 1]} />
      {/* @ts-ignore */}
      <glassCurveMaterial ref={material} />
    </mesh>
  );
};

// ✨ Renamed the component for clarity
export const GlassCurvesBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full z-[-10] bg-[#020617]"> {/* A solid dark blue fallback bg */}
      <Canvas camera={{ position: [0, 0, 1.5] }}>
        <ShaderPlane />
      </Canvas>
    </div>
  );
};