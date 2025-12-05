
import React from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { EachPairStep } from '../hooks/useEachPairLogic';
import { EACH_PRE_X, COLORS } from '../constants';
import * as THREE from 'three';

interface EachPairStageProps {
  progress: number;
  logic: EachPairStep[];
  mode: 'pre' | 'post';
}

export const EachPairStage: React.FC<EachPairStageProps> = ({ progress, logic, mode }) => {
  // Fix for end-of-animation visibility
  const isFinished = progress >= logic.length;
  const activeIndex = Math.min(Math.floor(progress), logic.length - 1);
  const transition = isFinished ? 1.0 : (progress % 1);
  const currentStep = logic[activeIndex];

  // Layout
  const ITEM_WIDTH = 2.0;
  const TOTAL_WIDTH = EACH_PRE_X.length * ITEM_WIDTH;
  const START_X = -TOTAL_WIDTH / 2 + ITEM_WIDTH / 2;
  const INPUT_Y = 0;
  const OUTPUT_Y = 3.5;

  const getX = (i: number) => START_X + i * ITEM_WIDTH;

  return (
    <group position={[0, -1, 0]}>
        <Text position={[0, 5.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            {mode === 'pre' ? "eachPre (:P)" : "eachPost (:O)"}
        </Text>

        {/* Output Row */}
        <group>
            <Text position={[0, OUTPUT_Y + 1, 0]} fontSize={0.3} color={COLORS.success}>
                Result
            </Text>
            {logic.map((step, i) => (
                <ResultNode 
                    key={`res-${i}`}
                    val={step.result}
                    x={getX(i)}
                    y={OUTPUT_Y}
                    visible={i < activeIndex || (i === activeIndex && transition > 0.8) || isFinished}
                />
            ))}
        </group>

        {/* Input Row + Boundaries */}
        <group>
            {/* Main Data */}
            {EACH_PRE_X.map((val, i) => (
                <InputNode 
                    key={`in-${i}`}
                    val={val}
                    x={getX(i)}
                    isActive={i === activeIndex}
                />
            ))}

            {/* Boundary Nodes */}
            {mode === 'pre' && (
                <BoundaryNode 
                    val="Pre" 
                    x={getX(-1)} 
                    isActive={activeIndex === 0} 
                />
            )}
            {mode === 'post' && (
                <BoundaryNode 
                    val="Post" 
                    x={getX(EACH_PRE_X.length)} 
                    isActive={activeIndex === EACH_PRE_X.length - 1} 
                />
            )}
        </group>

        {/* Animation Bracket & Beams */}
        {!isFinished && (
            <PairAnimation 
                step={currentStep}
                transition={transition}
                mode={mode}
                getX={getX}
                inputY={INPUT_Y}
                outputY={OUTPUT_Y}
            />
        )}

    </group>
  );
};

// Sub-components

const InputNode = ({ val, x, isActive }: any) => {
    const { scale, color } = useSpring({
        scale: isActive ? 1.2 : 1,
        color: isActive ? COLORS.primary : '#444',
        config: { tension: 200 }
    });

    return (
        <animated.group position={[x, 0, 0]} scale={scale}>
            <RoundedBox args={[1.5, 1.2, 0.5]} radius={0.1}>
                <animated.meshStandardMaterial color={color} />
            </RoundedBox>
            <Text position={[0, 0, 0.3]} fontSize={0.5} color="white" fontWeight="bold">
                {val}
            </Text>
        </animated.group>
    );
};

const BoundaryNode = ({ val, x, isActive }: any) => {
    const { scale } = useSpring({
        scale: isActive ? 1.2 : 1,
        config: { tension: 200 }
    });

    return (
        <animated.group position={[x, 0, 0]} scale={scale}>
            <RoundedBox args={[1.5, 1.2, 0.5]} radius={0.1}>
                <meshStandardMaterial color="#553377" transparent opacity={0.5} />
            </RoundedBox>
            <mesh>
                 <boxGeometry args={[1.52, 1.22, 0.52]} />
                 <meshBasicMaterial color="#775599" wireframe />
            </mesh>
            <Text position={[0, 0, 0.3]} fontSize={0.3} color="#cc99ff" fontWeight="bold">
                {val}
            </Text>
        </animated.group>
    );
};

const ResultNode = ({ val, x, y, visible }: any) => {
    const { scale, opacity } = useSpring({
        scale: visible ? 1 : 0,
        opacity: visible ? 1 : 0,
        config: { tension: 200 }
    });

    return (
        <animated.group position={[x, y, 0]} scale={scale}>
            <RoundedBox args={[1.5, 1.2, 0.5]} radius={0.1}>
                <animated.meshStandardMaterial color={COLORS.success} transparent opacity={opacity} />
            </RoundedBox>
            <Text position={[0, 0, 0.3]} fontSize={0.5} color="white" fontWeight="bold">
                {val}
            </Text>
        </animated.group>
    );
};

const PairAnimation = ({ step, transition, mode, getX, inputY, outputY }: any) => {
    // Determine positions of the two operands
    const currentX = getX(step.index);
    let partnerX = 0;

    if (mode === 'pre') {
        partnerX = getX(step.index - 1);
    } else {
        partnerX = getX(step.index + 1);
    }

    const minX = Math.min(currentX, partnerX);
    const maxX = Math.max(currentX, partnerX);
    const midX = (minX + maxX) / 2;
    const width = maxX - minX + 1.5; // Cover both blocks

    // Bracket visual
    // Beams shooting up
    
    return (
        <group>
            {/* The Bracket */}
            <group position={[midX, inputY - 0.8, 0]}>
                <mesh>
                    <boxGeometry args={[width, 0.1, 0.1]} />
                    <meshBasicMaterial color={COLORS.gold} />
                </mesh>
                <mesh position={[-width/2, 0.2, 0]}>
                    <boxGeometry args={[0.1, 0.5, 0.1]} />
                    <meshBasicMaterial color={COLORS.gold} />
                </mesh>
                <mesh position={[width/2, 0.2, 0]}>
                    <boxGeometry args={[0.1, 0.5, 0.1]} />
                    <meshBasicMaterial color={COLORS.gold} />
                </mesh>
            </group>

            {/* Computation Beams (0.2 -> 0.8) */}
            {transition > 0.2 && transition < 0.9 && (
                <group>
                    {/* Beam from Partner */}
                    <Line 
                        points={[[partnerX, inputY + 0.6, 0], [currentX, outputY - 0.6, 0]]}
                        color={COLORS.gold}
                        lineWidth={2}
                        transparent
                        opacity={0.6}
                    />
                    {/* Beam from Current */}
                    <Line 
                        points={[[currentX, inputY + 0.6, 0], [currentX, outputY - 0.6, 0]]}
                        color={COLORS.primary}
                        lineWidth={2}
                        transparent
                        opacity={0.6}
                    />
                    
                    {/* Debug Text */}
                    <Text position={[currentX, (inputY + outputY)/2, 0]} fontSize={0.25} color="white" outlineColor="black" outlineWidth={0.05}>
                        {step.debugStr}
                    </Text>
                </group>
            )}
        </group>
    );
};
