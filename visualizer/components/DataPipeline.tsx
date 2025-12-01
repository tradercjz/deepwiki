
import React from 'react';
import { Text, Line } from '@react-three/drei';
import { COLORS, SPACING, FuncType, DATA_TIME, AppMode } from '../constants';
import { InputCube } from './InputCube';
import { OutputCube } from './OutputCube';
import { StateOrb } from './StateOrb';
import { TimeNode } from './TimeNode';

interface DataPipelineProps {
  progress: number;
  results: any[];
  hoveredIndex: number | null;
  setHoveredIndex: (i: number | null) => void;
  funcWindow: number;
  funcType?: FuncType;
  mode: AppMode;
}

export const DataPipeline: React.FC<DataPipelineProps> = ({
  progress,
  results,
  hoveredIndex,
  setHoveredIndex,
  funcWindow,
  funcType = 'msum',
  mode
}) => {
  const activeIndex = Math.floor(progress);
  const transition = progress % 1; 

  const isCondMode = mode === 'conditionalIterate';
  const isTmMode = mode === 'tmFunction';

  return (
    <group>
      {/* Labels - Conditional Rendering based on Mode */}
      {isTmMode && (
          <Text position={[-2, SPACING.yTime, 0]} fontSize={0.3} color={COLORS.time} anchorX="right">
            Time Vector (T)
          </Text>
      )}

      <Text position={[-2, SPACING.yInput, 0]} fontSize={0.3} color={COLORS.primary} anchorX="right">
        {isCondMode ? 'val0 (Check > 5)' : 'Input Data (X)'}
      </Text>
      
      {isCondMode && (
        <>
            <Text position={[-2, 0, 0]} fontSize={0.25} color={COLORS.gold} anchorX="right">
                False: Func(Prev Y)
            </Text>
            <Text position={[-2, -0.4, 0]} fontSize={0.25} color={COLORS.condTrue} anchorX="right">
                True: val1 (Reset)
            </Text>
        </>
      )}

      {isTmMode && (
         <Text position={[-2, 0, 0]} fontSize={0.25} color={COLORS.secondary} anchorX="right">
            Window (Time-based)
         </Text>
      )}

      <Text position={[-2, SPACING.yOutput, 0]} fontSize={0.4} color={COLORS.success} anchorX="right">
        {isTmMode ? 'tmsum(X)' : 'Result'}
      </Text>

      {/* Time Row (Only for TM Mode) */}
      {isTmMode && results.map((data, i) => {
          // Calculate if this TimeNode is part of the current active window
          // Active Index is the 'Head'
          const headData = results[activeIndex];
          const isContributing = headData && headData.contributingIndices && headData.contributingIndices.includes(i);
          const isHead = i === activeIndex;

          return (
            <TimeNode
                key={`time-${i}`}
                index={i}
                time={data.time}
                isActive={isHead}
                isInWindow={isContributing}
                windowSize={funcWindow}
            />
          );
      })}

      {/* Input Row */}
      {results.map((data, i) => (
        <InputCube
          key={`input-${i}`}
          index={i}
          value={data.val0}
          time={data.time}
          threshold={isCondMode ? 5 : -999} // Disable threshold logic visually in tm mode
          isConditionMet={isCondMode ? data.isConditionMet : false}
          isActive={i === activeIndex && isCondMode} // Only highlight active input in Cond mode logic
          showTimeBadge={!isTmMode} // Hide badge if dedicated Time row exists
        />
      ))}

      {/* Output Row */}
      {results.map((data, i) => (
        <OutputCube
          key={`output-${i}`}
          index={i}
          value={data.result}
          show={i < progress}
          onHover={setHoveredIndex}
          isHovered={hoveredIndex === i}
          source={data.source} 
        />
      ))}

      {/* State Orb - Only visible in Reactive State Mode (conditionalIterate) */}
      {isCondMode && (
        <StateOrb 
            progress={progress} 
            currentResult={0} 
            nextResult={null}
            visible={activeIndex < results.length && !results[activeIndex].isConditionMet}
        />
      )}

      {/* Connection Lines & Logic Visualization */}
      {activeIndex < results.length && (
         <ProcessingLines 
            activeIndex={activeIndex} 
            results={results}
            funcWindow={funcWindow}
            funcType={funcType}
            transition={transition}
            mode={mode}
         />
      )}
    </group>
  );
};

