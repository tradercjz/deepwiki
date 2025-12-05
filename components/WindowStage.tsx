import React from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { WindowStep } from '../hooks/useWindowLogic';
import { COLORS } from '../constants';
import * as THREE from 'three';

interface WindowStageProps {
  progress: number;
  steps: WindowStep[];
  range: [number, number];
}

export const WindowStage: React.FC<WindowStageProps> = ({ progress, steps, range }) => {
  const BLOCK_WIDTH = 1.2;
  const GAP = 0.2;
  const TOTAL_WIDTH = steps.length * (BLOCK_WIDTH + GAP);
  const START_X = -TOTAL_WIDTH / 2 + BLOCK_WIDTH / 2;

  const getX = (idx: number) => START_X + idx * (BLOCK_WIDTH + GAP);

  if (steps.length === 0) return null;

  const currentStepIdx = Math.max(0, Math.min(Math.floor(progress), steps.length - 1));
  const currentStep = steps[currentStepIdx];
  
  if (!currentStep) return null;

  const transition = progress % 1;

  // Window Position Calculation
  // The window covers [i+d1, i+d2]
  // We want to animate the window sliding.
  // Interpolate index from progress.
  const smoothIdx = Math.min(progress, steps.length - 1);
  const windowStartIdx = smoothIdx + range[0];
  const windowEndIdx = smoothIdx + range[1];
  
  const windowStartX = getX(windowStartIdx) - BLOCK_WIDTH/2;
  const windowEndX = getX(windowEndIdx) + BLOCK_WIDTH/2;
  const windowCenter = (windowStartX + windowEndX) / 2;
  const windowWidth = Math.max(0, windowEndX - windowStartX);

  return (
    <group position={[0, 0, 0]}>
        <Text position={[0, 4.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            window(func, x, {range[0]}:{range[1]})
        </Text>

        {/* Input Array */}
        {steps.map((step, idx) => {
            const isCurrent = idx === currentStepIdx;
            const isInWindow = currentStep.windowIndices.includes(idx);
            
            return (
                <InputItem 
                    key={`input-${idx}`}
                    val={step.inputValue}
                    x={getX(idx)}
                    isCurrent={isCurrent}
                    isInWindow={isInWindow}
                />
            );
        })}

        {/* Sliding Window Overlay */}
        <group position={[windowCenter, 0, 0]}>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[windowWidth, 1.4, 1.4]} />
                <meshBasicMaterial color={COLORS.secondary} transparent opacity={0.2} depthWrite={false} />
            </mesh>
            <Line 
                points={[
                    [-windowWidth/2, 0.7, 0.7], [windowWidth/2, 0.7, 0.7],
                    [windowWidth/2, 0.7, 0.7], [windowWidth/2, -0.7, 0.7],
                    [windowWidth/2, -0.7, 0.7], [-windowWidth/2, -0.7, 0.7],
                    [-windowWidth/2, -0.7, 0.7], [-windowWidth/2, 0.7, 0.7],
                ]}
                color={COLORS.secondary}
                lineWidth={2}
            />
            <Text position={[0, 1.0, 0]} fontSize={0.2} color={COLORS.secondary}>
                Window
            </Text>
        </group>

        {/* Current Index Indicator */}
        <group position={[getX(smoothIdx), 1.5, 0]}>
            <mesh rotation={[0, 0, Math.PI]}>
                <coneGeometry args={[0.2, 0.4, 4]} />
                <meshStandardMaterial color={COLORS.primary} />
            </mesh>
            <Text position={[0, 0.5, 0]} fontSize={0.2} color={COLORS.primary}>
                Current (i)
            </Text>
        </group>

        {/* Calculation Text */}
        <group position={[0, 2.5, 0]}>
             <Text fontSize={0.4} color={COLORS.gold}>
                {currentStep.calcStr}
             </Text>
        </group>

        {/* Labels */}
        <Text position={[START_X - 2, 0, 0]} fontSize={0.4} color="#aaa" anchorX="right">
            Input
        </Text>
        <Text position={[START_X - 2, -2, 0]} fontSize={0.4} color="#aaa" anchorX="right">
            Output
        </Text>

        {/* Result Array */}
        {steps.map((step, idx) => {
            // Show result if we passed this step
            const show = progress > idx + 0.5; // Delay appearance slightly
            
            return (
                <ResultItem 
                    key={`result-${idx}`}
                    val={step.result}
                    x={getX(idx)}
                    show={show}
                />
            );
        })}

    </group>
  );
};

interface InputItemProps {
    val: number | null;
    x: number;
    isCurrent: boolean;
    isInWindow: boolean;
}

const InputItem: React.FC<InputItemProps> = ({ val, x, isCurrent, isInWindow }) => {
    const { scale, color } = useSpring({
        scale: isCurrent ? 1.1 : 1,
        color: isCurrent ? COLORS.primary : (isInWindow ? COLORS.secondary : '#555'),
        config: { tension: 200 }
    });

    return (
        <animated.group position={[x, 0, 0]} scale={scale}>
            <RoundedBox args={[1, 1, 1]} radius={0.1}>
                <animated.meshStandardMaterial color={color} />
            </RoundedBox>
            <Text position={[0, 0, 0.6]} fontSize={0.4} color="white" fontWeight="bold">
                {val === null ? 'NULL' : val}
            </Text>
            <Text position={[0, -0.8, 0]} fontSize={0.15} color="#888">
                {isCurrent ? 'i' : ''}
            </Text>
        </animated.group>
    );
};

interface ResultItemProps {
    val: number | null;
    x: number;
    show: boolean;
}

const ResultItem: React.FC<ResultItemProps> = ({ val, x, show }) => {
    const { scale } = useSpring({
        scale: show ? 1 : 0.8,
        config: { tension: 200 }
    });

    return (
        <group position={[x, -2, 0]}>
            {/* Placeholder box */}
            <RoundedBox args={[1, 1, 1]} radius={0.1}>
                <meshStandardMaterial color="#333" transparent opacity={0.3} />
            </RoundedBox>
            
            {/* Actual result */}
            <animated.group scale={scale} visible={show}>
                <RoundedBox args={[1, 1, 1]} radius={0.1}>
                    <meshStandardMaterial color={COLORS.success} />
                </RoundedBox>
                <Text position={[0, 0, 0.6]} fontSize={0.4} color="black" fontWeight="bold">
                    {val === null ? 'NULL' : val}
                </Text>
            </animated.group>
        </group>
    );
};
