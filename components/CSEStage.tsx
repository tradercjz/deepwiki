
import React, { useRef } from 'react';
import { Text, RoundedBox, Line, Sphere } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import { CSEStep, CSESnapshotItem } from '../hooks/useCrossSectionalEngineLogic';
import { Table3D } from './Table3D';
import { CSE_DATA, COLORS } from '../constants';

interface CSEStageProps {
  progress: number;
  logic: CSEStep[];
  hoveredIndex: number | null;
  setHoveredIndex: (i: number | null) => void;
}

export const CSEStage: React.FC<CSEStageProps> = ({ progress, logic, hoveredIndex, setHoveredIndex }) => {
  const activeIndex = Math.min(Math.floor(progress), logic.length - 1);
  const transition = progress % 1;
  const currentStep = logic[activeIndex];

  // Layout
  const INPUT_X = -12;
  const OUTPUT_X = 12;
  const RACK_X = 0;
  
  return (
    <group position={[0, -2, 0]}>
      {/* 1. INPUT TABLE */}
      <group position={[INPUT_X, 4, 0]}>
        <Table3D 
           title="Input Stream (trades1)"
           data={CSE_DATA}
           highlightIndex={activeIndex}
           columns={[
               { header: 'Time', accessor: d => d.time.split('T')[1] || d.time, width: 2.2, color: COLORS.time },
               { header: 'Sym', accessor: d => d.sym, width: 0.8, color: '#fff' },
               { header: 'Price', accessor: d => d.price, width: 1.0, color: COLORS.primary },
               { header: 'Vol', accessor: d => d.vol, width: 0.8, color: COLORS.secondary }
           ]}
        />
      </group>

      {/* 2. ENGINE CORE: Snapshot Rack */}
      <group position={[RACK_X, 0, 0]}>
         <Text position={[0, 4, 0]} fontSize={0.5} color={COLORS.secondary} fontWeight="bold">
              Cross-Sectional Engine
          </Text>
          <Text position={[0, 3.5, 0]} fontSize={0.25} color="#888">
              metrics=&lt;[avg(price), sum(vol), sum(p*v), count(p)]&gt;
          </Text>

          {/* Slots for Keys */}
          {currentStep && currentStep.snapshot.map((slot, i) => (
             <SnapshotSlot 
                key={slot.sym}
                index={i}
                totalSlots={currentStep.snapshot.length}
                data={slot}
                isActive={slot.isUpdatedThisStep}
                transition={transition}
             />
          ))}

          {/* Aggregator Core */}
          <AggregatorCore 
             step={currentStep}
             transition={transition}
          />
          
          {/* Flying Packet (Input -> Slot) */}
          {currentStep && (
              <UpdatePacket 
                 step={currentStep}
                 transition={transition}
                 inputX={INPUT_X + 3}
                 slotX={getSlotX(currentStep.snapshot.findIndex(s => s.sym === currentStep.data.sym), currentStep.snapshot.length)}
              />
          )}

      </group>

      {/* 3. OUTPUT TABLE */}
      <group position={[OUTPUT_X, 4, 0]}>
         <Table3D 
            title="Output Table"
            data={currentStep ? currentStep.outputHistory : []}
            columns={[
                { header: 'Time', accessor: d => d.time.split('.')[1] || d.time, width: 1.5, color: COLORS.time },
                { header: 'AvgP', accessor: d => d.avgPrice, width: 1.2, color: COLORS.success },
                { header: 'Vol', accessor: d => d.totalVol, width: 1.0, color: COLORS.success },
                { header: '$Vol', accessor: d => d.dollarVol, width: 1.2, color: COLORS.success },
                { header: 'Cnt', accessor: d => d.count, width: 0.8, color: COLORS.success }
            ]}
            onRowHover={setHoveredIndex}
         />
      </group>
    </group>
  );
};

const SLOT_SPACING = 3;

const getSlotX = (index: number, total: number) => {
    return (index - (total - 1) / 2) * SLOT_SPACING;
};

