import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { Trail, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS, SPACING } from '../constants';

interface StateOrbProps {
  progress: number;
  currentResult: number;
  nextResult: number | null;
  visible: boolean;
}

export const StateOrb: React.FC<StateOrbProps> = ({ progress, currentResult, visible }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Logic: 
  // At integer index i, the orb represents the Calculated Term from State (IterateFunc(Y))
  // It moves from index i to index i+1?
  // Actually, to visualize the flow:
  // We calculated Y[i]. Now IterateFunc takes Y[i] (and others) to produce a value for Y[i+1].
  // So the Orb flies from i to i+1.
  
  const { xPos, scale } = useSpring({
    xPos: progress * SPACING.x,
    scale: visible ? 1 : 0,
    config: { tension: 120, friction: 20 }
  });

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.scale.setScalar((visible ? 0.4 : 0) + Math.sin(t * 5) * 0.05);
    }
  });

  return (
    <animated.group position-x={xPos} position-y={0} position-z={0}>
        <Trail
          width={0.4}
          length={4}
          color={COLORS.gold}
          attenuation={(t) => t * t}
        >
          <Sphere ref={meshRef} args={[0.4, 32, 32]}>
            <meshStandardMaterial 
              color={COLORS.gold} 
              emissive={COLORS.gold}
              emissiveIntensity={2}
              toneMapped={false}
            />
          </Sphere>
        </Trail>
        
        {/* Floating Value - The value being carried forward */}
        {visible && (
            <pointLight distance={3} intensity={5} color={COLORS.gold} />
        )}
    </animated.group>
  );
};