
import React from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { RollingStep } from '../hooks/useRollingLogic';
import { ROLLING_AAPL, ROLLING_SPY, COLORS } from '../constants';
import * as THREE from 'three';

interface RollingStageProps {
  progress: number;
  logic: RollingStep[];
}

export const RollingStage: React.FC<RollingStageProps> = ({ progress, logic }) => {
  const activeIndex = Math.min(Math.floor(progress), logic.length - 1);
  const transition = progress % 1;
  const currentStep = logic[activeIndex];

  // Layout Constants
  const ITEM_WIDTH = 1.6; 
  const GAP = 0.2;
  const TOTAL_WIDTH = ROLLING_AAPL.length * (ITEM_WIDTH + GAP);
  const START_X = -TOTAL_WIDTH / 2 + ITEM_WIDTH/2;
  
  const AAPL_Y = 2.5;
  const SPY_Y = 1.0;
  const RESULT_Y = -2.5;

  const getX = (idx: number) => START_X + idx * (ITEM_WIDTH + GAP);

  // Window Visuals
  const windowStart = currentStep ? getX(currentStep.startIndex) : 0;
  const windowEnd = currentStep ? getX(currentStep.endIndex) : 0;
  const windowWidth = (windowEnd - windowStart) + ITEM_WIDTH + 0.4;
  const windowCenterX = (windowStart + windowEnd) / 2;

  return (
    <group position={[0, -1, 0]}>
        <Text position={[0, 4.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            rolling(beta, [AAPL, SPY], 10, 5)
        </Text>

        {/* AAPL Track */}
        <DataTrack 
            label="AAPL" 
            data={ROLLING_AAPL} 
            y={AAPL_Y} 
            color={COLORS.laneA} 
            getX={getX} 
            windowStartIdx={currentStep?.startIndex}
            windowEndIdx={currentStep?.endIndex}
        />

        {/* SPY Track */}
        <DataTrack 
            label="SPY" 
            data={ROLLING_SPY} 
            y={SPY_Y} 
            color={COLORS.laneB} 
            getX={getX}
            windowStartIdx={currentStep?.startIndex}
            windowEndIdx={currentStep?.endIndex}
        />

        {/* Result Track (Persistent) */}
        <ResultTrack 
            logic={logic}
            activeIndex={activeIndex}
            getX={getX}
            y={RESULT_Y}
        />

        {/* The Jumping Window Frame */}
        {currentStep && (
            <WindowFrame 
                x={windowCenterX}
                y={(AAPL_Y + SPY_Y) / 2}
                width={windowWidth}
                height={3.5}
                progress={transition}
                label={`Window ${currentStep.windowIndex + 1}`}
            />
        )}

        {/* Calculation Core & Result Animation */}
        {currentStep && (
            <BetaProcessor 
                step={currentStep}
                x={windowCenterX} 
                y={(SPY_Y + RESULT_Y)/2} // Float between inputs and result
                targetY={RESULT_Y} // Where to drop
                targetX={getX(currentStep.endIndex)} // Where result lands on track (Window End)
                transition={transition}
                getX={getX}
                aaplY={AAPL_Y}
                spyY={SPY_Y}
            />
        )}

    </group>
  );
};

const DataTrack = ({ label, data, y, color, getX, windowStartIdx, windowEndIdx }: any) => {
    return (
        <group position={[0, y, 0]}>
            <Text position={[-18, 0, 0]} fontSize={0.4} color={color} anchorX="right">
                {label}
            </Text>
            <Line 
                points={[[-17, -0.6, 0], [17, -0.6, 0]]} 
                color="#333" 
                lineWidth={1} 
            />
            {data.map((val: number, i: number) => {
                const inWindow = windowStartIdx !== undefined && i >= windowStartIdx && i <= windowEndIdx;
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
            <Text position={[-18, 0, 0]} fontSize={0.4} color={COLORS.success} anchorX="right">
                Beta (Result)
            </Text>
            <Line points={[[-17, -0.6, 0], [17, -0.6, 0]]} color="#333" lineWidth={1} />
            
            {logic.map((step: RollingStep, i: number) => {
                // Show past results
                if (i >= activeIndex) return null;
                
                return (
                    <TrackBlock 
                        key={i} 
                        val={step.beta} 
                        x={getX(step.endIndex)} 
                        color={COLORS.success}
                        inWindow={true}
                        isResult={true}
                    />
                );
            })}
        </group>
    );
};

const TrackBlock = ({ val, x, color, inWindow, isResult }: any) => {
    const baseColor = isResult ? COLORS.success : color;
    const emissive = isResult ? COLORS.success : baseColor;
    
    const { scale, opacity, borderCol, emissiveInt } = useSpring({
        scale: inWindow || isResult ? 1.1 : 1,
        opacity: inWindow || isResult ? 1 : 0.3,
        borderCol: inWindow || isResult ? '#ffffff' : '#333333',
        emissiveInt: isResult ? 0.5 : 0,
        config: { tension: 200 }
    });

    return (
        <animated.group position={[x, 0, 0]} scale={scale}>
            <RoundedBox args={[1.6, 0.8, 0.2]} radius={0.1}>
                <animated.meshStandardMaterial 
                    color={baseColor} 
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
                {val.toFixed(4)}
            </Text>
        </animated.group>
    );
};

const WindowFrame = ({ x, y, width, height, progress, label }: any) => {
    const { springX } = useSpring({
        springX: x,
        config: { tension: 120, friction: 20 }
    });

    return (
        <animated.group position-x={springX} position-y={y}>
            <mesh>
                <boxGeometry args={[width, height, 0.5]} />
                <meshBasicMaterial color="white" wireframe transparent opacity={0.3} />
            </mesh>
            <mesh>
                <boxGeometry args={[width, height, 0.4]} />
                <meshBasicMaterial color="#001133" transparent opacity={0.1} />
            </mesh>
            <Text position={[0, height/2 + 0.3, 0]} fontSize={0.3} color="white">
                {label}
            </Text>
        </animated.group>
    );
};

const BetaProcessor = ({ step, x, y, targetY, targetX, transition, getX, aaplY, spyY }: any) => {
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
    const dropProgress = isDropping ? (transition - 0.7) / 0.3 : 0;
    
    const relTargetX = targetX - x;
    const relTargetY = targetY - y;

    const curDropX = dropProgress * relTargetX;
    const curDropY = dropProgress * relTargetY;

    const { calcScale } = useSpring({
        calcScale: isCalculating ? 1 : 0,
        config: { tension: 150 }
    });

    return (
        <animated.group position-x={springX} position-y={y}>
            
            {/* Extraction Beams */}
            {transition < 0.4 && step.xSlice.map((_: any, i: number) => {
                const idx = step.startIndex + i;
                const itemX = getX(idx);
                const relX = itemX - x;
                
                const beamOp = 1 - transition * 2.5;
                return (
                    <group key={i}>
                        <Line points={[[relX, aaplY - y, 0], [0, 1.0, 0]]} color={COLORS.laneA} transparent opacity={beamOp} lineWidth={1} />
                        <Line points={[[relX, spyY - y, 0], [0, 1.0, 0]]} color={COLORS.laneB} transparent opacity={beamOp} lineWidth={1} />
                    </group>
                )
            })}

            {/* Calculation Hub */}
            <animated.group position={[0, 1.0, 0]} scale={calcScale}> 
                <mesh>
                    <sphereGeometry args={[0.7]} />
                    <meshStandardMaterial color={COLORS.gold} emissive={COLORS.gold} emissiveIntensity={1} />
                </mesh>
                
                {transition > 0.2 && (
                    <group>
                        <Text position={[-3, 0.5, 0]} fontSize={0.35} color="white" anchorX="right">
                            Cov: {step.cov.toFixed(4)}
                        </Text>
                        <Text position={[3, 0.5, 0]} fontSize={0.35} color="white" anchorX="left">
                            Var: {step.varY.toFixed(4)}
                        </Text>
                        
                        <mesh position={[0, -0.5, 0]}>
                             <boxGeometry args={[4, 0.05, 0]} />
                             <meshBasicMaterial color="white" />
                        </mesh>
                        <Text position={[0, -1.2, 0]} fontSize={0.4} color={COLORS.gold} fontWeight="bold">
                            Beta = {step.beta}
                        </Text>
                    </group>
                )}
            </animated.group>

            {/* Dropping Result */}
            {transition >= 0.7 && (
                <group position={[curDropX, curDropY, 0]}>
                    <RoundedBox args={[2.0, 1.0, 0.3]} radius={0.1}>
                        <meshStandardMaterial color={COLORS.success} emissive={COLORS.success} emissiveIntensity={0.6} />
                    </RoundedBox>
                    <Text position={[0, 0, 0.3]} fontSize={0.45} color="black" fontWeight="bold">
                        {step.beta.toFixed(4)}
                    </Text>
                </group>
            )}

        </animated.group>
    );
};
