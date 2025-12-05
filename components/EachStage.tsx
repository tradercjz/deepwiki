
import React, { useMemo } from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { EachStep } from '../hooks/useEachLogic';
import { EACH_DATA_X, EACH_DATA_Y, COLORS } from '../constants';
import * as THREE from 'three';

interface EachStageProps {
  progress: number;
  logic: EachStep[];
  mode: 'left' | 'right';
}

export const EachStage: React.FC<EachStageProps> = ({ progress, logic, mode }) => {
  // Fix for end-of-animation visibility
  // If progress equals total steps, we consider the last step fully complete (transition = 1)
  const isFinished = progress >= logic.length;
  const activeIndex = Math.min(Math.floor(progress), logic.length - 1);
  const transition = isFinished ? 1.0 : (progress % 1);
  
  const currentStep = logic[activeIndex];

  // Layout Constants
  const CELL_SIZE = 1.8;
  const MATRIX_X = 2;
  const MATRIX_Y = 0;
  
  // Grid Dimensions
  const rows = EACH_DATA_Y.length;
  const cols = EACH_DATA_X.length;
  
  // Axis Positions
  const TOP_AXIS_Y = MATRIX_Y + (rows/2 * CELL_SIZE) + 1.5;
  const LEFT_AXIS_X = MATRIX_X - (cols/2 * CELL_SIZE) - 2.5;

  const getCellPos = (r: number, c: number) => {
      const x = MATRIX_X + (c - (cols-1)/2) * CELL_SIZE;
      const y = MATRIX_Y - (r - (rows-1)/2) * CELL_SIZE;
      return new THREE.Vector3(x, y, 0);
  };

  const getAxisXPos = (c: number) => getCellPos(0, c).x;
  const getAxisYPos = (r: number) => getCellPos(r, 0).y;

  return (
    <group position={[0, 0, 0]}>
        {/* Title */}
        <Text position={[0, 5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            {mode === 'left' ? "eachLeft (:L)" : "eachRight (:R)"}
        </Text>

        {/* Top Row (X Axis) */}
        <group>
             <Text position={[MATRIX_X, TOP_AXIS_Y + 1, 0]} fontSize={0.4} color={COLORS.primary}>
                 X Vector
             </Text>
             {EACH_DATA_X.map((val, i) => (
                 <AxisBlock 
                    key={`x-${i}`}
                    val={val}
                    pos={new THREE.Vector3(getAxisXPos(i), TOP_AXIS_Y, 0)}
                    isActive={mode === 'left' && i === currentStep.index}
                    color={COLORS.primary}
                 />
             ))}
        </group>

        {/* Left Column (Y Axis) */}
        <group>
             <Text position={[LEFT_AXIS_X - 1, MATRIX_Y, 0]} fontSize={0.4} color={COLORS.secondary} rotation={[0, 0, Math.PI/2]}>
                 Y Vector
             </Text>
             {EACH_DATA_Y.map((val, i) => (
                 <AxisBlock 
                    key={`y-${i}`}
                    val={val}
                    pos={new THREE.Vector3(LEFT_AXIS_X, getAxisYPos(i), 0)}
                    isActive={mode === 'right' && i === currentStep.index}
                    color={COLORS.secondary}
                 />
             ))}
        </group>

        {/* The Matrix */}
        <group>
            {logic.flatMap((step, stepIdx) => 
                step.results.map((res) => {
                    // Visibility Logic:
                    // 1. Previous steps: Always visible
                    // 2. Current step: Visible after transition > 0.5
                    // 3. Finished: All visible
                    const isVisible = stepIdx < activeIndex || (stepIdx === activeIndex && transition > 0.5);
                    const pos = getCellPos(res.row, res.col);
                    return (
                        <ResultCell 
                            key={`res-${res.row}-${res.col}`}
                            val={res.val}
                            pos={pos}
                            visible={isVisible}
                        />
                    );
                })
            )}
        </group>

        {/* Broadcast Beams */}
        {/* Only show beams if not finished (or fade out at end) */}
        {mode === 'left' && !isFinished && (
             <BroadcastBeam 
                sourcePos={new THREE.Vector3(getAxisXPos(currentStep.index), TOP_AXIS_Y - 0.6, 0)}
                targets={EACH_DATA_Y.map((_, r) => getCellPos(r, currentStep.index))}
                progress={transition}
                color={COLORS.primary}
             />
        )}
        
        {mode === 'right' && !isFinished && (
             <BroadcastBeam 
                sourcePos={new THREE.Vector3(LEFT_AXIS_X + 0.6, getAxisYPos(currentStep.index), 0)}
                targets={EACH_DATA_X.map((_, c) => getCellPos(currentStep.index, c))}
                progress={transition}
                color={COLORS.secondary}
             />
        )}

    </group>
  );
};

const AxisBlock = ({ val, pos, isActive, color }: any) => {
    const { scale, glow } = useSpring({
        scale: isActive ? 1.2 : 1,
        glow: isActive ? 2 : 0,
        config: { tension: 200 }
    });

    return (
        <animated.group position={pos} scale={scale}>
            <RoundedBox args={[1.2, 1.2, 0.4]} radius={0.1}>
                 <animated.meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} />
            </RoundedBox>
            <Text position={[0, 0, 0.3]} fontSize={0.5} color="white" fontWeight="bold">
                {val}
            </Text>
        </animated.group>
    );
};

const ResultCell = ({ val, pos, visible }: any) => {
    const { scale, opacity } = useSpring({
        scale: visible ? 1 : 0,
        opacity: visible ? 1 : 0,
        config: { tension: 200 }
    });

    return (
        <animated.group position={pos} scale={scale}>
            <RoundedBox args={[1.5, 1.5, 0.2]} radius={0.1}>
                 <animated.meshStandardMaterial color={COLORS.success} transparent opacity={opacity} />
            </RoundedBox>
            <mesh>
                 <boxGeometry args={[1.52, 1.52, 0.22]} />
                 <animated.meshBasicMaterial color={COLORS.success} wireframe transparent opacity={opacity} />
            </mesh>
            <Text position={[0, 0, 0.2]} fontSize={0.5} color="white" fontWeight="bold">
                {val}
            </Text>
        </animated.group>
    );
};

const BroadcastBeam = ({ sourcePos, targets, progress, color }: any) => {
    // 0.0 - 0.5: Shoot out
    // 0.5 - 1.0: Hold/Fade
    if (progress > 0.9) return null;

    const t = Math.min(1, progress / 0.5);

    return (
        <group>
            {targets.map((target: THREE.Vector3, i: number) => {
                const endPos = new THREE.Vector3().lerpVectors(sourcePos, target, t);
                return (
                    <Line 
                        key={i}
                        points={[sourcePos, endPos]}
                        color={color}
                        lineWidth={2}
                        transparent
                        opacity={1 - progress}
                    />
                )
            })}
        </group>
    );
};
