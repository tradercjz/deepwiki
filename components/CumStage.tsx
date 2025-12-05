import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { CumStep } from '../hooks/useCumLogic';
import { COLORS, SPACING, CumFunc } from '../constants';

interface CumStageProps {
  progress: number;
  steps: CumStep[];
  func: CumFunc;
}

export const CumStage: React.FC<CumStageProps> = ({ progress, steps, func }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Determine if binary function
  const isBinary = [
    'cumwsum', 'cumwavg', 'cumcovar', 'cumcorr', 'cumbeta'
  ].includes(func);

  // If hovering, use that step. Otherwise, show all data without highlighting window.
  // We use the last step to get the full result vector.
  // Each step has the full input arrays, so any step works for inputs.
  const finalStep = steps[steps.length - 1];
  
  // Determine active step based on progress or hover
  const visibleCount = Math.floor(progress * steps.length);
  const currentStepIndex = visibleCount > 0 ? visibleCount - 1 : null;
  const activeStep = hoveredIndex !== null ? steps[hoveredIndex] : (currentStepIndex !== null ? steps[currentStepIndex] : null);

  useFrame((state) => {
    if (groupRef.current) {
      // Smooth rotation or floating effect if desired
      // groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  if (!finalStep) return null;

  return (
    <group ref={groupRef}>
      {/* Title */}
      <Text
        position={[0, 4, 0]}
        fontSize={0.5}
        color={COLORS.glass}
        anchorX="center"
        anchorY="middle"
      >
        {func.toUpperCase()} Visualization
      </Text>

      {/* Calculation Text */}
      <Text
        position={[0, 3, 0]}
        fontSize={0.4}
        color={COLORS.primary}
        anchorX="center"
        anchorY="middle"
      >
        {activeStep ? activeStep.calculation : 'Hover over a result to see calculation'}
      </Text>

      {/* Data Visualization */}
      <group position={[-SPACING.x * 2, 0, 0]}>
        {finalStep.inputX.map((val, idx) => {
          // Logic for highlighting based on activeStep
          let isCurrent = false;
          let isInWindow = false;

          if (activeStep) {
            isCurrent = idx === activeStep.index;
            isInWindow = idx <= activeStep.index;
          }
          
          // Color logic
          let color = COLORS.inactive;
          if (isCurrent) color = COLORS.gold;
          else if (isInWindow) color = COLORS.primary;
          else color = COLORS.inactive; 

          // If not hovering, show all as primary (visible)
          const finalColor = activeStep ? color : COLORS.primary;
          const finalOpacity = activeStep ? (isInWindow ? 1 : 0.3) : 0.8;
          const textColor = (finalColor === COLORS.inactive) ? COLORS.glass : 'black';

          return (
            <group key={`x-${idx}`} position={[idx * 1.2, 1, 0]}>
              {/* Cube */}
              <mesh>
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshStandardMaterial 
                  color={finalColor}
                  transparent
                  opacity={finalOpacity} 
                />
              </mesh>
              {/* Value Text */}
              <Text
                position={[0, 0, 1]} // Slightly in front
                fontSize={0.3}
                color={textColor}
                anchorX="center"
                anchorY="middle"
              >
                {val}
              </Text>
              {/* Label */}
              {idx === 0 && (
                <Text position={[-1.5, 0, 0]} fontSize={0.3} color={COLORS.glass}>
                  X
                </Text>
              )}
            </group>
          );
        })}

        {/* Y Row (Binary) */}
        {isBinary && finalStep.inputY.map((val, idx) => {
          let isCurrent = false;
          let isInWindow = false;

          if (activeStep) {
            isCurrent = idx === activeStep.index;
            isInWindow = idx <= activeStep.index;
          }

          let color = COLORS.inactive;
          if (isCurrent) color = COLORS.gold;
          else if (isInWindow) color = COLORS.secondary;
          else color = COLORS.inactive;

          const finalColor = activeStep ? color : COLORS.secondary;
          const finalOpacity = activeStep ? (isInWindow ? 1 : 0.3) : 0.8;
          const textColor = (finalColor === COLORS.inactive) ? COLORS.glass : 'black';

          return (
            <group key={`y-${idx}`} position={[idx * 1.2, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshStandardMaterial 
                  color={finalColor}
                  transparent
                  opacity={finalOpacity}
                />
              </mesh>
              <Text
                position={[0, 0, 1]}
                fontSize={0.3}
                color={textColor}
                anchorX="center"
                anchorY="middle"
              >
                {val}
              </Text>
              {idx === 0 && (
                <Text position={[-1.5, 0, 0]} fontSize={0.3} color={COLORS.glass}>
                  Y
                </Text>
              )}
            </group>
          );
        })}
      </group>

      {/* Result Vector */}
      <group position={[-SPACING.x * 2, -2.5, 0]}>
        {finalStep.resultVector.slice(0, Math.floor(progress * steps.length)).map((val, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <group 
                key={`res-${idx}`} 
                position={[idx * 1.2, 0, 0]}
                onPointerOver={(e) => { e.stopPropagation(); setHoveredIndex(idx); }}
                onPointerOut={(e) => { e.stopPropagation(); setHoveredIndex(null); }}
              >
                <mesh scale={isHovered ? 1.2 : 1}>
                  <sphereGeometry args={[0.3, 32, 32]} />
                  <meshStandardMaterial color={isHovered ? COLORS.gold : COLORS.success} />
                </mesh>
                <Text
                  position={[0, -0.5, 0]}
                  fontSize={0.25}
                  color={COLORS.glass}
                  anchorX="center"
                  anchorY="top"
                >
                  {val}
                </Text>
                {idx === 0 && (
                  <Text position={[-1.5, 0, 0]} fontSize={0.3} color={COLORS.glass}>
                    Result
                  </Text>
                )}
              </group>
            );
        })}
      </group>
    </group>
  );
};
