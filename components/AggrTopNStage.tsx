
import React, { useRef } from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import { AggrTopNState, TopNItem } from '../hooks/useAggrTopNLogic';
import { COLORS } from '../constants';
import * as THREE from 'three';

interface AggrTopNStageProps {
  progress: number; // 0 to 4 (4 Steps)
  logic: AggrTopNState;
}

// Steps:
// 0-1: Presentation (Original Order)
// 1-2: Sort Animation (Move to Sorted Order)
// 2-3: Top Zone Selection (Highlight)
// 3-4: Aggregation (Fly to Result)

export const AggrTopNStage: React.FC<AggrTopNStageProps> = ({ progress, logic }) => {
  const BLOCK_WIDTH = 1.2;
  const GAP = 0.4;
  const TOTAL_WIDTH = logic.items.length * (BLOCK_WIDTH + GAP);
  const START_X = -TOTAL_WIDTH / 2 + BLOCK_WIDTH/2;

  const getX = (idx: number) => START_X + idx * (BLOCK_WIDTH + GAP);

  // Determine global phase
  const isSorting = progress >= 1;
  const isSelecting = progress >= 2;
  const isAggregating = progress >= 3;

  return (
    <group position={[0, -1, 0]}>
        
        {/* Phase Label */}
        <Text position={[0, 4.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            {progress < 1 ? "Phase 1: Input Data" : 
             (progress < 2 ? "Phase 2: Sorting" : 
             (progress < 3 ? "Phase 3: Top N Selection" : "Phase 4: Aggregation"))}
        </Text>

        {/* Data Columns */}
        {logic.items.map((item) => (
            <DataPair 
                key={item.id}
                item={item}
                targetX={getX(isSorting ? item.sortedIndex : item.originalIndex)}
                isTop={item.isTop}
                phase={progress}
            />
        ))}

        {/* Top N Selection Zone */}
        {isSelecting && (
             <TopZone 
                count={logic.items.filter(i => i.isTop).length}
                startX={START_X - BLOCK_WIDTH/2 - GAP/2}
                blockStep={BLOCK_WIDTH + GAP}
                phase={progress}
             />
        )}

        {/* Aggregation Core */}
        {isAggregating && (
             <Aggregator 
                result={logic.result}
                debugStr={logic.debugStr}
                selectedItems={logic.items.filter(i => i.isTop)}
                getX={getX}
                phase={progress}
             />
        )}
      
    </group>
  );
};

// Sub-component: A pair of blocks (Sort Val + Func Val)
const DataPair = ({ item, targetX, isTop, phase }: { item: TopNItem, targetX: number, isTop: boolean, phase: number }) => {
    
    // Dim if selection phase active and not top
    const dim = phase >= 2 && !isTop;
    
    const { x, opacity } = useSpring({
        x: targetX,
        opacity: dim ? 0.2 : 1,
        config: { tension: 120, friction: 14 }
    });

    return (
        <animated.group position-x={x}>
            {/* Sorting Column (Top Block) */}
            <group position={[0, 1.5, 0]}>
                <RoundedBox args={[1.2, 1.2, 0.5]} radius={0.1}>
                    <animated.meshStandardMaterial 
                        color={COLORS.sortCol} 
                        transparent 
                        opacity={opacity} 
                    />
                </RoundedBox>
                <Text position={[0, 0, 0.3]} fontSize={0.4} color="white" fontWeight="bold">
                    {item.sortVal}
                </Text>
                <Text position={[0, 0.8, 0]} fontSize={0.15} color={COLORS.sortCol}>
                    SortingCol
                </Text>
            </group>

            {/* Connection */}
            <mesh position={[0, 0.8, 0]}>
                 <cylinderGeometry args={[0.1, 0.1, 0.4]} />
                 <animated.meshBasicMaterial color="#555" transparent opacity={opacity} />
            </mesh>

            {/* Func Arg Column (Bottom Block) */}
            <group position={[0, 0, 0]}>
                <RoundedBox args={[1.2, 1.2, 0.5]} radius={0.1}>
                    <animated.meshStandardMaterial 
                        color={COLORS.funcCol} 
                        transparent 
                        opacity={opacity} 
                    />
                </RoundedBox>
                <Text position={[0, 0, 0.3]} fontSize={0.4} color="white" fontWeight="bold">
                    {item.funcVal}
                </Text>
                <Text position={[0, -0.8, 0]} fontSize={0.15} color={COLORS.funcCol}>
                    FuncArg
                </Text>
            </group>
        </animated.group>
    );
};

const TopZone = ({ count, startX, blockStep, phase }: any) => {
    const width = count * blockStep;
    const centerX = startX + width / 2;
    
    // Appear animation
    const { opacity, scaleX } = useSpring({
        opacity: phase >= 2 ? 1 : 0,
        scaleX: phase >= 2 ? 1 : 0,
        config: { tension: 200 }
    });

    return (
        <animated.group position={[centerX, 0.75, 0]} scale-x={scaleX}>
             {/* Glowing Frame */}
             <mesh>
                 <planeGeometry args={[width, 3.5]} />
                 <animated.meshBasicMaterial color={COLORS.primary} wireframe transparent opacity={opacity.to(o => o * 0.5)} />
             </mesh>
             
             {/* Label */}
             <Text position={[0, 2, 0]} fontSize={0.3} color={COLORS.primary}>
                 TOP {count}
             </Text>
        </animated.group>
    );
};

const Aggregator = ({ result, debugStr, selectedItems, getX, phase }: any) => {
    // 3.0 -> 4.0
    const t = Math.max(0, Math.min(1, phase - 3)); 
    
    // Core animation
    const { scale } = useSpring({
        scale: t > 0.8 ? 1.5 : 1,
        config: { tension: 200 }
    });

    return (
        <group>
            {/* Flying Particles from Selected Items to Center */}
            {selectedItems.map((item: TopNItem) => (
                 <AggregateParticle 
                    key={item.id}
                    startX={getX(item.sortedIndex)}
                    startY={0} // Func block is at Y=0
                    t={t}
                 />
            ))}

            {/* Central Core */}
            <group position={[0, -3, 0]}>
                 <animated.mesh scale={scale}>
                     <sphereGeometry args={[1, 32, 32]} />
                     <meshStandardMaterial color={COLORS.success} emissive={COLORS.success} emissiveIntensity={t > 0.8 ? 2 : 0.5} />
                 </animated.mesh>
                 
                 {t > 0.8 && (
                     <Text position={[0, -1.5, 0]} fontSize={0.5} color={COLORS.success} fontWeight="bold">
                         Result: {result}
                     </Text>
                 )}
                 {t > 0.8 && (
                     <Text position={[0, -2, 0]} fontSize={0.25} color="#aaa">
                         {debugStr}
                     </Text>
                 )}
            </group>
        </group>
    );
};

const AggregateParticle = ({ startX, startY, t }: any) => {
    // Fly to [0, -3, 0]
    if (t > 0.8) return null; // Disappear when absorbed

    const x = (1-t)*startX + t*0;
    const y = (1-t)*startY + t*(-3);
    
    return (
        <group position={[x, y, 1]}>
             <mesh>
                 <sphereGeometry args={[0.15]} />
                 <meshBasicMaterial color={COLORS.funcCol} />
             </mesh>
        </group>
    );
};
