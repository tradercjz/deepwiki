
import React from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { RSEStep } from '../hooks/useReactiveStateEngineLogic';
import { Table3D } from './Table3D';
import { RSE_DATA, COLORS } from '../constants';

interface RSEStageProps {
  progress: number;
  logic: RSEStep[];
  hoveredIndex: number | null;
  setHoveredIndex: (i: number | null) => void;
}

export const RSEStage: React.FC<RSEStageProps> = ({ progress, logic, hoveredIndex, setHoveredIndex }) => {
  const activeIndex = Math.min(Math.floor(progress), logic.length - 1);
  const transition = progress % 1;
  const currentStep = logic[activeIndex];

  // Layout
  const INPUT_X = -10;
  const OUTPUT_X = 10;
  const CENTER_X = 0;
  
  // Lane positions
  const LANE_Z = { 'A': -2, 'B': 2 };

  return (
    <group position={[0, -2, 0]}>
      
      {/* 1. INPUT TABLE */}
      <group position={[INPUT_X, 4, 0]}>
        <Table3D 
           title="Input Stream (dummyTable)"
           data={RSE_DATA}
           highlightIndex={activeIndex}
           columns={[
               { header: 'Time', accessor: d => d.time, width: 2.5, color: COLORS.time },
               { header: 'Sym', accessor: d => d.sym, width: 1.0, color: '#fff' },
               { header: 'Price', accessor: d => d.price, width: 1.5, color: COLORS.primary }
           ]}
        />
      </group>

      {/* 2. OUTPUT TABLE */}
      <group position={[OUTPUT_X, 4, 0]}>
         <Table3D 
            title="Output Table"
            data={currentStep ? currentStep.outputHistory : []}
            columns={[
                { header: 'Time', accessor: d => d.time, width: 2.5, color: COLORS.time },
                { header: 'Sym', accessor: d => d.sym, width: 1.0, color: '#fff' },
                { header: 'MAvg', accessor: d => d.val, width: 1.5, color: COLORS.success }
            ]}
            onRowHover={setHoveredIndex}
         />
      </group>

      {/* 3. ENGINE CORE */}
      <group position={[CENTER_X, 0, 0]}>
          <Text position={[0, 4, 0]} fontSize={0.5} color={COLORS.secondary} fontWeight="bold">
              Reactive State Engine
          </Text>
          <Text position={[0, 3.5, 0]} fontSize={0.25} color="#888">
              metrics=&lt;mavg(price, window)&gt;, keyColumn=`sym
          </Text>

          {/* Processors for Groups A and B */}
          <StateChip 
             sym="A" 
             z={LANE_Z['A']} 
             isActive={currentStep?.data.sym === 'A'} 
             stepData={currentStep?.data.sym === 'A' ? currentStep : null}
             transition={transition}
          />
          <StateChip 
             sym="B" 
             z={LANE_Z['B']} 
             isActive={currentStep?.data.sym === 'B'} 
             stepData={currentStep?.data.sym === 'B' ? currentStep : null}
             transition={transition}
          />

          {/* Flying Data Animation */}
          {currentStep && (
              <ReactivePacket 
                 step={currentStep}
                 transition={transition}
                 inputX={INPUT_X + 2.5}
                 outputX={OUTPUT_X - 2.5}
                 laneZ={LANE_Z[currentStep.data.sym as 'A'|'B']}
              />
          )}
      </group>

    </group>
  );
};

// Sub-component: The State Processor Chip
const StateChip = ({ sym, z, isActive, stepData, transition }: any) => {
    const color = sym === 'A' ? COLORS.laneA : COLORS.laneB;
    
    const { scale } = useSpring({
        scale: isActive ? 1.1 : 1,
        config: { tension: 300, friction: 10 }
    });

    const bufferToShow = (isActive && transition < 0.5 && stepData) 
        ? stepData.prevBuffer 
        : (stepData ? stepData.groupState.buffer : []); 
    
    return (
        <animated.group position={[0, 0, z]} scale={scale}>
            {/* Chip Body */}
            <RoundedBox args={[6, 2, 2.5]} radius={0.2}>
                <meshPhysicalMaterial 
                    color="#1a1a1a"
                    roughness={0.2}
                    metalness={0.8}
                    clearcoat={1}
                />
            </RoundedBox>
            
            {/* Glowing Border */}
            <mesh>
                 <boxGeometry args={[6.1, 2.1, 2.6]} />
                 <meshBasicMaterial color={isActive ? color : '#333'} wireframe />
            </mesh>

            {/* Label */}
            <Text position={[-2.5, 1.2, 0]} fontSize={0.3} color={color} fontWeight="bold">
                Group {sym}
            </Text>

            {/* Internal State Buffer Visualization */}
            <group position={[0, 0, 0]}>
                 {bufferToShow.map((val: number, i: number) => (
                     <mesh key={i} position={[(i - (bufferToShow.length-1)/2) * 1.2, 0, 0.5]}>
                         <sphereGeometry args={[0.3]} />
                         <meshStandardMaterial color={COLORS.gold} emissive={COLORS.gold} emissiveIntensity={0.5} />
                         <Text position={[0, 0, 0.4]} fontSize={0.25} color="black" fontWeight="bold">
                             {val}
                         </Text>
                     </mesh>
                 ))}
                 {bufferToShow.length === 0 && (
                     <Text position={[0, 0, 0.5]} fontSize={0.2} color="#444">Empty</Text>
                 )}
                 <Text position={[0, -0.6, 0]} fontSize={0.2} color="#aaa">
                    Buffer
                 </Text>
            </group>

            {/* Math Bubble (Only when processing active step) */}
            {isActive && stepData && transition > 0.3 && transition < 0.9 && (
                <group position={[0, 2, 0]}>
                    <RoundedBox args={[4.5, 1.2, 0.1]} radius={0.5}>
                        <meshBasicMaterial color="black" transparent opacity={0.8} />
                    </RoundedBox>
                    <Text position={[0, 0.2, 0.1]} fontSize={0.25} color="white" maxWidth={4} textAlign="center">
                        {stepData.debugStr.split('\n')[0]} 
                    </Text>
                     {stepData.result !== null ? (
                         <Text position={[0, -0.3, 0.1]} fontSize={0.35} color={COLORS.success} fontWeight="bold">
                            = {stepData.result}
                        </Text>
                     ) : (
                         <Text position={[0, -0.3, 0.1]} fontSize={0.25} color="gray" fontWeight="bold">
                            Result NULL (Filling)
                        </Text>
                     )}
                </group>
            )}

        </animated.group>
    );
};

// Sub-component: The Flying Data -> Result
const ReactivePacket = ({ step, transition, inputX, outputX, laneZ }: any) => {
    // 3 Stages:
    // 0.0 - 0.4: Input -> Chip
    // 0.4 - 0.6: Processing (Inside Chip)
    // 0.6 - 1.0: Chip -> Output

    let x = 0, y = 0, z = laneZ;
    let visible = true;
    let label = step.data.price;
    let color = COLORS.primary;

    if (transition < 0.4) {
        // Stage 1
        const t = transition / 0.4; // 0 to 1
        x = (1-t)*inputX + t*(-3); // Stop at chip edge
        y = (1-t)*4 + t*0;
    } else if (transition < 0.6) {
        // Stage 2: Absorbed
        visible = false;
    } else {
        // Stage 3: Result Eject
        const t = (transition - 0.6) / 0.4;
        x = (1-t)*3 + t*outputX; // Start from chip edge
        y = (1-t)*0 + t*4;
        
        if (step.result === null) {
            label = "NULL";
            color = "#666";
        } else {
            label = step.result;
            color = COLORS.success;
        }
    }

    if (!visible) return null;

    return (
        <group position={[x, y, z]}>
            <mesh>
                <sphereGeometry args={[0.3]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={color === "#666" ? 0 : 2} />
            </mesh>
            <Text position={[0, 0.5, 0]} fontSize={0.3} color={color} fontWeight="bold">
                {label}
            </Text>
        </group>
    );
};
