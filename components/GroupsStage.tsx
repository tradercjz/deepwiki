import React from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { GroupsItem, GroupResult } from '../hooks/useGroupsLogic';
import { COLORS } from '../constants';

const AnimatedText = animated(Text);

interface GroupsStageProps {
  progress: number; // 0 to 3
  logic: {
      items: GroupsItem[];
      groups: GroupResult[];
      mode: string;
  };
}

export const GroupsStage: React.FC<GroupsStageProps> = ({ progress, logic }) => {
  // Layout:
  // Top: Input items
  // Middle: Grouping animation (items move to clusters)
  // Bottom: Result structure

  const ITEM_SPACING = 1.2;
  const TOTAL_WIDTH = (logic.items.length - 1) * ITEM_SPACING;
  const START_X = -TOTAL_WIDTH / 2;

  // Calculate group positions
  const GROUP_SPACING = 2.5;
  const TOTAL_GROUP_WIDTH = (logic.groups.length - 1) * GROUP_SPACING;
  const GROUP_START_X = -TOTAL_GROUP_WIDTH / 2;

  return (
    <group position={[0, 0, 0]}>
        <Text position={[0, 5.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            groups(X, "{logic.mode}")
        </Text>

        {/* Input Items */}
        {logic.items.map((item, i) => {
            // Find target group position
            const groupIndex = logic.groups.findIndex(g => g.key === item.val);
            const groupX = GROUP_START_X + groupIndex * GROUP_SPACING;
            
            // Find position within group (stacking)
            // We need to know which index this item is within its group
            const indexInGroup = logic.groups[groupIndex].indices.indexOf(item.originalIndex);
            
            return (
                <Item 
                    key={item.id}
                    item={item}
                    startX={START_X + i * ITEM_SPACING}
                    targetX={groupX}
                    targetY={1 - indexInGroup * 0.6} // Stack downwards
                    progress={progress}
                />
            );
        })}

        {/* Group Labels */}
        {progress >= 1 && logic.groups.map((group, i) => (
            <GroupLabel 
                key={i}
                group={group}
                x={GROUP_START_X + i * GROUP_SPACING}
                progress={progress}
            />
        ))}

        {/* Result Display */}
        <ResultDisplay 
            groups={logic.groups} 
            mode={logic.mode} 
            progress={progress} 
        />
    </group>
  );
};

const Item = ({ item, startX, targetX, targetY, progress }: { item: GroupsItem, startX: number, targetX: number, targetY: number, progress: number }) => {
    // Phase 0: Start position
    // Phase 1: Move to group
    
    const isMoving = progress >= 1;
    
    const { x, y } = useSpring({
        x: isMoving ? targetX : startX,
        y: isMoving ? targetY : 3,
        config: { tension: 100, friction: 14 }
    });

    return (
        <animated.group position-x={x} position-y={y}>
            <RoundedBox args={[0.8, 0.5, 0.1]} radius={0.1}>
                <meshStandardMaterial color={COLORS.primary} />
            </RoundedBox>
            <Text position={[0, 0, 0.1]} fontSize={0.25} color="white">
                {item.val === null ? 'NULL' : item.val}
            </Text>
            <Text position={[0, 0.4, 0]} fontSize={0.2} color="#aaa">
                idx: {item.originalIndex}
            </Text>
        </animated.group>
    );
};

const GroupLabel = ({ group, x, progress }: { group: GroupResult, x: number, progress: number }) => {
    const { opacity } = useSpring({
        opacity: progress >= 1 ? 1 : 0
    });

    return (
        <animated.group position={[x, 2, 0]}>
            <AnimatedText position={[0, 0, 0]} fontSize={0.35} color={COLORS.secondary} fillOpacity={opacity}>
                Key: {group.key === null ? 'NULL' : group.key}
            </AnimatedText>
        </animated.group>
    );
};

const ResultDisplay = ({ groups, mode, progress }: { groups: GroupResult[], mode: string, progress: number }) => {
    const isVisible = progress >= 2;
    
    const { opacity, y } = useSpring({
        opacity: isVisible ? 1 : 0,
        y: isVisible ? -2 : -5
    });

    return (
        <animated.group position={[0, y, 0]}>
            <AnimatedText position={[0, 0, 0]} fontSize={0.4} color="white" fillOpacity={opacity} anchorY="bottom">
                Result ({mode})
            </AnimatedText>
            
            {/* Render based on mode */}
            <group position={[0, -1, 0]}>
                {groups.map((g, i) => (
                    <group key={i} position={[0, -i * 0.6, 0]}>
                        <AnimatedText 
                            position={[-2, 0, 0]} 
                            fontSize={0.3} 
                            color={COLORS.secondary} 
                            fillOpacity={opacity} 
                            anchorX="right"
                        >
                            {g.key === null ? 'NULL' : g.key} {mode === 'dict' ? '->' : ''}
                        </AnimatedText>
                        <AnimatedText 
                            position={[-1.8, 0, 0]} 
                            fontSize={0.3} 
                            color="white" 
                            fillOpacity={opacity} 
                            anchorX="left"
                        >
                            [{g.indices.join(', ')}]
                        </AnimatedText>
                    </group>
                ))}
            </group>
        </animated.group>
    );
};
