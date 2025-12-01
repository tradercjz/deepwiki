
import React from 'react';
import { useSpring, animated } from '@react-spring/three';
import { Text } from '@react-three/drei';
import { COLORS, SPACING } from '../constants';

interface TimeNodeProps {
  index: number;
  time: number;
  isActive: boolean; // Is currently determining the window
  isInWindow: boolean; // Is part of the current active window
  windowSize?: number;
}

export const TimeNode: React.FC<TimeNodeProps> = ({ index, time, isActive, isInWindow, windowSize }) => {
  
  // Visual Logic:
  // Active: The Time Node at the current processing head (T)
  // InWindow: A Time Node that falls within (T-window, T]
  
  const color = isActive ? '#ffffff' : (isInWindow ? COLORS.time : '#553377');
  
  const { scale, positionY, glow } = useSpring({
    scale: isActive ? 1.3 : (isInWindow ? 1.1 : 1),
    positionY: SPACING.yTime + (isActive ? 0.2 : 0),
    glow: isActive ? 2 : (isInWindow ? 1 : 0.2),
    config: { tension: 200, friction: 20 }
  });

  return (
    <animated.group position-x={index * SPACING.x} position-y={positionY}>
      
      {/* Connector to Input (Visualizing the T -> X link) */}
      <mesh position={[0, -1.2, 0]}>
         <cylinderGeometry args={[0.05, 0.05, 2.4]} />
         <meshBasicMaterial color={COLORS.time} transparent opacity={0.2} />
      </mesh>

      {/* The Node Geometry */}
      <animated.mesh scale={scale}>
        <octahedronGeometry args={[0.5, 0]} />
        <animated.meshStandardMaterial 
            color={color} 
            emissive={COLORS.time}
            emissiveIntensity={glow}
            roughness={0.2}
            metalness={0.8}
        />
      </animated.mesh>
      
      {/* Label */}
      <Text 
        position={[0, 0.8, 0]} 
        fontSize={0.4} 
        color={color} 
        fontWeight="bold"
        outlineWidth={0.02}
        outlineColor="#000"
      >
        T={time}
      </Text>

      {/* Window Range Indicator (Only when Active) */}
      {isActive && windowSize !== undefined && (
        <group position={[0, 1.5, 0]}>
             <Text fontSize={0.25} color="#00f0ff" outlineWidth={0.02} outlineColor="#000">
                Window ({time - windowSize}, {time}]
             </Text>
        </group>
      )}
      
    </animated.group>
  );
};
