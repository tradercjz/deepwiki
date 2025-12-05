import React from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { SegmentItem } from '../hooks/useSegmentLogic';
import { COLORS } from '../constants';

const AnimatedText = animated(Text);

interface SegmentStageProps {
  progress: number; // 0 to 3
  logic: {
      items: SegmentItem[];
      segmentOffset: boolean;
  };
}

export const SegmentStage: React.FC<SegmentStageProps> = ({ progress, logic }) => {
  // Layout:
  // Top: Input items
  // Middle: Segment highlighting
  // Bottom: Result vector

  const ITEM_SPACING = 1.2;
  const TOTAL_WIDTH = (logic.items.length - 1) * ITEM_SPACING;
  const START_X = -TOTAL_WIDTH / 2;

  // Colors for segments
  const SEGMENT_COLORS = [COLORS.primary, COLORS.secondary, COLORS.funcCol, '#e67e22', '#9b59b6'];

  return (
    <group position={[0, 0, 0]}>
        <Text position={[0, 5.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            segment(X, {logic.segmentOffset ? 'true' : 'false'})
        </Text>

        {/* Items */}
        {logic.items.map((item, i) => (
            <Item 
                key={item.id}
                item={item}
                x={START_X + i * ITEM_SPACING}
                color={SEGMENT_COLORS[item.segmentId % SEGMENT_COLORS.length]}
                progress={progress}
            />
        ))}

        {/* Result Vector */}
        <group position={[0, -3, 0]}>
            <Text position={[-4, 0, 0]} fontSize={0.4} color="white" anchorX="right">
                Result:
            </Text>
            <Text position={[-3.5, 0, 0]} fontSize={0.4} color="white" anchorX="left">
                [
            </Text>
            {logic.items.map((item, i) => (
                <ResultItem 
                    key={i}
                    val={item.result}
                    index={i}
                    progress={progress}
                />
            ))}
            <Text position={[-3.5 + logic.items.length * 0.8, 0, 0]} fontSize={0.4} color="white" anchorX="left">
                ]
            </Text>
        </group>
    </group>
  );
};

const Item = ({ item, x, color, progress }: { item: SegmentItem, x: number, color: string, progress: number }) => {
    // Phase 0: Show items
    // Phase 1: Highlight segments (change color)
    
    const isHighlighted = progress >= 1;
    
    const { itemColor } = useSpring({
        itemColor: isHighlighted ? color : '#444',
        config: { duration: 500 }
    });

    return (
        <animated.group position={[x, 1, 0]}>
            <RoundedBox args={[0.8, 0.8, 0.1]} radius={0.1}>
                <animated.meshStandardMaterial color={itemColor} />
            </RoundedBox>
            <Text position={[0, 0, 0.1]} fontSize={0.35} color="white">
                {item.val === null ? 'NULL' : item.val}
            </Text>
            <Text position={[0, 1.2, 0]} fontSize={0.25} color="#aaa">
                {item.originalIndex}
            </Text>
        </animated.group>
    );
};

const ResultItem = ({ val, index, progress }: { val: number, index: number, progress: number }) => {
    const isVisible = progress >= 2;
    
    const { opacity, scale } = useSpring({
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0,
        delay: index * 50
    });

    return (
        <animated.group position={[-3.0 + index * 0.8, 0, 0]} scale={scale}>
            <AnimatedText 
                fontSize={0.4} 
                color={COLORS.success} 
                fillOpacity={opacity}
                fontWeight="bold"
            >
                {val}
            </AnimatedText>
            <AnimatedText position={[0.4, -0.1, 0]} fontSize={0.4} color="white" fillOpacity={opacity}>
                ,
            </AnimatedText>
        </animated.group>
    );
};
