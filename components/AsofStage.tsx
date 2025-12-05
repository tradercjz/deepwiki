
import React, { useRef } from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import { AsofStep } from '../hooks/useAsofLogic';
import { ASOF_X, COLORS } from '../constants';

interface AsofStageProps {
  progress: number;
  logic: AsofStep[];
  hoveredIndex: number | null;
  setHoveredIndex: (i: number | null) => void;
}

export const AsofStage: React.FC<AsofStageProps> = ({ progress, logic, hoveredIndex, setHoveredIndex }) => {
  const activeIndex = Math.min(Math.floor(progress), logic.length - 1);
  const transition = progress % 1;
  const currentStep = logic[activeIndex];

  // Layout Constants
  const TOP_Y = 3.5;   // X Row Height
  const BOTTOM_Y = -3.5; // Y Row Height
  const BLOCK_WIDTH = 1.4;
  const GAP = 0.2;
  const TOTAL_WIDTH = ASOF_X.length * (BLOCK_WIDTH + GAP);
  const START_X = -TOTAL_WIDTH / 2;

  // Helper to get X position of an index in the top row
  const getXPos = (idx: number) => START_X + idx * (BLOCK_WIDTH + GAP) + BLOCK_WIDTH / 2;

  return (
    <group position={[0, 0, 0]}>
      
      {/* 1. TOP TIER: Sorted X Row */}
      <group position={[0, TOP_Y, 0]}>
         <Text position={[0, 1.5, 0]} fontSize={0.5} color={COLORS.secondary} fontWeight="bold">
            Reference X (Sorted)
         </Text>
         {ASOF_X.map((val, i) => (
             <XBlock 
                key={i}
                x={getXPos(i)}
                val={val}
                index={i}
                // Highlight logic handled inside ScanLogic mostly, but we can pass active state if needed
                isMatch={currentStep && i === currentStep.targetIndex}
                isChecked={currentStep && i <= (currentStep.targetIndex + 1)} // Visually checked range
                transition={transition}
                stepTarget={currentStep ? currentStep.targetIndex : -2}
             />
         ))}
      </group>

      {/* 2. BOTTOM TIER: Active Query Y */}
      {currentStep && (
          <group position={[0, BOTTOM_Y, 0]}>
             <Text position={[0, -1.5, 0]} fontSize={0.5} color={COLORS.primary} fontWeight="bold">
                Query Y
             </Text>
             <ActiveYBlock 
                val={currentStep.yQuery}
                transition={transition}
             />
          </group>
      )}

      {/* 3. CENTER: Scanning Logic & Beam */}
      {currentStep && (
          <ScanAnimation 
             step={currentStep}
             transition={transition}
             getXPos={getXPos}
             topY={TOP_Y - 0.6} // Bottom of X block
             bottomY={BOTTOM_Y + 0.6} // Top of Y block
             xLength={ASOF_X.length}
          />
      )}

      {/* 4. RIGHT PANEL: Results Log */}
      <ResultLog 
         history={currentStep ? currentStep.outputHistory : []}
      />

    </group>
  );
};

// --- Sub-Components ---

const XBlock = ({ x, val, index, isMatch, isChecked, transition, stepTarget }: any) => {
    // Determine visual state based on scan progress
    // Scan phase: 0.2 -> 0.7
    
    let color = '#333';
    let glow = 0;
    let scaleVal = 1;

    // We calculate "scan index" based on transition
    const scanProgress = (transition - 0.2) / 0.5; // 0 to 1 during scan
    const currentScanIdx = Math.floor(scanProgress * (stepTarget + 2)); // Scan up to target+1 (the first fail) or just target

    // Logic for coloring
    if (transition > 0.2 && transition < 0.7) {
        if (index <= currentScanIdx) {
            // Currently being checked or passed
            if (index <= stepTarget) color = COLORS.primary; // Candidate
            else if (index === stepTarget + 1) color = COLORS.condFalse; // The failure point (X > Y)
        }
    } else if (transition >= 0.7) {
        // Result phase
        if (isMatch) {
            color = COLORS.success;
            glow = 2;
            scaleVal = 1.2;
        } else if (index === stepTarget + 1) {
            color = '#551111'; // Dim red for the boundary
        } else if (index <= stepTarget) {
            color = '#004411'; // Dim green for valid range
        }
    }

    const { scale, matColor, emissiveIntensity } = useSpring({
        scale: scaleVal,
        matColor: color,
        emissiveIntensity: glow,
        config: { tension: 200, friction: 20 }
    });

    return (
        <animated.group position={[x, 0, 0]} scale={scale}>
            <RoundedBox args={[1.4, 1.2, 0.5]} radius={0.1}>
                <animated.meshStandardMaterial color={matColor} emissive={matColor} emissiveIntensity={emissiveIntensity} />
            </RoundedBox>
            <Text position={[0, 0, 0.3]} fontSize={0.4} color="white" fontWeight="bold">
                {val}
            </Text>
            <Text position={[0, 0.9, 0]} fontSize={0.2} color="#888">
                {index}
            </Text>
        </animated.group>
    );
};

