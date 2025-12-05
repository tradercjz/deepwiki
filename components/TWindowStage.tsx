import React, { useState } from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { TWindowStep } from '../hooks/useTWindowLogic';
import { COLORS } from '../constants';
import * as THREE from 'three';

interface TWindowStageProps {
  progress: number;
  steps: TWindowStep[];
  range: [number, number];
}

export const TWindowStage: React.FC<TWindowStageProps> = ({ progress, steps, range }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const BLOCK_WIDTH = 1.2;
  const GAP = 0.2;
  const TOTAL_WIDTH = steps.length * (BLOCK_WIDTH + GAP);
  const START_X = -TOTAL_WIDTH / 2 + BLOCK_WIDTH / 2;

  const getX = (idx: number) => START_X + idx * (BLOCK_WIDTH + GAP);

  if (steps.length === 0) return null;

  // Determine which step to visualize: hovered or current animation step
  const animationStepIdx = Math.max(0, Math.min(Math.floor(progress), steps.length - 1));
  const activeStepIdx = hoveredIdx !== null ? hoveredIdx : animationStepIdx;
  
  const activeStep = steps[activeStepIdx];
  
  if (!activeStep) return null;

  const smoothIdx = Math.min(progress, steps.length - 1);

  const windowStartVal = activeStep.windowRange[0];
  const windowEndVal = activeStep.windowRange[1];

  return (
    <group position={[0, 0, 0]}>
        <Text position={[0, 4.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            twindow(func, x, T, {range[0]}:{range[1]})
        </Text>

        {/* Labels */}
        <Text position={[START_X - 2, 1.5, 0]} fontSize={0.4} color="#aaa" anchorX="right">
            T
        </Text>
        <Text position={[START_X - 2, 0, 0]} fontSize={0.4} color="#aaa" anchorX="right">
            X
        </Text>
        <Text position={[START_X - 2, -2, 0]} fontSize={0.4} color="#aaa" anchorX="right">
            Result
        </Text>

        {/* T Array */}
        {steps.map((step, idx) => {
            const isCurrent = idx === activeStepIdx;
            const isInWindow = activeStep.windowIndices.includes(idx);
            
            return (
                <TItem 
                    key={`t-${idx}`}
                    val={step.tValue}
                    x={getX(idx)}
                    isCurrent={isCurrent}
                    isInWindow={isInWindow}
                />
            );
        })}

        {/* X Array (Input) */}
        {steps.map((step, idx) => {
            const isCurrent = idx === activeStepIdx;
            const isInWindow = activeStep.windowIndices.includes(idx);
            
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

        {/* Current Index Indicator (Only show during animation or if hovered matches) */}
        <group position={[getX(hoveredIdx !== null ? hoveredIdx : smoothIdx), 2.8, 0]}>
            <mesh rotation={[0, 0, Math.PI]}>
                <coneGeometry args={[0.2, 0.4, 4]} />
                <meshStandardMaterial color={COLORS.primary} />
            </mesh>
            <Text position={[0, 0.5, 0]} fontSize={0.2} color={COLORS.primary}>
                Current (Ti={activeStep.tValue})
            </Text>
        </group>

        {/* Window Range Indicator */}
        <group position={[0, 3.5, 0]}>
             <Text fontSize={0.3} color={COLORS.secondary}>
                Window Range: [{windowStartVal}, {windowEndVal}]
             </Text>
        </group>

        {/* Calculation Text */}
        <group position={[0, -3.5, 0]}>
             <Text fontSize={0.4} color={COLORS.gold}>
                {activeStep.calcStr}
             </Text>
        </group>

        {/* Result Array */}
        {steps.map((step, idx) => {
            const show = progress > idx + 0.5;
            
            return (
                <ResultItem 
                    key={`result-${idx}`}
                    val={step.result}
                    x={getX(idx)}
                    show={show}
                    onHover={(hovering) => setHoveredIdx(hovering ? idx : null)}
                />
            );
        })}

    </group>
  );
};

interface ItemProps {
    val: number | null;
    x: number;
    isCurrent: boolean;
    isInWindow: boolean;
}

const TItem: React.FC<ItemProps> = ({ val, x, isCurrent, isInWindow }) => {
    const { scale, color } = useSpring({
        scale: isCurrent ? 1.1 : 1,
        color: isInWindow ? COLORS.secondary : (isCurrent ? COLORS.primary : '#555'),
        config: { tension: 200 }
    });

    return (
        <animated.group position={[x, 1.5, 0]} scale={scale}>
            <RoundedBox args={[1, 1, 1]} radius={0.1}>
                <animated.meshStandardMaterial color={color} />
            </RoundedBox>
            <Text position={[0, 0, 0.6]} fontSize={0.4} color="white" fontWeight="bold">
                {val}
            </Text>
        </animated.group>
    );
};

const InputItem: React.FC<ItemProps> = ({ val, x, isCurrent, isInWindow }) => {
    const { scale, color } = useSpring({
        scale: isCurrent ? 1.1 : 1,
        color: isInWindow ? COLORS.secondary : '#333', // Only highlight if in window
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
        </animated.group>
    );
};

interface ResultItemProps {
    val: number | null;
    x: number;
    show: boolean;
    onHover: (hovering: boolean) => void;
}

const ResultItem: React.FC<ResultItemProps> = ({ val, x, show, onHover }) => {
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
            <animated.group 
                scale={scale} 
                visible={show}
                onPointerOver={() => onHover(true)}
                onPointerOut={() => onHover(false)}
            >
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
