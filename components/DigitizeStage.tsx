import React from 'react';
import { Text, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { DigitizeItem } from '../hooks/useDigitizeLogic';
import { COLORS } from '../constants';

const AnimatedText = animated(Text);

interface DigitizeStageProps {
  progress: number; // 0 to 3
  logic: {
      items: DigitizeItem[];
      bins: number[];
      right: boolean;
      isIncreasing: boolean;
  };
}

export const DigitizeStage: React.FC<DigitizeStageProps> = ({ progress, logic }) => {
  // Layout:
  // Top: Number line with bins
  // Middle: Items falling
  // Bottom: Result vector

  // Scale: Map value to X
  const allValues = [...logic.items.map(i => i.val), ...logic.bins];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const WIDTH = 10;
  const scaleX = (v: number) => ((v - minVal) / range - 0.5) * WIDTH;

  return (
    <group position={[0, 0, 0]}>
        <Text position={[0, 5.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            digitize(x, bins, {logic.right ? 'true' : 'false'})
        </Text>

        {/* Number Line */}
        <Line 
            points={[[-WIDTH/2 - 1, 2, 0], [WIDTH/2 + 1, 2, 0]]} 
            color="#666" 
            lineWidth={1} 
        />

        {/* Bins */}
        {logic.bins.map((binVal, i) => {
            const x = scaleX(binVal);
            return (
                <group key={i} position={[x, 2, 0]}>
                    <Line 
                        points={[[0, 0.5, 0], [0, -0.5, 0]]} 
                        color={COLORS.secondary} 
                        lineWidth={2} 
                    />
                    <Text position={[0, 0.8, 0]} fontSize={0.35} color={COLORS.secondary}>
                        {binVal}
                    </Text>
                </group>
            );
        })}

        {/* Region Labels (Indices) */}
        {/* We need to label regions 0, 1, 2... */}
        {/* Region i is between bins[i-1] and bins[i]? Or depends on logic? */}
        {/* The result index corresponds to the bin index. */}
        {/* If increasing: index 0 is < bins[0] (if right=false, > bins[0] is index 1?) */}
        {/* Let's just visualize where the items land and show their result index. */}
        
        {/* Items */}
        {logic.items.map((item) => (
            <Item 
                key={item.id}
                item={item}
                scaleX={scaleX}
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
                    val={item.resultIndex}
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

const Item = ({ item, scaleX, progress }: { item: DigitizeItem, scaleX: (v: number) => number, progress: number }) => {
    // Phase 0: Show above line
    // Phase 1: Drop to line
    // Phase 2: Show index label
    
    const x = scaleX(item.val);
    
    const { y, opacity } = useSpring({
        y: progress >= 1 ? 2 : 4,
        opacity: progress >= 0 ? 1 : 0,
        config: { tension: 120, friction: 14 }
    });

    const showLabel = progress >= 2;
    const { labelOpacity } = useSpring({
        labelOpacity: showLabel ? 1 : 0
    });

    return (
        <animated.group position-x={x} position-y={y}>
            <mesh>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshStandardMaterial color={COLORS.primary} />
            </mesh>
            <Text position={[0, 0.4, 0]} fontSize={0.3} color="white">
                {item.val}
            </Text>
            
            {/* Result Index Label */}
            <AnimatedText 
                position={[0, -0.8, 0]} 
                fontSize={0.4} 
                color={COLORS.success} 
                fillOpacity={labelOpacity}
                fontWeight="bold"
            >
                {item.resultIndex}
            </AnimatedText>
        </animated.group>
    );
};

const ResultItem = ({ val, index, progress }: { val: number, index: number, progress: number }) => {
    const isVisible = progress >= 3;
    
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
