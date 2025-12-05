
import React from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { GroupingState, GroupItem, GroupData } from '../hooks/useGroupingLogic';
import { COLORS } from '../constants';

interface GroupingStageProps {
  progress: number; // 0 to 4
  logic: GroupingState;
  setHoveredIndex?: (i: number | null) => void;
}

export const GroupingStage: React.FC<GroupingStageProps> = ({ progress, logic, setHoveredIndex }) => {
  // Steps:
  // 0-1: Presentation
  // 1-2: Grouping (Physical Sort for Groupby; Virtual Hubs for Contextby)
  // 2-3: Aggregation (Beams)
  // 3-4: Output

  const ITEM_WIDTH = 1.6; 
  const GAP = 0.3;
  // Calculate width based on sorted layout to position Hubs correctly
  const TOTAL_WIDTH = logic.items.length * (ITEM_WIDTH + GAP) + logic.groups.length * 0.5;
  const START_X = -TOTAL_WIDTH / 2;

  // Virtual/Sorted X positions (Used for Groupby Items AND Contextby Hubs)
  const getSortedX = (sortedIndex: number, groupIndex: number) => {
      return START_X + sortedIndex * (ITEM_WIDTH + GAP) + groupIndex * 0.5;
  };

  // Original X positions (Used for Contextby Items)
  const getOriginalX = (index: number) => {
      return START_X + index * (ITEM_WIDTH + GAP);
  };

  const isAggregating = progress >= 2;

  // Calculate target X for items based on phase & mode
  const getTargetX = (item: GroupItem) => {
      if (logic.mode === 'contextby') {
          // Contextby: Items STAY in original sequence.
          // They do not physically sort.
          return getOriginalX(item.originalIndex);
      }
      
      // Groupby: Items physically move to sorted clusters
      if (progress >= 1) {
          return getSortedX(item.sortedIndex, item.groupIndex);
      }
      return getOriginalX(item.originalIndex);
  };

  // Helper for AggregateAnim to know where items are visually located right now
  const getItemVisualX = (item: GroupItem) => {
      if (logic.mode === 'contextby') return getOriginalX(item.originalIndex);
      // For groupby, during Aggregation (Phase 2+), they are at sorted pos
      return getSortedX(item.sortedIndex, item.groupIndex);
  };

  return (
    <group position={[0, -1, 0]}>
        <Text position={[0, 5.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            {logic.mode === 'groupby' ? "groupby (Reduce)" : "contextby (Preserve Order)"}
        </Text>

        {/* Input Items */}
        {logic.items.map((item) => {
            const group = logic.groups[item.groupIndex];
            // Show result on item only in contextby mode after calc phase
            const showResult = logic.mode === 'contextby' && progress >= 3.0;
            
            return (
                <ItemBlock 
                    key={item.id}
                    item={item}
                    targetX={getTargetX(item)}
                    phase={progress}
                    mode={logic.mode}
                    result={group ? group.result : 0}
                    showResult={showResult}
                    onHover={setHoveredIndex}
                />
            );
        })}

        {/* Physical Group Brackets (Only for Groupby where items cluster) */}
        {logic.mode === 'groupby' && progress >= 1 && progress < 3 && logic.groups.map((group, i) => (
            <GroupBracket 
                key={group.sym}
                group={group}
                startX={getSortedX(group.startIndex, i)}
                width={group.items.length * (ITEM_WIDTH + GAP) - GAP}
                phase={progress}
            />
        ))}

        {/* Aggregation Hubs & Beams */}
        {isAggregating && logic.groups.map((group, i) => {
            // Hub Position: Always based on Sorted Logic to keep groups distinct in space
            // Even if items are scattered below
            const hubX = getSortedX(group.startIndex, i) + (group.items.length * (ITEM_WIDTH + GAP) - GAP)/2;
            
            return (
                <AggregateAnim 
                    key={`agg-${group.sym}`}
                    group={group}
                    groupCenterX={hubX}
                    phase={progress}
                    mode={logic.mode}
                    getItemVisualX={getItemVisualX}
                />
            );
        })}

    </group>
  );
};

const ItemBlock = ({ item, targetX, phase, mode, result, showResult, onHover }: { item: GroupItem, targetX: number, phase: number, mode: string, result: number, showResult: boolean, onHover?: (i: number | null) => void }) => {
    
    let scale = 1;
    let opacity = 1;

    // Fade out original items in groupby mode during output phase (replaced by summary block)
    if (mode === 'groupby' && phase > 3.2) {
        scale = 0; 
        opacity = 0;
    }

    const { x, s, o, resScale } = useSpring({
        x: targetX,
        s: scale,
        o: opacity,
        resScale: showResult ? 1 : 0,
        config: { tension: 120, friction: 14 }
    });

    return (
        <animated.group 
            position-x={x} 
            scale={s}
            onPointerOver={(e) => { e.stopPropagation(); onHover && onHover(item.id); }}
            onPointerOut={() => { onHover && onHover(null); }}
        >
            {/* Top Block: Grouping Col (Key) */}
            <group position={[0, 1.2, 0]}>
                <RoundedBox args={[1.4, 0.8, 0.2]} radius={0.1}>
                    <animated.meshStandardMaterial color={COLORS.sortCol} transparent opacity={o} />
                </RoundedBox>
                <Text position={[0, 0, 0.22]} fontSize={0.35} color="white" fontWeight="bold">
                    {item.sym}
                </Text>
                <Text position={[0, 0.6, 0]} fontSize={0.15} color="#aaa">
                    Key
                </Text>
            </group>

            {/* Bottom Block: Func Arg (Value) */}
            <group position={[0, 0, 0]}>
                <RoundedBox args={[1.4, 1.2, 0.2]} radius={0.1}>
                    <animated.meshStandardMaterial color={COLORS.funcCol} transparent opacity={o} />
                </RoundedBox>
                <Text 
                    position={[0, 0, 0.22]} 
                    fontSize={0.5} 
                    color="white" 
                    fontWeight="bold"
                    outlineWidth={0.03}
                    outlineColor="black"
                >
                    {item.val}
                </Text>
                <Text position={[0, -0.8, 0]} fontSize={0.15} color="#aaa">
                    Value
                </Text>
            </group>

            {/* Result Badge (Attached to Item) - Enhanced for visibility */}
            <animated.group position={[0, 2.4, 0]} scale={resScale}>
                 <RoundedBox args={[1.6, 0.7, 0.1]} radius={0.1}>
                     <meshStandardMaterial color={COLORS.success} emissive={COLORS.success} emissiveIntensity={0.5} />
                 </RoundedBox>
                 <Text position={[0, 0, 0.1]} fontSize={0.35} color="black" fontWeight="bold">
                     = {result}
                 </Text>
            </animated.group>

        </animated.group>
    );
};

const GroupBracket = ({ group, startX, width, phase }: any) => {
    const visible = phase >= 1 && phase < 3;
    const { opacity } = useSpring({
        opacity: visible ? 1 : 0,
        config: { tension: 200 }
    });

    return (
        <animated.group position={[startX + width/2, 0, 0]}>
            <mesh position={[0, -0.8, 0]}>
                <boxGeometry args={[width + 0.2, 0.1, 0.1]} />
                <animated.meshStandardMaterial color={COLORS.secondary} transparent opacity={opacity} />
            </mesh>
            <Text position={[0, -1.2, 0]} fontSize={0.25} color={COLORS.secondary} fillOpacity={visible ? 1 : 0}>
                {group.sym}
            </Text>
        </animated.group>
    );
};

const AggregateAnim = ({ group, groupCenterX, phase, mode, getItemVisualX }: { group: GroupData, groupCenterX: number, phase: number, mode: string, getItemVisualX: (i: GroupItem) => number }) => {
    // Aggregation (2->3)
    const tAgg = Math.max(0, Math.min(1, phase - 2));
    // Output (3->4)
    const tOut = Math.max(0, Math.min(1, phase - 3));

    // Width helper
    const groupWidth = group.items.length * 1.9; 

    return (
        <group>
            {/* The Core (Aggregation Hub) */}
            <group position={[groupCenterX, 3.5, 0]}>
                 <mesh scale={tAgg * (mode === 'contextby' && phase > 3.2 ? 0 : 1)}> 
                     <sphereGeometry args={[0.6]} />
                     <meshStandardMaterial color={COLORS.gold} emissive={COLORS.gold} emissiveIntensity={1} />
                 </mesh>
                 
                 {/* Hub Result Label */}
                 {tAgg > 0.8 && mode === 'groupby' && (
                     <Text position={[0, 0.9, 0]} fontSize={0.5} color={COLORS.gold} fontWeight="bold">
                         {group.result}
                     </Text>
                 )}

                 {/* Contextby Group Label (Since no brackets) */}
                 {mode === 'contextby' && tAgg > 0.1 && tOut < 0.2 && (
                     <Text position={[0, 1.2, 0]} fontSize={0.4} color={COLORS.gold}>
                         Group: {group.sym}
                     </Text>
                 )}
            </group>

            {/* Beams: Values -> Core -> Values */}
            {tAgg > 0.1 && tAgg < 0.9 && group.items.map((item: any) => (
                <Line 
                    key={`beam-up-${item.id}`}
                    points={[
                        [getItemVisualX(item), 0, 0], // From Item Current Pos
                        [groupCenterX, 3.5, 0]        // To Hub
                    ]}
                    color={COLORS.funcCol}
                    lineWidth={2}
                    transparent
                    opacity={1 - Math.abs(tAgg - 0.5)*2}
                />
            ))}
            
            {/* Broadcast Beams (Contextby only): Core -> Values */}
            {mode === 'contextby' && tOut > 0.1 && tOut < 0.8 && group.items.map((item: any) => (
                <Line 
                    key={`beam-down-${item.id}`}
                    points={[
                        [groupCenterX, 3.5, 0],       // From Hub
                        [getItemVisualX(item), 2.4, 0] // To Item Top (Updated to match badge position)
                    ]}
                    color={COLORS.success}
                    lineWidth={2}
                    transparent
                    opacity={1 - Math.abs(tOut - 0.5)*2}
                />
            ))}

            {/* Groupby Output Visualization (Reduce to single block) */}
            {tOut > 0.1 && mode === 'groupby' && (
                <group position={[groupCenterX, 3.5 - tOut * 3.5, 0]}>
                        <RoundedBox args={[Math.max(2, groupWidth*0.8), 1.2, 0.5]} radius={0.1}>
                            <meshStandardMaterial color={COLORS.success} />
                        </RoundedBox>
                        <Text position={[0, 0, 0.3]} fontSize={0.4} color="white" fontWeight="bold">
                            {group.sym} : {group.result}
                        </Text>
                </group>
            )}
        </group>
    );
};
