
import React from 'react';
import { useSpring, animated } from '@react-spring/three';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS, SPACING } from '../constants';

interface OutputCubeProps {
  index: number;
  value: number | null;
  show: boolean;
  onHover: (i: number | null) => void;
  isHovered: boolean;
  source: 'reset' | 'iter' | 'calc' | undefined;
}

export const OutputCube: React.FC<OutputCubeProps> = ({ index, value, show, onHover, isHovered, source }) => {
  
  const isNull = value === null;
  
  // Color Mapping
  let color = '#444';
  if (!isNull) {
      if (source === 'reset') color = COLORS.condTrue;
      else if (source === 'iter') color = COLORS.gold;
      else if (source === 'calc') color = COLORS.success; // For TM/State series generic calculation
      else color = COLORS.success;
  }

  const { positionY, opacity, scale } = useSpring({
    positionY: show ? SPACING.yOutput : SPACING.yOutput + 2,
    opacity: show ? (isNull ? 0.5 : 1) : 0,
    scale: show ? (isHovered ? 1.2 : 1) : 0,
    config: { tension: 120, friction: 14 }
  });

  return (
    <animated.group 
      position-x={index * SPACING.x} 
      position-y={positionY}
      scale={scale}
      onPointerOver={() => onHover(index)}
      onPointerOut={() => onHover(null)}
    >
      <RoundedBox args={[1.2, 1.2, 1.2]} radius={0.05} smoothness={4}>
        <animated.meshStandardMaterial 
          color={isHovered ? '#fff' : color} 
          emissive={color}
          emissiveIntensity={isNull ? 0 : 0.4}
          roughness={0.3} 
          metalness={0.8}
          transparent
          opacity={opacity}
        />
      </RoundedBox>

      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.2, 1.2, 1.2)]} />
        <meshBasicMaterial color={color} />
      </lineSegments>

      <Text 
        position={[0, 0, 0.61]} 
        fontSize={isNull ? 0.3 : 0.5} 
        color={isNull ? '#aaa' : '#ffffff'}
        outlineWidth={0.03}
        outlineColor="#000000"
        fontWeight={800}
      >
        {isNull ? 'NULL' : value}
      </Text>
      
      {/* Source Label */}
      {!isNull && (
        <Text position={[0, -0.8, 0]} fontSize={0.15} color="#ccc">
            {source === 'reset' ? 'VAL1 (RESET)' : (source === 'iter' ? 'FUNC (ITER)' : '')}
        </Text>
      )}
    </animated.group>
  );
};
