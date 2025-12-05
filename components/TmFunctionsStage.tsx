import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS, SPACING, TM_TIMES, TM_INPUTS } from '../constants';
import { useTmFunctionsLogic, TmFuncType } from '../hooks/useTmFunctionsLogic';

interface TmFunctionsStageProps {
  isPlaying: boolean;
  progress: number;
  params: {
    func: TmFuncType;
    window: number;
  };
  onStepsReady?: (steps: number) => void;
}

export const TmFunctionsStage: React.FC<TmFunctionsStageProps> = ({
  isPlaying,
  progress,
  params,
  onStepsReady
}) => {
  const { func, window } = params;
  const steps = useTmFunctionsLogic(func, window);
  
  // Notify parent about total steps
  React.useEffect(() => {
    if (onStepsReady) {
      onStepsReady(steps.length);
    }
  }, [steps.length, onStepsReady]);

  // Current step based on progress
  const currentStepIndex = Math.min(Math.floor(progress), steps.length - 1);
  const currentStep = steps[currentStepIndex];
  const smoothProgress = progress - Math.floor(progress);

  // Calculate positions
  const positions = useMemo(() => {
    return steps.map((_, i) => ({
      x: (i - steps.length / 2) * SPACING.x,
      yInput: SPACING.yInput,
      yTime: SPACING.yTime,
      yResult: SPACING.yOutput
    }));
  }, [steps.length]);

  return (
    <group>
      {/* Title and Info Panel - Single line at top, scaled with scene */}
      <Html 
        position={[0, 8, 0]} 
        transform 
        sprite 
        style={{ pointerEvents: 'none', width: '1000px', display: 'flex', justifyContent: 'center' }}
      >
        <div className="text-white font-mono text-sm flex flex-col gap-2 items-center bg-black/50 p-4 rounded-xl backdrop-blur-md border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="font-bold text-lg text-cyan-400">
              {func}(T, X, window={window})
            </div>
            <div className="text-gray-400">
              Window Def: (T - {window}, T]
            </div>
          </div>
          
          {currentStep && (
            <div className="bg-gray-900/90 p-3 rounded border border-gray-700 shadow-xl backdrop-blur-sm flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Current Time</span>
                <span className="text-purple-400 font-bold text-lg">{currentStep.time}</span>
              </div>
              
              <div className="w-px h-8 bg-gray-700"></div>

              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Window Range</span>
                <span className="text-gray-300">({currentStep.windowRange[0]}, {currentStep.windowRange[1]}]</span>
              </div>

              <div className="w-px h-8 bg-gray-700"></div>

              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Values in Window</span>
                <span className="text-yellow-400">[{currentStep.windowIndices.map(idx => TM_INPUTS[idx]).join(', ')}]</span>
              </div>

              <div className="w-px h-8 bg-gray-700"></div>

              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Result</span>
                <span className="text-green-400 font-bold text-lg">{currentStep.result.toFixed(2)}</span>
              </div>

              <div className="w-px h-8 bg-gray-700"></div>

              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Formula</span>
                <span className="text-gray-400 font-mono text-xs bg-black/30 px-2 py-1 rounded">{currentStep.formula}</span>
              </div>
            </div>
          )}
        </div>
      </Html>

      {/* Row Labels */}
      <group position={[positions[0].x - 2.5, 0, 0]}>
        <Text position={[0, SPACING.yTime, 0]} fontSize={0.4} color={COLORS.time} anchorX="right">
          Time (T)
        </Text>
        <Text position={[0, SPACING.yInput, 0]} fontSize={0.4} color={COLORS.primary} anchorX="right">
          Value (X)
        </Text>
        <Text position={[0, SPACING.yOutput, 0]} fontSize={0.4} color={COLORS.success} anchorX="right">
          Result
        </Text>
      </group>

      {/* Input Array (Time and Values) */}
      {steps.map((step, i) => {
        const pos = positions[i];
        const isCurrent = i === currentStepIndex;
        const isInWindow = currentStep?.windowIndices.includes(i);
        
        // Color logic
        let color = COLORS.inactive;
        if (isCurrent) color = COLORS.primary;
        else if (isInWindow) color = COLORS.secondary;

        // Scale effect
        const scale = isCurrent ? 1.2 : 1;

        return (
          <group key={i} position={[pos.x, 0, 0]}>
            {/* Time Node */}
            <group position={[0, pos.yTime, 0]}>
              <mesh>
                <boxGeometry args={[1.8, 0.8, 0.5]} />
                <meshStandardMaterial 
                  color={COLORS.time} 
                  transparent 
                  opacity={isInWindow || isCurrent ? 0.9 : 0.3} 
                />
              </mesh>
              <Text
                position={[0, 0, 0.3]}
                fontSize={0.4}
                color="white"
                anchorX="center"
                anchorY="middle"
              >
                T={step.time}
              </Text>
            </group>

            {/* Connecting Line Time -> Value */}
            <Line
              points={[[0, pos.yTime - 0.4, 0], [0, pos.yInput + 0.6, 0]]}
              color={COLORS.grid}
              lineWidth={1}
              transparent
              opacity={0.3}
            />

            {/* Value Node */}
            <group position={[0, pos.yInput, 0]} scale={[scale, scale, scale]}>
              <mesh>
                <boxGeometry args={[1.5, 1.2, 1]} />
                <meshStandardMaterial 
                  color={color} 
                  transparent 
                  opacity={0.8} 
                />
              </mesh>
              <Text
                position={[0, 0, 0.6]}
                fontSize={0.5}
                color="white"
                anchorX="center"
                anchorY="middle"
              >
                {step.val}
              </Text>
              <Text
                position={[0, -0.8, 0]}
                fontSize={0.25}
                color="#888"
                anchorX="center"
                anchorY="top"
              >
                idx:{i}
              </Text>
            </group>

            {/* Result Node (Only show if calculated) */}
            {i <= currentStepIndex && (
              <group position={[0, pos.yResult, 0]}>
                <mesh>
                  <boxGeometry args={[1.5, 1.2, 1]} />
                  <meshStandardMaterial 
                    color={i === currentStepIndex ? COLORS.success : COLORS.inactive} 
                    transparent 
                    opacity={i === currentStepIndex ? 1 : 0.5} 
                  />
                </mesh>
                <Text
                  position={[0, 0, 0.6]}
                  fontSize={0.5}
                  color="white"
                  anchorX="center"
                  anchorY="middle"
                >
                  {step.result.toFixed(2)}
                </Text>
              </group>
            )}
            
            {/* Connecting Line Value -> Result */}
            {i <= currentStepIndex && (
              <Line
                points={[[0, pos.yInput - 0.6, 0], [0, pos.yResult + 0.6, 0]]}
                color={i === currentStepIndex ? COLORS.success : COLORS.grid}
                lineWidth={i === currentStepIndex ? 2 : 1}
                transparent
                opacity={i === currentStepIndex ? 0.8 : 0.2}
              />
            )}
          </group>
        );
      })}

      {/* Window Bracket/Highlight */}
      {currentStep && (
        <group>
           {/* Visualizing the time window range */}
           {/* We can draw a bracket covering the indices in the window */}
           {(() => {
             const indices = currentStep.windowIndices;
             if (indices.length === 0) return null;
             const startIdx = indices[0];
             const endIdx = indices[indices.length - 1];
             const startX = positions[startIdx].x;
             const endX = positions[endIdx].x;
             const y = SPACING.yInput + 1.5; // Above the values

             return (
               <group>
                 <Line
                    points={[
                      [startX - 0.8, y - 0.2, 0],
                      [startX - 0.8, y, 0],
                      [endX + 0.8, y, 0],
                      [endX + 0.8, y - 0.2, 0]
                    ]}
                    color={COLORS.secondary}
                    lineWidth={2}
                 />
                 <Text
                    position={[(startX + endX) / 2, y + 0.3, 0]}
                    fontSize={0.3}
                    color={COLORS.secondary}
                    anchorX="center"
                    anchorY="bottom"
                 >
                   Window ({currentStep.windowRange[0]}, {currentStep.windowRange[1]}]
                 </Text>
               </group>
             );
           })()}
        </group>
      )}
    </group>
  );
};
