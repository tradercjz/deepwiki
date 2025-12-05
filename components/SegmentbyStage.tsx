
import React, { useRef } from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import { SegmentbyState, SegmentItem, SegmentGroup } from '../hooks/useSegmentbyLogic';
import { COLORS } from '../constants';
import * as THREE from 'three';

interface SegmentbyStageProps {
  progress: number; // 0 to 4
  logic: SegmentbyState;
}

// Phases:
// 0-1: Presentation
// 1-2: Segmentation (Carriages Form)
// 2-3: Calculation (Spark moves through, Results appear sequentially)
// 3-4: Final Review

export const SegmentbyStage: React.FC<SegmentbyStageProps> = ({ progress, logic }) => {
  const BLOCK_WIDTH = 1.2;
  const GAP = 0.2;
  const TOTAL_WIDTH = logic.items.length * (BLOCK_WIDTH + GAP);
  const START_X = -TOTAL_WIDTH / 2 + BLOCK_WIDTH / 2;

  const getX = (idx: number) => START_X + idx * (BLOCK_WIDTH + GAP);

  const activeIndex = Math.min(Math.floor(progress), 3); // Phase index
  const transition = progress % 1;

  // Global phases
  const showCarriages = progress >= 1;
  const isCalculating = progress >= 2 && progress < 3;
  const isFinished = progress >= 3;

  return (
    <group position={[0, -1, 0]}>
        <Text position={[0, 4.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            segmentby (Group Consecutive Keys)
        </Text>

        {/* Data Items */}
        {logic.items.map((item) => {
            // Determine if result should be shown
            // If calculating (Phase 2), show if spark has passed
            // If finished (Phase 3), show all
            let showResult = isFinished;
            if (isCalculating) {
                const group = logic.groups[item.groupIndex];
                // Item's relative position in group (0 to 1)
                const itemRelativePos = item.indexInGroup / group.count;
                // Add a small buffer so it appears just after spark passes
                if (transition > itemRelativePos + (0.5/group.count)) {
                    showResult = true;
                }
            }

            return (
                <ItemStack 
                    key={item.id}
                    item={item}
                    x={getX(item.id)}
                    showResult={showResult}
                />
            );
        })}

        {/* Train Carriages (Segments) */}
        {showCarriages && logic.groups.map((group) => {
            const startX = getX(group.startIndex) - BLOCK_WIDTH/2 - 0.1;
            const width = group.count * (BLOCK_WIDTH + GAP) - GAP + 0.2;
            
            return (
                <Carriage 
                    key={group.id}
                    x={startX}
                    width={width}
                    group={group}
                    phase={progress}
                />
            );
        })}

        {/* Calculation Spark */}
        {isCalculating && logic.groups.map((group) => (
             <CalcSpark 
                key={`spark-${group.id}`}
                group={group}
                items={logic.items}
                getX={getX}
                progress={transition}
             />
        ))}

    </group>
  );
};

const ItemStack = ({ item, x, showResult }: { item: SegmentItem, x: number, showResult: boolean }) => {
    
    const { resScale, resOpacity } = useSpring({
        resScale: showResult ? 1 : 0,
        resOpacity: showResult ? 1 : 0,
        config: { tension: 200 }
    });

    return (
        <group position={[x, 0, 0]}>
            {/* Top: Segment Key */}
            <group position={[0, 2.0, 0]}>
                <RoundedBox args={[1.2, 0.8, 0.5]} radius={0.1}>
                    <meshStandardMaterial 
                        color="#e0e0e0" 
                        emissive="#333333"
                        roughness={0.5} 
                        metalness={0.1} 
                    />
                </RoundedBox>
                <Text position={[0, 0, 0.3]} fontSize={0.35} color="black" fontWeight="bold">
                    {item.segmentVal}
                </Text>
                <Text position={[0, 0.6, 0]} fontSize={0.15} color="#aaa">
                    Key
                </Text>
            </group>

            {/* Connection Key -> Input */}
            <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.4]} />
                <meshStandardMaterial color="#555" />
            </mesh>

            {/* Middle: Input Value (Static) */}
            <group position={[0, 0.8, 0]}>
                <RoundedBox args={[1.2, 1.0, 0.5]} radius={0.1}>
                    <meshStandardMaterial 
                        color={COLORS.primary} 
                        emissive={COLORS.primary}
                        emissiveIntensity={0.2}
                    />
                </RoundedBox>
                <Text position={[0, 0, 0.3]} fontSize={0.4} color="white" fontWeight="bold">
                    {item.inputVal}
                </Text>
                <Text position={[0, 0.7, 0]} fontSize={0.15} color={COLORS.primary}>
                    Input
                </Text>
            </group>

            {/* Connection Input -> Result */}
            {showResult && (
                <animated.mesh position={[0, 0.1, 0]} scale-y={resScale}>
                    <cylinderGeometry args={[0.1, 0.1, 0.6]} />
                    <meshStandardMaterial color={COLORS.success} />
                </animated.mesh>
            )}

            {/* Bottom: Result Value (Appears) */}
            <animated.group position={[0, -0.8, 0]} scale={resScale} visible={resOpacity.to(o => o > 0.1)}>
                <RoundedBox args={[1.2, 1.0, 0.5]} radius={0.1}>
                    <meshStandardMaterial 
                        color={COLORS.success} 
                        emissive={COLORS.success}
                        emissiveIntensity={0.5}
                    />
                </RoundedBox>
                
                <Text position={[0, 0, 0.3]} fontSize={0.4} color="black" fontWeight="bold">
                    {item.resultVal}
                </Text>
                
                <Text position={[0, -0.7, 0]} fontSize={0.15} color={COLORS.success}>
                    Result
                </Text>
            </animated.group>
        </group>
    );
};