const ProcessingLines = ({ activeIndex, results, funcWindow, funcType, transition, mode }: any) => {
  const xPos = activeIndex * SPACING.x;
  const currentData = results[activeIndex];
  
  // -- Mode 1: Conditional Iterate --
  if (mode === 'conditionalIterate') {
      const isMet = currentData.isConditionMet;
      const branchColor = isMet ? COLORS.condTrue : COLORS.condFalse;

      // Calculate Indices for Feedback Loop (Previous Outputs -> Logic)
      const indicesToConnect: number[] = [];
      if (!isMet && activeIndex > 0) {
          const prevIdx = activeIndex - 1; // k-1
          
          if (funcType === 'move') {
              const targetIdx = prevIdx - funcWindow;
              if (targetIdx >= 0 && results[targetIdx].result !== null) indicesToConnect.push(targetIdx);
          } else if (funcType === 'tmsum') {
              // RSE tmsum logic (on output history)
              const refTime = DATA_TIME[prevIdx];
              const minTime = refTime - funcWindow;
              for (let i = 0; i <= prevIdx; i++) {
                  if (DATA_TIME[i] > minTime && DATA_TIME[i] <= refTime && results[i].result !== null) {
                      indicesToConnect.push(i);
                  }
              }
          } else {
              // Standard window (msum, etc)
              const startIdx = prevIdx - funcWindow + 1;
              const endIdx = prevIdx;
              for (let i = startIdx; i <= endIdx; i++) {
                  if (i >= 0 && results[i].result !== null) indicesToConnect.push(i);
              }
          }
      }

      return (
        <group position={[xPos, 0, 0]}>
          <Line points={[[0, SPACING.yInput - 0.6, 0], [0, 0.5, 0]]} color={branchColor} lineWidth={2} transparent opacity={0.8} />

          {!isMet && indicesToConnect.map((targetIdx, i) => {
             const relX = (targetIdx - activeIndex) * SPACING.x;
             const isSinglePoint = funcType === 'move';
             return (
                <Line 
                    key={`feedback-${targetIdx}`}
                    points={[[relX, SPACING.yOutput + 0.6, 0], [relX, -0.5, 0], [0, 0, 0]]}
                    vertexColors={[[0, 1, 0.25], [1, 0.8, 0], [1, 0.2, 0.2]]} 
                    lineWidth={isSinglePoint ? 3 : 1.5} transparent opacity={0.4}
                />
             )
          })}

          {isMet && (
              <group>
                 <Text position={[0.8, 0.5, 0]} fontSize={0.3} color={COLORS.val1}>val1</Text>
                 <Line points={[[0.5, 0.5, 0], [0, 0, 0]]} color={COLORS.val1} lineWidth={3} />
              </group>
          )}

          <Line points={[[0, 0, 0], [0, SPACING.yOutput + 0.6, 0]]} color={isMet ? COLORS.condTrue : COLORS.gold} lineWidth={3} transparent opacity={Math.max(0, Math.sin(transition * Math.PI))} />
          
          <mesh scale={0.3}>
            <sphereGeometry />
            <meshStandardMaterial color={isMet ? COLORS.condTrue : COLORS.condFalse} emissive={isMet ? COLORS.condTrue : COLORS.condFalse} emissiveIntensity={1} />
          </mesh>
        </group>
      );
  }

  // -- Mode 2: TM Series Function --
  if (mode === 'tmFunction') {
      // Logic: Show aggregation from Inputs -> Output
      // `currentData.contributingIndices` comes from useTmSeriesLogic
      const contributing: number[] = currentData.contributingIndices || [];

      return (
        <group position={[xPos, 0, 0]}>
             {/* Highlight Window Range based on Time Nodes */}
             {contributing.map((targetIdx: number) => {
                 const relX = (targetIdx - activeIndex) * SPACING.x;
                 return (
                    <group key={`agg-${targetIdx}`}>
                        {/* Line from Time Node to Input (emphasize selection) */}
                        <Line 
                            points={[
                                [relX, SPACING.yTime - 0.5, 0], 
                                [relX, SPACING.yInput + 0.6, 0]
                            ]}
                            color={COLORS.time}
                            lineWidth={2}
                            transparent
                            opacity={0.5}
                        />

                        {/* Line from Input to Output (The Summation) */}
                        <Line 
                            points={[
                                [relX, SPACING.yInput - 0.6, 0], // Start at Input Bottom
                                [0, SPACING.yOutput + 0.6, 0]    // End at Output Top (Current)
                            ]}
                            color={COLORS.primary}
                            lineWidth={1.5}
                            transparent
                            opacity={0.3}
                        />
                    </group>
                 );
             })}
             
             {/* Center Connection (Current Output) */}
             <Line points={[[0, -0.5, 0], [0, SPACING.yOutput + 0.6, 0]]} color={COLORS.success} lineWidth={2} />
        </group>
      );
  }

  return null;
};
