
import React from 'react';
import { useSpring, animated } from '@react-spring/three';
import { Text, RoundedBox } from '@react-three/drei';
import { COLORS, SPACING } from '../constants';

interface InputCubeProps {
  index: number;
  value: number;
  time: number;
  threshold: number;
  isConditionMet: boolean;
  isActive: boolean;
  showTimeBadge?: boolean;
}

export const InputCube: React.FC<InputCubeProps> = ({ 
  index, 
  value, 
  time, 
  threshold, 
  isConditionMet, 
  isActive, 
  showTimeBadge = true 
}) => {
  
  // Logic: 
  // If active, show color based on condition met/not met.
  // If not active, show neutral or result of check if already processed.
  
  const baseColor = isActive 
    ? (isConditionMet ? COLORS.condTrue : COLORS.condFalse)
    : (isConditionMet ? '#004411' : '#441111');

  const { scale, color, emissiveIntensity } = useSpring({
    scale: isActive ? 1.1 : 1,
    color: baseColor,
    emissiveIntensity: isActive ? 2 : 0.5,
    config: { tension: 200, friction: 20 }
  });

  return (
    <group position={[index * SPACING.x, SPACING.yInput, 0]}>
      <animated.mesh scale={scale}>
        <RoundedBox args={[1.2, 1.2, 1.2]} radius={0.1} smoothness={4}>
          <meshPhysicalMaterial 
            transparent 
            opacity={0.9} 
            roughness={0.2}
            metalness={0.1}
            transmission={0.6}
            thickness={2} 
          />
          <animated.meshStandardMaterial 
            attach="material" 
            color={color} 
            emissive={color}
            emissiveIntensity={emissiveIntensity}
            toneMapped={false}
            wireframe
          />
        </RoundedBox>
      </animated.mesh>
      
      {/* Time Badge (Top) - Conditional */}
      {showTimeBadge && (
        <group position={[0, 0.8, 0]}>
           <mesh>
              <planeGeometry args={[0.8, 0.3]} />
              <meshBasicMaterial color="#000" transparent opacity={0.8} />
           </mesh>
           <Text position={[0, 0, 0.01]} fontSize={0.15} color="#00f0ff" fontWeight="bold">
              T={time}
           </Text>
        </group>
      )}
      
      {/* Floating Value (val0) */}
      <Text 
        position={[0, 0, 0.7]} 
        fontSize={0.5} 
        color="white" 
        font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff" 
        outlineWidth={0.02}
        outlineColor="#000"
      >
        {value}
      </Text>
      
      {/* Condition Status Label */}
      <Text 
        position={[0, -0.8, 0]} 
        fontSize={0.18} 
        color={isConditionMet ? COLORS.condTrue : COLORS.condFalse} 
      >
        {value} &gt; {threshold}? {isConditionMet ? 'YES' : 'NO'}
      </Text>
    </group>
  );
};