const SnapshotSlot = ({ index, totalSlots, data, isActive, transition }: { index: number, totalSlots: number, data: CSESnapshotItem, isActive: boolean, transition: number }) => {
    const x = getSlotX(index, totalSlots);
    const hasData = data.price > 0;
    
    const color = data.sym === 'A' ? COLORS.laneA : (data.sym === 'B' ? COLORS.laneB : COLORS.laneC);

    const { scale, intensity } = useSpring({
        scale: isActive ? 1.1 : 1,
        intensity: isActive ? 2 : 0,
        config: { tension: 300, friction: 10 }
    });

    // Flash effect on update
    const flash = isActive && transition > 0.4 && transition < 0.6;

    return (
        <animated.group position={[x, 0, 0]} scale={scale}>
            {/* Slot Container */}
            <RoundedBox args={[2.2, 3, 1]} radius={0.1}>
                 <meshPhysicalMaterial 
                    color={flash ? '#ffffff' : '#1a1a1a'} 
                    emissive={flash ? '#ffffff' : color}
                    emissiveIntensity={flash ? 2 : (hasData ? 0.2 : 0)}
                    roughness={0.2} metalness={0.8}
                 />
            </RoundedBox>
            
            {/* Label */}
            <Text position={[0, 1.8, 0]} fontSize={0.3} color={color} fontWeight="bold">
                {data.sym}
            </Text>

            {/* Data Display */}
            {hasData ? (
                <group position={[0, 0, 0.6]}>
                    <Text position={[0, 0.5, 0]} fontSize={0.3} color="white">
                        P: {data.price}
                    </Text>
                    <Text position={[0, 0, 0]} fontSize={0.3} color={COLORS.secondary}>
                        V: {data.vol}
                    </Text>
                    <Text position={[0, -1, 0]} fontSize={0.15} color="#888">
                        @{data.time.split('T')[1] || data.time}
                    </Text>
                </group>
            ) : (
                <Text position={[0, 0, 0.6]} fontSize={0.2} color="#444">Empty</Text>
            )}

            {/* Connection Line to Core (The "Cross Section" Beam) */}
            {/* Triggers after update phase, during calculation phase (0.6 - 0.9) */}
            {hasData && transition > 0.6 && transition < 0.95 && (
                 <Line 
                    points={[[0, 1.5, 0], [0 - x, 2.5, 0]]} // Relative to slot, target is core at 0, 2.5
                    color={COLORS.primary}
                    lineWidth={2}
                    transparent opacity={0.5}
                 />
            )}
        </animated.group>
    );
};

const AggregatorCore = ({ step, transition }: { step: CSEStep | undefined, transition: number }) => {
    const coreRef = useRef<any>(null);
    
    useFrame((state) => {
        if(coreRef.current) {
            coreRef.current.rotation.y += 0.02;
            coreRef.current.rotation.z += 0.01;
        }
    });

    // Animation phases
    // 0.6 - 0.9: Aggregation (Growing)
    // 0.9 - 1.0: Eject Result
    
    const isAggregating = transition > 0.6 && transition < 0.9;
    
    const { scale } = useSpring({
        scale: isAggregating ? 1.5 : 1,
        config: { tension: 200 }
    });

    if (!step) return null;

    return (
        <group position={[0, 2.5, 0]}>
             <animated.mesh ref={coreRef} scale={scale}>
                 <octahedronGeometry args={[0.8, 0]} />
                 <meshStandardMaterial color={COLORS.success} wireframe emissive={COLORS.success} emissiveIntensity={isAggregating ? 2 : 0.5} />
             </animated.mesh>
             
             {isAggregating && (
                 <group>
                     <Text position={[0, 1.2, 0]} fontSize={0.3} color={COLORS.success}>
                        $Vol: {step.metrics.dollarVol}
                     </Text>
                     <Text position={[0, -1.2, 0]} fontSize={0.3} color={COLORS.success}>
                        AvgP: {step.metrics.avgPrice.toFixed(2)}
                     </Text>
                 </group>
             )}

             {/* Output Packet */}
             {transition > 0.9 && (
                 <OutputPacket 
                    transition={transition}
                    startX={0}
                    targetX={12} // Output Table X
                 />
             )}
        </group>
    );
};

const UpdatePacket = ({ step, transition, inputX, slotX }: any) => {
    // 0.0 - 0.4: Flight
    if (transition > 0.4) return null;
    
    const t = transition / 0.4;
    const x = (1-t)*inputX + t*slotX;
    const y = (1-t)*4 + t*0;

    return (
        <group position={[x, y, 0.5]}>
            <Sphere args={[0.2]}>
                <meshStandardMaterial color={COLORS.primary} emissive={COLORS.primary} />
            </Sphere>
        </group>
    );
};

const OutputPacket = ({ transition, startX, targetX }: any) => {
    // 0.9 - 1.0
    const t = (transition - 0.9) / 0.1;
    const x = (1-t)*startX + t*(targetX - 2.5);
    const y = (1-t)*2.5 + t*4;
    
    return (
        <group position={[x, y, 0]}>
            <Sphere args={[0.3]}>
                <meshStandardMaterial color={COLORS.success} emissive={COLORS.success} />
            </Sphere>
        </group>
    );
};