const ActiveYBlock = ({ val, transition }: any) => {
    // Appear animation
    const { scale } = useSpring({
        scale: transition < 0.1 ? 0 : 1,
        config: { tension: 200 }
    });

    return (
        <animated.group scale={scale}>
            <RoundedBox args={[2, 1.2, 0.5]} radius={0.2}>
                 <meshStandardMaterial color={COLORS.primary} emissive={COLORS.primary} emissiveIntensity={0.5} />
            </RoundedBox>
            <Text position={[0, 0, 0.3]} fontSize={0.5} color="white" fontWeight="bold">
                {val}
            </Text>
        </animated.group>
    );
};

const ScanAnimation = ({ step, transition, getXPos, topY, bottomY, xLength }: any) => {
    // Draw a line from Bottom Y to current X being checked
    
    if (transition < 0.2 || transition > 0.8) return null;

    const scanProgress = (transition - 0.2) / 0.5; // 0 to 1
    // We scan up to targetIndex + 1 (the first one that fails), or end of array
    const maxScanIdx = Math.min(xLength - 1, step.targetIndex + 1);
    const floatIdx = scanProgress * (maxScanIdx + 1); 
    const currentIdx = Math.min(maxScanIdx, Math.floor(floatIdx));

    // Calculate X position of the "Scanner Head" on the top row
    const targetX = getXPos(currentIdx);
    
    // Determine Color
    // If we are looking at an index <= targetIndex, it matches (Green)
    // If we are looking at index > targetIndex, it fails (Red)
    const isMatch = currentIdx <= step.targetIndex;
    const beamColor = isMatch ? COLORS.primary : COLORS.condFalse;

    return (
        <group>
            {/* The Beam */}
            <Line 
                points={[[0, bottomY, 0], [targetX, topY, 0]]}
                color={beamColor}
                lineWidth={3}
                transparent
                opacity={0.6}
            />
            
            {/* Logic Indicator at Top */}
            <group position={[targetX, topY - 0.5, 0]}>
                 <Text fontSize={0.3} color={beamColor} fontWeight="bold">
                     {isMatch ? "<=" : ">"}
                 </Text>
            </group>
        </group>
    );
};

const ResultLog = ({ history }: { history: any[] }) => {
    // Render on the right side
    return (
        <group position={[10, 0, 0]}>
            <Text position={[0, 4, 0]} fontSize={0.4} color={COLORS.secondary} fontWeight="bold" anchorX="center">
                Results
            </Text>
            {history.slice(-8).map((h, i) => { // Show last 8
                const y = 3 - i * 0.8;
                return (
                    <group key={i} position={[0, y, 0]}>
                        <Text position={[-1.5, 0, 0]} fontSize={0.25} color={COLORS.primary} anchorX="left">
                             Y={h.y}
                        </Text>
                        <Text position={[0, 0, 0]} fontSize={0.25} color="white" anchorX="center">
                             →
                        </Text>
                        <Text position={[1.5, 0, 0]} fontSize={0.25} color={COLORS.success} anchorX="right">
                             Idx: {h.index}
                        </Text>
                        <mesh position={[0, -0.3, 0]}>
                             <boxGeometry args={[3.5, 0.02, 0]} />
                             <meshBasicMaterial color="#333" />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
};
