import React from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { MFunctionStep } from '../hooks/useMFunctionsLogic';
import { DATA_INPUTS, COLORS } from '../constants';
import * as THREE from 'three';

interface MFunctionsStageProps {
  progress: number;
  logic: MFunctionStep[];
  funcName: string;
}

export const MFunctionsStage: React.FC<MFunctionsStageProps> = ({ progress, logic, funcName }) => {
  const rawActiveIndex = Math.floor(progress);
  const activeIndex = Math.min(rawActiveIndex, logic.length - 1);
  const transition = progress % 1;
  const currentStep = logic[activeIndex];

  // Layout Constants
  const ITEM_WIDTH = 1.6; 
  const GAP = 0.2;
  const TOTAL_WIDTH = DATA_INPUTS.length * (ITEM_WIDTH + GAP);
  const START_X = -TOTAL_WIDTH / 2 + ITEM_WIDTH/2;
  
  const INPUT_Y = 2.0;
  const RESULT_Y = -2.0;

  const getX = (idx: number) => START_X + idx * (ITEM_WIDTH + GAP);

  // Window Visuals
  // Window indices are inclusive [start, end]
  const windowIndices = currentStep ? currentStep.windowIndices : [];
  const startIdx = windowIndices.length > 0 ? windowIndices[0] : 0;
  const endIdx = windowIndices.length > 0 ? windowIndices[windowIndices.length - 1] : 0;
  
  const windowStartX = getX(startIdx);
  const windowEndX = getX(endIdx);
  const windowWidth = (windowEndX - windowStartX) + ITEM_WIDTH + 0.4;
  const windowCenterX = (windowStartX + windowEndX) / 2;

  return (
    <group position={[0, -1, 0]}>
        <Text position={[0, 4.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            {funcName}(X, window)
        </Text>

        {/* Input Track */}
        <DataTrack 
            label="X (Input)" 
            data={DATA_INPUTS} 
            y={INPUT_Y} 
            color={COLORS.primary} 
            getX={getX} 
            windowIndices={windowIndices}
        />

        {/* Result Track (Persistent) */}
        <ResultTrack 
            logic={logic}
            activeIndex={rawActiveIndex}
            getX={getX}
            y={RESULT_Y}
        />

        {/* The Jumping Window Frame */}
        {currentStep && (
            <WindowFrame 
                x={windowCenterX}
                y={INPUT_Y}
                width={windowWidth}
                height={2.0}
                label={`Window`}
            />
        )}

        {/* Calculation Core & Result Animation */}
        {currentStep && (
            <CalculationProcessor 
                step={currentStep}
                x={windowCenterX} 
                y={0} // Center
                targetY={RESULT_Y} // Where to drop
                targetX={getX(currentStep.index)} // Result lands at current index i
                transition={transition}
                getX={getX}
                inputY={INPUT_Y}
            />
        )}

    </group>
  );
};

const DataTrack = ({ label, data, y, color, getX, windowIndices }: any) => {
    return (
        <group position={[0, y, 0]}>
            <Text position={[-12, 0, 0]} fontSize={0.4} color={color} anchorX="right">
                {label}
            </Text>
            <Line 
                points={[[-11, -0.6, 0], [11, -0.6, 0]]} 
                color="#333" 
                lineWidth={1} 
            />
            {data.map((val: number, i: number) => {
                const inWindow = windowIndices.includes(i);
                return (
                    <TrackBlock 
                        key={i} 
                        val={val} 
                        x={getX(i)} 
                        color={color}
                        inWindow={inWindow}
                    />
                );
            })}
        </group>
    );
};

const ResultTrack = ({ logic, activeIndex, getX, y }: any) => {
    return (
        <group position={[0, y, 0]}>
            <Text position={[-12, 0, 0]} fontSize={0.4} color={COLORS.success} anchorX="right">
                Result
            </Text>
            <Line points={[[-11, -0.6, 0], [11, -0.6, 0]]} color="#333" lineWidth={1} />
            
            {logic.map((step: MFunctionStep, i: number) => {
                // Show past results
                if (i >= activeIndex) return null;
                
                return (
                    <TrackBlock 
                        key={i} 
                        val={step.isNull ? 'NULL' : step.result} 
                        x={getX(step.index)} 
                        color={COLORS.success}
                        inWindow={true}
                        isResult={true}
                        isNull={step.isNull}
                    />
                );
            })}
        </group>
    );
};

const TrackBlock = ({ val, x, color, inWindow, isResult, isNull }: any) => {
    const baseColor = isResult ? COLORS.success : color;
    const displayColor = isNull ? '#444' : baseColor;
    const emissive = isResult && !isNull ? COLORS.success : displayColor;
    
    const { scale, opacity, borderCol, emissiveInt } = useSpring({
        scale: inWindow || isResult ? 1.1 : 1,
        opacity: inWindow || isResult ? 1 : 0.3,
        borderCol: inWindow || isResult ? '#ffffff' : '#333333',
        emissiveInt: isResult && !isNull ? 0.5 : 0,
        config: { tension: 200 }
    });

    return (
        <animated.group position={[x, 0, 0]} scale={scale}>
            <RoundedBox args={[1.6, 0.8, 0.2]} radius={0.1}>
                <animated.meshStandardMaterial 
                    color={displayColor} 
                    emissive={emissive}
                    emissiveIntensity={emissiveInt}
                    transparent 
                    opacity={opacity} 
                />
            </RoundedBox>
            <mesh>
                 <boxGeometry args={[1.62, 0.82, 0.22]} />
                 <animated.meshBasicMaterial color={borderCol} wireframe />
            </mesh>
            <Text 
                position={[0, 0, 0.2]} 
                fontSize={isResult ? 0.35 : 0.3} 
                color={isResult ? 'black' : 'white'} 
                fontWeight="bold"
            >
                {typeof val === 'number' ? val.toFixed(2) : val}
            </Text>
        </animated.group>
    );
};

const WindowFrame = ({ x, y, width, height, label }: any) => {
    const { springX, springWidth } = useSpring({
        springX: x,
        springWidth: width,
        config: { tension: 120, friction: 20 }
    });

    return (
        <animated.group position-x={springX} position-y={y}>
    
            <animated.mesh scale-x={springWidth}>
                {/* 基础宽度设为 1，高度和深度不变 */}
                <boxGeometry args={[1, height, 0.5]} />
                <meshBasicMaterial color="white" wireframe transparent opacity={0.3} />
            </animated.mesh>
            

            <animated.mesh scale-x={springWidth}>
                <boxGeometry args={[1, height, 0.4]} />
                <meshBasicMaterial color="#001133" transparent opacity={0.1} />
            </animated.mesh>
            
            <Text position={[0, height/2 + 0.3, 0]} fontSize={0.3} color="white">
                {label}
            </Text>
        </animated.group>
    );
};

const CalculationProcessor = ({ step, x, y, targetY, targetX, transition, getX, inputY }: any) => {
    // Animation:
    // 0.0 - 0.4: Extraction Beams (Data -> Hub)
    // 0.4 - 0.7: Calculation Display (Formulas)
    // 0.7 - 1.0: Result Drop to Target
    
    const { springX } = useSpring({
        springX: x,
        config: { tension: 120, friction: 20 }
    });

    const isCalculating = transition < 0.7;
    const isDropping = transition >= 0.7;
    
    // Lerp from Processor Center (x, y) to Result Track Position (targetX, targetY)
    // Note: Processor center x is window center. Result target x is specific index.
    
    // When dropping, we want to move from window center to result index.
    const dropProgress = isDropping ? (transition - 0.7) / 0.3 : 0;
    
    // Start pos: (springX, y) -> End pos: (targetX, targetY)
    // But springX is animated, so we use it as base.
    // Actually, let's just interpolate manually.
    
    // We need to handle the X movement during drop carefully because springX is moving with window.
    // But for a single step, springX is constant (window center for that step).
    
    const currentX = isDropping ? x + (targetX - x) * dropProgress : x;
    const currentY = isDropping ? y + (targetY - y) * dropProgress : y;

    const { calcScale } = useSpring({
        calcScale: isCalculating ? 1 : 0,
        config: { tension: 150 }
    });

    return (
        <group>
            {/* Extraction Beams */}
            {transition < 0.4 && step.windowIndices.map((idx: number, i: number) => {
                const itemX = getX(idx);
                const relX = itemX - x; // Relative to window center
                
                const beamOp = 1 - transition * 2.5;
                return (
                    <group key={i} position={[x, 0, 0]}>
                        <Line points={[[relX, inputY - y - 0.5, 0], [0, 0.5, 0]]} color={COLORS.primary} transparent opacity={beamOp} lineWidth={1} />
                    </group>
                )
            })}

            {/* Calculation Hub */}
            <animated.group position={[x, y, 0]} scale={calcScale}> 
                <mesh>
                    <sphereGeometry args={[0.7]} />
                    <meshStandardMaterial color={COLORS.gold} emissive={COLORS.gold} emissiveIntensity={1} />
                </mesh>
                
                {transition > 0.2 && (
                    <group>
                        <mesh position={[0, -1.0, 0]}>
                            <boxGeometry args={[6, 0.8, 0.01]} /> 
                            <meshBasicMaterial color="black" transparent opacity={0.7} />
                        </mesh>
                        <Text position={[0, -1.0, 0.1]} fontSize={0.35} color="white" maxWidth={5.5} textAlign="center">
                            {step.formula}
                        </Text>
                    </group>
                )}
            </animated.group>

            {/* Dropping Result */}
            {transition >= 0.7 && (
                <group position={[currentX, currentY, 0]}>
                    <RoundedBox args={[1.6, 0.8, 0.3]} radius={0.1}>
                        <meshStandardMaterial 
                            color={step.isNull ? '#444' : COLORS.success} 
                            emissive={step.isNull ? '#000' : COLORS.success} 
                            emissiveIntensity={0.6} 
                        />
                    </RoundedBox>
                    <Text position={[0, 0, 0.3]} fontSize={0.35} color={step.isNull ? 'white' : 'black'} fontWeight="bold">
                        {step.isNull ? 'NULL' : (typeof step.result === 'number' ? step.result.toFixed(2) : step.result)}
                    </Text>
                </group>
            )}

        </group>
    );
};
