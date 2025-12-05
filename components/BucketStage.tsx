import React from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { BucketItem, BucketDef } from '../hooks/useBucketLogic';

const AnimatedText = animated(Text);
import { COLORS } from '../constants';

interface BucketStageProps {
  progress: number; // 0 to 4
  logic: {
      items: BucketItem[];
      buckets: BucketDef[];
      rangeStart: number;
      rangeEnd: number;
      bucketNum: number;
      includeOutbound: boolean;
  };
}

export const BucketStage: React.FC<BucketStageProps> = ({ progress, logic }) => {
  // Layout: Buckets arranged horizontally.
  // Width of each bucket
  const BUCKET_WIDTH = 2.5;
  const GAP = 0.2;
  const TOTAL_WIDTH = logic.buckets.length * (BUCKET_WIDTH + GAP);
  const START_X = -TOTAL_WIDTH / 2 + BUCKET_WIDTH / 2;

  const getBucketX = (index: number) => START_X + index * (BUCKET_WIDTH + GAP);

  return (
    <group position={[0, -1, 0]}>
        <Text position={[0, 5.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            bucket(X, {logic.rangeStart}:{logic.rangeEnd}, {logic.bucketNum}, {logic.includeOutbound ? 'true' : 'false'})
        </Text>

        {/* Buckets */}
        {logic.buckets.map((bucket) => (
            <Bucket 
                key={bucket.index}
                bucket={bucket}
                x={getBucketX(bucket.index)}
                width={BUCKET_WIDTH}
            />
        ))}

        {/* Items */}
        {logic.items.map((item, i) => (
            <Item 
                key={item.id}
                item={item}
                index={i}
                totalItems={logic.items.length}
                getBucketX={getBucketX}
                progress={progress}
            />
        ))}

        {/* Result Vector Display */}
        <group position={[0, -3.5, 0]}>
            <Text position={[-4, 0, 0]} fontSize={0.4} color="white" anchorX="right">
                Result:
            </Text>
            <Text position={[-3.5, 0, 0]} fontSize={0.4} color="white" anchorX="left">
                [
            </Text>
            {logic.items.map((item, i) => (
                <ResultItem 
                    key={item.id}
                    item={item}
                    index={i}
                    progress={progress}
                />
            ))}
            <Text position={[-3.5 + logic.items.length * 1.0, 0, 0]} fontSize={0.4} color="white" anchorX="left">
                ]
            </Text>
        </group>
    </group>
  );
};

const Bucket = ({ bucket, x, width }: { bucket: BucketDef, x: number, width: number }) => {
    return (
        <group position={[x, 0, 0]}>
            {/* Container Visual */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[width, 1.5, 1]} />
                <meshStandardMaterial 
                    color={bucket.isOutbound ? COLORS.secondary : COLORS.primary} 
                    transparent 
                    opacity={0.2} 
                />
            </mesh>
            <Line 
                points={[
                    [-width/2, 1.25, 0], 
                    [-width/2, -0.25, 0], 
                    [width/2, -0.25, 0], 
                    [width/2, 1.25, 0]
                ]} 
                color={bucket.isOutbound ? COLORS.secondary : COLORS.primary} 
                lineWidth={2} 
            />
            
            {/* Label */}
            <Text position={[0, -0.6, 0]} fontSize={0.3} color="#aaa">
                {bucket.label}
            </Text>
            <Text position={[0, -1.0, 0]} fontSize={0.4} color="white" fontWeight="bold">
                Idx: {bucket.index}
            </Text>
        </group>
    );
};

const Item = ({ item, index, totalItems, getBucketX, progress }: { item: BucketItem, index: number, totalItems: number, getBucketX: (i: number) => number, progress: number }) => {
    // Phase 0: Start at top, spread out
    // Phase 1-2: Move to bucket
    // Phase 2-3: Show result

    const isMoving = progress >= 1;
    const isDone = progress >= 2;

    // Initial X: Spread out above
    const spreadWidth = totalItems * 1.2;
    const startX = -spreadWidth / 2 + index * 1.2;
    const startY = 3.5;

    // Target X: Bucket center (or null if no bucket)
    const targetX = item.bucketIndex !== null ? getBucketX(item.bucketIndex) : startX;
    const targetY = item.bucketIndex !== null ? 0.5 : startY; // Drop into bucket or stay

    const { x, y, scale, color } = useSpring({
        x: isMoving ? targetX : startX,
        y: isMoving ? targetY : startY,
        scale: (isMoving && item.bucketIndex === null) ? 0.5 : 1, // Shrink if NULL
        color: (isDone && item.bucketIndex === null) ? "#ff4444" : COLORS.funcCol,
        config: { tension: 100, friction: 14 }
    });

    const { opacity } = useSpring({
        opacity: (isMoving && item.bucketIndex === null) ? 0.5 : 1
    });

    return (
        <animated.group position-x={x} position-y={y} scale={scale}>
            <RoundedBox args={[0.8, 0.8, 0.2]} radius={0.1}>
                <animated.meshStandardMaterial color={color} transparent opacity={opacity} />
            </RoundedBox>
            <Text position={[0, 0, 0.11]} fontSize={0.4} color="white" fontWeight="bold">
                {item.val}
            </Text>
            
            {/* Result Index Badge (Floating above item in bucket) */}
            {isDone && item.bucketIndex !== null && (
                <group position={[0, 0.8, 0]}>
                    <RoundedBox args={[0.6, 0.4, 0.1]} radius={0.1}>
                        <meshStandardMaterial color={COLORS.success} />
                    </RoundedBox>
                    <Text position={[0, 0, 0.11]} fontSize={0.25} color="black" fontWeight="bold">
                        {item.bucketIndex}
                    </Text>
                </group>
            )}

            {/* NULL Badge */}
            {isDone && item.bucketIndex === null && (
                <Text position={[0, 0.8, 0]} fontSize={0.3} color="#ff4444" fontWeight="bold">
                    NULL
                </Text>
            )}
        </animated.group>
    );
};

const ResultItem = ({ item, index, progress }: { item: BucketItem, index: number, progress: number }) => {
    const isVisible = progress >= 2.5; // Show result vector at the end
    
    const { opacity, scale } = useSpring({
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0,
        delay: index * 100 // Stagger appearance
    });

    const text = item.bucketIndex === null ? "NULL" : item.bucketIndex.toString();
    const color = item.bucketIndex === null ? "#ff4444" : COLORS.success;

    return (
        <animated.group position={[-3.0 + index * 1.0, 0, 0]} scale={scale}>
            <AnimatedText 
                fontSize={0.4} 
                color={color} 
                fillOpacity={opacity}
                fontWeight="bold"
            >
                {text}
            </AnimatedText>
            <AnimatedText position={[0.5, -0.1, 0]} fontSize={0.4} color="white" fillOpacity={opacity}>
                ,
            </AnimatedText>
        </animated.group>
    );
};
