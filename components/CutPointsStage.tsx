import React from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { CutPointsItem } from '../hooks/useCutPointsLogic';
import { COLORS } from '../constants';

const AnimatedText = animated(Text);

interface CutPointsStageProps {
  progress: number; // 0 to 3
  logic: {
      items: CutPointsItem[];
      cutPoints: number[];
      binNum: number;
      totalCount: number;
      targetSize: number;
  };
}

export const CutPointsStage: React.FC<CutPointsStageProps> = ({ progress, logic }) => {
  // Layout: Horizontal line of items.
  // Each item width proportional to its freq? Or just equal spacing?
  // Equal spacing is easier to read, but freq implies "weight".
  // Let's use equal spacing for items, but show freq as height or label.
  
  const ITEM_SPACING = 1.5;
  const TOTAL_WIDTH = (logic.items.length - 1) * ITEM_SPACING;
  const START_X = -TOTAL_WIDTH / 2;

  return (
    <group position={[0, -1, 0]}>
        <Text position={[0, 5.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            cutPoints(X, {logic.binNum})
        </Text>
        <Text position={[0, 4.8, 0]} fontSize={0.4} color="#aaa">
            Total: {logic.totalCount}, Target per bin: {logic.targetSize}
        </Text>

        {/* Items */}
        {logic.items.map((item, i) => (
            <Item 
                key={item.id}
                item={item}
                x={START_X + i * ITEM_SPACING}
                progress={progress}
            />
        ))}

        {/* Cut Lines */}
        {progress >= 1 && logic.cutPoints.map((val, i) => {
            // Find position relative to items
            // This is tricky because cutPoints are values, not indices.
            // But we know the logic derived them from indices.
            // Let's just show them as vertical lines at the "split" positions.
            // We need to find where this value falls in the sorted items.
            
            // Actually, for visualization, we want to show WHERE the cut happened.
            // The cut point `val` is the START of the next bin.
            // So the cut line should be BEFORE the item with value `val`.
            // Or if it's the last point, after the last item.
            
            // Let's find the first item >= val.
            const itemIndex = logic.items.findIndex(item => item.val >= val);
            let xPos = 0;
            if (itemIndex !== -1) {
                // Before this item
                xPos = START_X + itemIndex * ITEM_SPACING - ITEM_SPACING / 2;
            } else {
                // After last item
                xPos = START_X + (logic.items.length - 1) * ITEM_SPACING + ITEM_SPACING / 2;
            }
            
            // Special case: First point is start.
            if (i === 0) xPos = START_X - ITEM_SPACING / 2;

            return (
                <CutLine 
                    key={i} 
                    val={val} 
                    x={xPos} 
                    progress={progress} 
                    isBoundary={i === 0 || i === logic.cutPoints.length - 1}
                />
            );
        })}

        {/* Result Vector */}
        <group position={[0, -3.5, 0]}>
            <Text position={[-4, 0, 0]} fontSize={0.4} color="white" anchorX="right">
                Result:
            </Text>
            <Text position={[-3.5, 0, 0]} fontSize={0.4} color="white" anchorX="left">
                [
            </Text>
            {logic.cutPoints.map((val, i) => (
                <ResultItem 
                    key={i}
                    val={val}
                    index={i}
                    progress={progress}
                />
            ))}
            <Text position={[-3.5 + logic.cutPoints.length * 1.2, 0, 0]} fontSize={0.4} color="white" anchorX="left">
                ]
            </Text>
        </group>
    </group>
  );
};

const Item = ({ item, x, progress }: { item: CutPointsItem, x: number, progress: number }) => {
    const { scale } = useSpring({
        scale: progress >= 0 ? 1 : 0,
        delay: item.id * 100
    });

    return (
        <animated.group position={[x, 0, 0]} scale={scale}>
            {/* Box representing item */}
            <RoundedBox args={[1, 1 + item.freq * 0.2, 0.2]} radius={0.1} position={[0, (1 + item.freq * 0.2)/2 - 0.5, 0]}>
                <meshStandardMaterial color={COLORS.primary} />
            </RoundedBox>
            
            {/* Value */}
            <Text position={[0, -0.8, 0]} fontSize={0.4} color="white" fontWeight="bold">
                {item.val}
            </Text>
            
            {/* Freq/CumFreq info */}
            <Text position={[0, 1.5 + item.freq * 0.2, 0]} fontSize={0.25} color="#aaa">
                Freq: {item.freq}
            </Text>
            <Text position={[0, 1.8 + item.freq * 0.2, 0]} fontSize={0.25} color="#888">
                Cum: {item.cumFreq}
            </Text>
        </animated.group>
    );
};

const CutLine = ({ val, x, progress, isBoundary }: { val: number, x: number, progress: number, isBoundary: boolean }) => {
    const { height, opacity } = useSpring({
        height: progress >= 1.5 ? 4 : 0,
        opacity: progress >= 1.5 ? 1 : 0
    });

    return (
        <animated.group position={[x, 1, 0]}>
            <animated.mesh position={[0, 0, 0]} scale-y={height}>
                <planeGeometry args={[0.05, 1]} />
                <animated.meshBasicMaterial color={COLORS.secondary} transparent opacity={opacity} />
            </animated.mesh>
            <AnimatedText 
                position={[0, 2.5, 0]} 
                fontSize={0.4} 
                color={COLORS.secondary} 
                fillOpacity={opacity}
                fontWeight="bold"
            >
                {val}
            </AnimatedText>
        </animated.group>
    );
};

const ResultItem = ({ val, index, progress }: { val: number, index: number, progress: number }) => {
    const isVisible = progress >= 2.5;
    
    const { opacity, scale } = useSpring({
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0,
        delay: index * 100
    });

    return (
        <animated.group position={[-3.0 + index * 1.2, 0, 0]} scale={scale}>
            <AnimatedText 
                fontSize={0.4} 
                color={COLORS.success} 
                fillOpacity={opacity}
                fontWeight="bold"
            >
                {val}
            </AnimatedText>
            <AnimatedText position={[0.6, -0.1, 0]} fontSize={0.4} color="white" fillOpacity={opacity}>
                ,
            </AnimatedText>
        </animated.group>
    );
};