const Carriage = ({ x, width, group, phase }: { x: number, width: number, group: SegmentGroup, phase: number }) => {
    const { scaleY, opacity } = useSpring({
        scaleY: phase >= 1 ? 1 : 0,
        opacity: phase >= 1 ? 1 : 0,
        config: { tension: 200 }
    });

    return (
        <animated.group position={[x + width/2, 0.5, 0]} scale-y={scaleY}>
            {/* Wireframe Box enclosing Top and Input */}
            <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[width, 3.5, 0.8]} />
                <animated.meshBasicMaterial color={COLORS.secondary} wireframe transparent opacity={opacity.to(o => o * 0.3)} />
            </mesh>
            
            {/* Group Label */}
            <Text position={[0, 2.8, 0]} fontSize={0.25} color={COLORS.secondary}>
                Seg {group.segmentVal}
            </Text>
        </animated.group>
    );
};

const CalcSpark = ({ group, items, getX, progress }: { group: SegmentGroup, items: SegmentItem[], getX: (i:number)=>number, progress: number }) => {
    // Determine current item index being processed
    const relativeIdx = Math.min(group.count - 1, Math.floor(progress * group.count));
    const currentItem = items.find(i => i.groupIndex === group.id && i.indexInGroup === relativeIdx);

    // Smooth Spark position
    const startX = getX(group.startIndex);
    const endX = getX(group.startIndex + group.count - 1);
    const x = startX + (endX - startX) * progress;

    return (
        <group position={[x, -0.8, 0.8]}>
            <mesh>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color={COLORS.gold} emissive={COLORS.gold} emissiveIntensity={3} />
            </mesh>
            <pointLight distance={3} intensity={4} color={COLORS.gold} />
            
            {/* Dynamic Calculation Bubble */}
            {currentItem && (
                <group position={[0, 0.8, 0]}>
                    <RoundedBox args={[2.5, 0.6, 0.1]} radius={0.1}>
                        <meshBasicMaterial color="black" transparent opacity={0.8} />
                    </RoundedBox>
                    <Text position={[0, 0, 0.1]} fontSize={0.25} color={COLORS.gold} fontWeight="bold">
                        {currentItem.calcStr}
                    </Text>
                </group>
            )}
        </group>
    );
};
